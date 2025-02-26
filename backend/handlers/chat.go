package handlers

import (
	"ai-assistant/db"
	"ai-assistant/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type ChatRequest struct {
	Content  string `json:"content"`
	Model    string `json:"model"`
	ThreadID string `json:"thread_id"`
}

type ChatResponse struct {
	ID        uint      `json:"id"`
	ThreadID  uint      `json:"thread_id"`
	Content   string    `json:"content"`
	Think     string    `json:"think"`
	State     string    `json:"state"`
	Role      string    `json:"role"`
	Model     string    `json:"model"`
	Timestamp time.Time `json:"timestamp"`
}

func (h *Handler) handleStreamChat(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling stream chat request")

	var chatReq ChatRequest
	if err := c.Bind(&chatReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind chat request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	if chatReq.Content == "" || chatReq.Model == "" || chatReq.ThreadID == "" {
		log.Error().Msg("message, model, and thread_id are required")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "message, model, and thread_id are required",
		})
	}

	// Log sanitized request (exclude sensitive data)
	log.Info().
		Str("thread_id", chatReq.ThreadID).
		Str("model", chatReq.Model).
		Int("message_length", len(chatReq.Content)).
		Msg("Chat request received")

	// Verify thread exists
	var thread db.Thread
	result := h.db.First(&thread, chatReq.ThreadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", chatReq.ThreadID).Msg("Thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", chatReq.ThreadID).Msg("Failed to fetch thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	msgStart := time.Now()
	// Create and save user message
	userMsg := db.ChatMessage{
		ThreadID:  thread.ID,
		Role:      "user",
		Content:   chatReq.Content,
		Model:     chatReq.Model,
		Timestamp: time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to save user message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	log.Info().
		Uint("message_id", userMsg.ID).
		Str("thread_id", chatReq.ThreadID).
		Dur("duration_ms", time.Since(msgStart)).
		Msg("User message saved")

	// Create assistant message (will be updated with streamed content)
	assistantMsg := db.ChatMessage{
		ThreadID:  thread.ID,
		Role:      "assistant",
		Content:   "",
		Think:     "",
		Model:     chatReq.Model,
		Timestamp: time.Now(),
		State:     "idle",
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to create assistant message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Set up SSE headers
	c.Response().Header().Set("Content-Type", "application/x-ndjson")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Transfer-Encoding", "chunked")
	c.Response().WriteHeader(http.StatusOK)

	// Create a channel to handle client disconnection
	done := c.Request().Context().Done()
	streamStart := time.Now()
	chunk := ""
	fullContent := ""
	fullThink := ""
	chunkCount := 0
	isThinking := false
	isThinkingModel := utils.IsThinkingModel(chatReq.Model)
	currentState := "idle"

	var threadMessages []db.ChatMessage
	result = h.db.Where("thread_id = ?", chatReq.ThreadID).Order("timestamp ASC").Find(&threadMessages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	messages := []api.Message{}
	for _, message := range threadMessages {
		messages = append(messages, api.Message{
			Role:    message.Role,
			Content: message.Content,
		})
	}

	// Start streaming response
	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model:    chatReq.Model,
		Messages: messages,
		Stream:   func() *bool { b := true; return &b }(),
	}, func(response api.ChatResponse) error {
		select {
		case <-done:
			log.Info().
				Str("thread_id", chatReq.ThreadID).
				Int("chunks_sent", chunkCount).
				Dur("stream_duration_ms", time.Since(streamStart)).
				Msg("Client disconnected")
			return fmt.Errorf("client disconnected")
		default:
			if isThinkingModel {
				if strings.HasPrefix(response.Message.Content, "<think>") {
					isThinking = true
					currentState = "thinking"
				}

				if strings.HasSuffix(response.Message.Content, "</think>") {
					isThinking = false
					currentState = "responding"
				}
			}

			chunkCount++
			if response.Message.Content != "<think>" && response.Message.Content != "</think>" {
				chunk = response.Message.Content
				if isThinking {
					fullThink += response.Message.Content
				} else {
					fullContent += response.Message.Content
				}
			}

			var res ChatResponse
			if isThinking {
				res = ChatResponse{
					ID:        assistantMsg.ID,
					Content:   "",
					Think:     chunk,
					State:     currentState,
					Role:      assistantMsg.Role,
					Model:     assistantMsg.Model,
					ThreadID:  assistantMsg.ThreadID,
					Timestamp: assistantMsg.Timestamp,
				}
			} else {
				res = ChatResponse{
					ID:        assistantMsg.ID,
					Content:   chunk,
					Think:     fullThink,
					State:     currentState,
					Role:      assistantMsg.Role,
					Model:     assistantMsg.Model,
					ThreadID:  assistantMsg.ThreadID,
					Timestamp: assistantMsg.Timestamp,
				}
			}

			// Send the chunk to the client
			json.NewEncoder(c.Response()).Encode(res)
			c.Response().Flush()
			return nil
		}
	})

	currentState = "done"

	if err != nil {
		log.Error().Err(err).
			Str("thread_id", chatReq.ThreadID).
			Int("chunks_sent", chunkCount).
			Dur("stream_duration_ms", time.Since(streamStart)).
			Msg("Streaming failed")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Update the assistant message with the complete response
	updateStart := time.Now()
	if err := h.db.Model(&assistantMsg).
		Update("content", fullContent).
		Update("think", fullThink).
		Update("state", currentState).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to update assistant message")
	}
	// Update thread's updated_at timestamp
	if err := h.db.Model(&thread).Update("updated_at", time.Now()).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to update thread timestamp")
	}

	log.Info().
		Str("thread_id", chatReq.ThreadID).
		Int("response_length", len(fullContent)+len(fullThink)).
		Int("chunks_received", chunkCount).
		Dur("stream_duration_ms", time.Since(streamStart)).
		Dur("update_duration_ms", time.Since(updateStart)).
		Dur("total_duration_ms", time.Since(start)).
		Msg("Chat stream completed")

	return nil
}

type TranslateRequest struct {
	ThreadID   string `json:"thread_id"`
	Input      string `json:"input"`
	Model      string `json:"model"`
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	Tone       string `json:"tone"`
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

type TranslateResponse struct {
	Translation string `json:"translation"`
}
