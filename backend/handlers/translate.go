package handlers

import (
	"ai-assistant/db"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type TranslateRequest struct {
	ThreadID       string `json:"thread_id"`
	SourceText     string `json:"source_text"`
	LLM            string `json:"llm"`
	SourceLanguage string `json:"source_language"`
	TargetLanguage string `json:"target_language"`
	Tone           string `json:"tone"`
}

type TranslateResponse struct {
	Translation string `json:"translation"`
}

// @Summary Translate text
// @Description Translate text from one language to another
// @Tags LLM
// @Accept json
// @Produce json
// @Param request body TranslateRequest true "Translation request"
// @Success 200 {object} TranslateResponse "Translated text"
// @Failure 400 {object} ErrorResponse "Bad request"
// @Failure 404 {object} ErrorResponse "Translation thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /translate [post]
func (h *Handler) handleTranslate(c echo.Context) error {
	startTime := time.Now()
	log.Info().Msg("Handling translate request")

	// 1. Parse and validate request
	translateReq, err := h.parseAndValidateTranslateRequest(c)
	if err != nil {
		return err
	}

	// 2. Retrieve translation thread
	thread, err := h.getTranslationThread(c, translateReq.ThreadID)
	if err != nil {
		return err
	}

	// 3. Create translation entry
	translation, err := h.createTranslation(thread.ID, translateReq)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 4. Process translation
	if err := h.processTranslation(c, translation); err != nil {
		log.Error().Err(err).Uint("translation_thread_id", thread.ID).Msg("Translation processing failed")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 5. Update translation and translation thread
	if err := h.updateTranslationAndThread(translation, thread); err != nil {
		log.Error().Err(err).Str("translation_thread_id", translateReq.ThreadID).Msg("Failed to update records")
	}

	logCompletedTranslation(translateReq.ThreadID, len(translation.TranslatedText), startTime)
	return c.JSON(http.StatusOK, Response[db.Translation]{
		Data: *translation,
	})
}

func (h *Handler) parseAndValidateTranslateRequest(c echo.Context) (TranslateRequest, error) {
	var translateReq TranslateRequest
	if err := c.Bind(&translateReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind translate request")
		return TranslateRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Set default tone if not provided
	if translateReq.Tone == "" {
		translateReq.Tone = "formal"
	}

	// Validate required fields
	if translateReq.SourceText == "" || translateReq.LLM == "" ||
		translateReq.SourceLanguage == "" || translateReq.TargetLanguage == "" ||
		translateReq.ThreadID == "" {
		log.Error().Msg("source_text, llm, source_language, target_language, and thread_id are required")
		return TranslateRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "source_text, llm, source_language, target_language, and thread_id are required",
		})
	}

	// Log sanitized request
	log.Info().
		Str("thread_id", translateReq.ThreadID).
		Str("llm", translateReq.LLM).
		Int("source_text_length", len(translateReq.SourceText)).
		Str("source_language", translateReq.SourceLanguage).
		Str("target_language", translateReq.TargetLanguage).
		Str("tone", translateReq.Tone).
		Msg("Translation request received")

	return translateReq, nil
}

func (h *Handler) getTranslationThread(c echo.Context, threadID string) (*db.TranslationThread, error) {
	var thread *db.TranslationThread
	result := h.db.First(thread, threadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", threadID).Msg("Translation thread not found")
			return nil, c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translation thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", threadID).Msg("Failed to fetch translation thread")
		return nil, c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	return thread, nil
}

func (h *Handler) createTranslation(threadID uint, translateReq TranslateRequest) (*db.Translation, error) {
	sourceLang := getLanguageFullName(translateReq.SourceLanguage)
	targetLang := getLanguageFullName(translateReq.TargetLanguage)
	tone := getToneDescription(translateReq.Tone)
	systemPrompt := getSystemPrompt(sourceLang, targetLang, tone, translateReq.SourceText)

	translation := &db.Translation{
		SourceText:     translateReq.SourceText,
		TranslatedText: "",
		LLM:            translateReq.LLM,
		ThreadID:       threadID,
		SourceLanguage: translateReq.SourceLanguage,
		TargetLanguage: translateReq.TargetLanguage,
		Tone:           translateReq.Tone,
		Instructions:   systemPrompt,
		CreatedAt:      time.Now(),
	}

	if err := h.db.Create(&translation).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create translation")
		return nil, err
	}

	log.Info().
		Uint("translation_id", translation.ID).
		Uint("thread_id", threadID).
		Msg("Translation entry created")

	return translation, nil
}

func (h *Handler) processTranslation(c echo.Context, translation *db.Translation) error {
	var translatedText string

	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model: translation.LLM,
		Messages: []api.Message{
			{
				Role:    "user",
				Content: translation.Instructions,
			},
		},
		Format: translateResponseSchema,
		Stream: func() *bool { b := false; return &b }(),
	}, func(response api.ChatResponse) error {
		var translateResponse TranslateResponse
		if err := json.Unmarshal([]byte(response.Message.Content), &translateResponse); err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal translate response")
			return err
		}

		translatedText = translateResponse.Translation
		return nil
	})

	if err != nil {
		return err
	}

	// Store the translated text in our translation object
	translation.TranslatedText = translatedText
	return nil
}

func (h *Handler) updateTranslationAndThread(translation *db.Translation, translationThread *db.TranslationThread) error {
	// Update the translation with the translated text
	if err := h.db.Model(translation).Update("translated_text", translation.TranslatedText).Error; err != nil {
		log.Error().Err(err).Uint("translation_id", translation.ID).Msg("Failed to update translation")
		return err
	}

	// Update translation thread's updated_at timestamp
	return h.db.Model(translationThread).Update("updated_at", time.Now()).Error
}

func logCompletedTranslation(threadID string, responseLength int, startTime time.Time) {
	log.Info().
		Str("thread_id", threadID).
		Int("response_length", responseLength).
		Dur("total_duration_ms", time.Since(startTime)).
		Msg("Translation completed")
}

func getLanguageFullName(langCode string) string {
	languageMap := map[string]string{
		"fa":      "Persian (Farsi)",
		"en":      "English",
		"ar":      "Modern Standard Arabic",
		"fr":      "French",
		"de":      "German",
		"es":      "Spanish",
		"persian": "Persian (Farsi)",
		"english": "English",
		"arabic":  "Modern Standard Arabic",
		"french":  "French",
		"german":  "German",
		"spanish": "Spanish",
	}
	if lang, ok := languageMap[langCode]; ok {
		return lang
	}
	return langCode
}

func getToneDescription(tone string) string {
	toneMap := map[string]string{
		"formal":    "formal and professional",
		"casual":    "casual and conversational",
		"technical": "technical and precise",
		"friendly":  "friendly and approachable",
	}
	if tone, ok := toneMap[tone]; ok {
		return tone
	}
	return tone
}

func getSystemPrompt(sourceLanguage string, targetLanguage string, toneStyle string, text string) string {
	return fmt.Sprintf(`You are a highly skilled professional translator with expertise in %s and %s languages.
	Your task is to translate the provided text:
	- From: %s
	- To: %s

	Guidelines:
	1. Maintain accurate meaning and context
	2. Adapt cultural references appropriately
	3. Use %s language
	4. Preserve formatting and structure
	5. Only respond with the translation
	6. Do not include explanations or notes

	Text to translate:
	%s`,
		sourceLanguage,
		targetLanguage,
		sourceLanguage,
		targetLanguage,
		toneStyle,
		text,
	)
}

var translateResponseSchema = json.RawMessage(`{"type": "object", "properties": {"translation": {"type": "string"}}, "required": ["translation"]}`)
