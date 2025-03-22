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
	ThreadID   string `json:"thread_id"`
	Input      string `json:"input"`
	Model      string `json:"model"`
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	Tone       string `json:"tone"`
}

type TranslateResponse struct {
	Translation string `json:"translation"`
}

func (h *Handler) handleTranslate(c echo.Context) error {
	log.Info().Msg("Handling translate request")

	var translateReq TranslateRequest
	if err := c.Bind(&translateReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind translate request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	if translateReq.Tone == "" {
		translateReq.Tone = "formal"
	}

	if translateReq.Input == "" || translateReq.Model == "" || translateReq.SourceLang == "" || translateReq.TargetLang == "" || translateReq.ThreadID == "" {
		log.Error().Msg("input, model, from_lang, to_lang, and thread_id are required")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "input, model, from_lang, to_lang, and thread_id are required",
		})
	}

	// Verify thread exists
	var thread db.Thread
	result := h.db.First(&thread, translateReq.ThreadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", translateReq.ThreadID).Msg("Thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", translateReq.ThreadID).Msg("Failed to fetch thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	sourceLang := getLanguageFullName(translateReq.SourceLang)
	targetLang := getLanguageFullName(translateReq.TargetLang)
	tone := getToneDescription(translateReq.Tone)
	systemPrompt := getSystemPrompt(sourceLang, targetLang, tone, translateReq.Input)

	translateMsg := db.TranslateMessage{
		Input:        translateReq.Input,
		Output:       "",
		Model:        translateReq.Model,
		ThreadID:     thread.ID,
		SourceLang:   translateReq.SourceLang,
		TargetLang:   translateReq.TargetLang,
		Tone:         translateReq.Tone,
		SystemPrompt: systemPrompt,
	}

	if err := h.db.Create(&translateMsg).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create translate message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model: translateMsg.Model,
		Messages: []api.Message{
			{
				Role:    "user",
				Content: systemPrompt,
			},
		},
		Format: translateResponseSchema,
		Stream: func() *bool { b := false; return &b }(),
	}, func(response api.ChatResponse) error {
		var translateResponse TranslateResponse
		if err := json.Unmarshal([]byte(response.Message.Content), &translateResponse); err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal translate response")
			return c.JSON(http.StatusInternalServerError, ErrorResponse{
				Message: err.Error(),
			})
		}

		content := translateResponse.Translation
		translateMsg.Output = content
		return nil
	})

	if err := h.db.Model(&translateMsg).Update("output", translateMsg.Output).Update("timestamp", time.Now()).Error; err != nil {
		log.Error().Err(err).Msg("Failed to update translate message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Update thread's updated_at timestamp
	if err := h.db.Model(&thread).Update("updated_at", time.Now()).Error; err != nil {
		log.Error().Err(err).Str("thread_id", translateReq.ThreadID).Msg("Failed to update thread timestamp")
	}

	return c.JSON(http.StatusOK, Response[db.TranslateMessage]{
		Data:    translateMsg,
		Message: "Translation completed",
	})
}

func getLanguageFullName(langCode string) string {
	languageMap := map[string]string{
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
