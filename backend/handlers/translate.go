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
)

// @Summary Get all translations
// @Description Retrieve a paginated list of all translation records, ordered by creation date (newest first)
// @Tags Translations
// @Produce json
// @Success 200 {object} PaginatedResponse[db.Translation] "List of translations with pagination info"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations [get]
// @ID getTranslations
func (h *Handler) handleGetAllTranslations(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all translations request")

	var translations []db.Translation
	result := h.db.Order("created_at DESC").Find(&translations)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translations")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("translation_count", len(translations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched translations")

	return c.JSON(http.StatusOK, PaginatedResponse[db.Translation]{
		Data:        translations,
		HasNext:     len(translations) > 10,
		Total:       len(translations),
		CurrentPage: 1,
		TotalPages:  len(translations) / 10,
	})
}

// @Summary Get translation by ID
// @Description Retrieve a specific translation record by its unique identifier
// @Tags Translations
// @Produce json
// @Param id path string true "Translation ID" example:"123"
// @Success 200 {object} Response[db.Translation] "Translation details"
// @Failure 404 {object} ErrorResponse "Translation not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations/{id} [get]
// @ID getTranslation
func (h *Handler) handleGetTranslationById(c echo.Context) error {
	id := c.Param("id")

	var translation db.Translation
	result := h.db.Where("id = ?", id).First(&translation)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translation")
		return c.JSON(http.StatusNotFound, ErrorResponse{Message: "Translation not found"})
	}

	return c.JSON(http.StatusOK, Response[db.Translation]{Data: translation})
}

// @Summary Delete translation by ID
// @Description Delete a specific translation record by its unique identifier
// @Tags Translations
// @Produce json
// @Param id path string true "Translation ID" example:"123"
// @Success 200 {object} Response[db.Translation] "Translation deleted successfully"
// @Failure 404 {object} ErrorResponse "Translation not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations/{id} [delete]
// @ID deleteTranslation
func (h *Handler) handleDeleteTranslation(c echo.Context) error {
	id := c.Param("id")

	var translation db.Translation
	result := h.db.Where("id = ?", id).First(&translation)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translation")
		return c.JSON(http.StatusNotFound, ErrorResponse{Message: "Translation not found"})
	}

	log.Info().
		Uint("translation_id", translation.ID).
		Msg("Translation entry deleted")

	return c.JSON(http.StatusNoContent, Response[db.Translation]{Data: translation})
}

// TranslateRequest represents a translation request
// @Description Request payload for translating text between languages
type TranslateRequest struct {
	ThreadID       string `json:"thread_id" example:"123" binding:"required"`         // The thread ID for this translation
	SourceText     string `json:"source_text" example:"سلام دنیا" binding:"required"` // The text to be translated
	Model          string `json:"model" example:"llama3.2:latest" binding:"required"` // The model to use for translation
	SourceLanguage string `json:"source_language" example:"fa" binding:"required"`    // Source language code (e.g., 'fa', 'en', 'ar')
	TargetLanguage string `json:"target_language" example:"en" binding:"required"`    // Target language code (e.g., 'fa', 'en', 'ar')
	Tone           string `json:"tone" example:"formal"`                              // Translation tone (formal, casual, technical, friendly)
}

// TranslateResponse represents a translation response
// @Description Response payload containing the translated text
type TranslateResponse struct {
	Translation string `json:"translation" example:"Hello World"` // The translated text
}

// @Summary Create translation
// @Description Translate text from one language to another using AI models. Supports multiple languages (Persian, English, Arabic, French, German, Spanish) and different tones (formal, casual, technical, friendly). The translation is processed synchronously and stored in the database.
// @Tags Translations
// @Accept json
// @Produce json
// @Param request body TranslateRequest true "Translation request payload"
// @Success 200 {object} Response[db.Translation] "Translation completed successfully"
// @Failure 400 {object} ErrorResponse "Bad request - missing required fields or invalid parameters"
// @Failure 404 {object} ErrorResponse "Translation thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - model or database error"
// @Router /translations [post]
// @ID createTranslation
func (h *Handler) handleCreateTranslation(c echo.Context) error {
	startTime := time.Now()
	log.Info().Msg("Handling create translation request")

	// 1. Parse and validate request
	translateReq, err := h.parseAndValidateTranslateRequest(c)
	if err != nil {
		return err
	}

	// 2. Create translation entry
	translation, err := h.createTranslation(translateReq)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 4. Process translation
	if err := h.processTranslation(c, translation); err != nil {
		log.Error().Err(err).Uint("translation_id", translation.ID).Msg("Translation processing failed")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
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
	if translateReq.SourceText == "" || translateReq.Model == "" ||
		translateReq.SourceLanguage == "" || translateReq.TargetLanguage == "" ||
		translateReq.ThreadID == "" {
		log.Error().Msg("source_text, model, source_language, target_language, and thread_id are required")
		return TranslateRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "source_text, model, source_language, target_language, and thread_id are required",
		})
	}

	// Log sanitized request
	log.Info().
		Str("thread_id", translateReq.ThreadID).
		Str("model", translateReq.Model).
		Int("source_text_length", len(translateReq.SourceText)).
		Str("source_language", translateReq.SourceLanguage).
		Str("target_language", translateReq.TargetLanguage).
		Str("tone", translateReq.Tone).
		Msg("Translation request received")

	return translateReq, nil
}

func (h *Handler) createTranslation(translateReq TranslateRequest) (*db.Translation, error) {
	sourceLang := getLanguageFullName(translateReq.SourceLanguage)
	targetLang := getLanguageFullName(translateReq.TargetLanguage)
	tone := getToneDescription(translateReq.Tone)
	systemPrompt := getSystemPrompt(sourceLang, targetLang, tone, translateReq.SourceText)

	translation := &db.Translation{
		SourceText:     translateReq.SourceText,
		TranslatedText: "",
		Model:          translateReq.Model,
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
		Msg("Translation entry created")

	return translation, nil
}

func (h *Handler) processTranslation(c echo.Context, translation *db.Translation) error {
	var translatedText string

	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model: translation.Model,
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
