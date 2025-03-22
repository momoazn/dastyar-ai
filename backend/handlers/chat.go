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

// Message states
const (
	StateIdle       = "idle"
	StateThinking   = "thinking"
	StateResponding = "responding"
	StateDone       = "done"
)

// Message roles
const (
	RoleUser      = "user"
	RoleAssistant = "assistant"
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
	startTime := time.Now()
	log.Info().Msg("Handling stream chat request")

	// 1. Parse and validate request
	chatReq, err := h.parseAndValidateChatRequest(c)
	if err != nil {
		return err
	}

	// 2. Retrieve thread
	thread, err := h.getThread(c, chatReq.ThreadID)
	if err != nil {
		return err
	}

	// 3. Create user and assistant messages
	_, assistantMsg, err := h.createMessages(thread.ID, chatReq)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 4. Setup streaming response
	h.setupSSEHeaders(c)

	// 5. Get thread history
	messages, err := h.getThreadHistory(chatReq.ThreadID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 6. Stream response to client
	streamResult, err := h.streamResponse(c, assistantMsg, messages, chatReq)
	if err != nil {
		logStreamError(err, chatReq.ThreadID, streamResult)
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 7. Update assistant message with final content
	if err := h.updateMessageAndThread(assistantMsg, thread, streamResult); err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to update records")
	}

	logCompletedStream(chatReq.ThreadID, streamResult, startTime)
	return nil
}

func (h *Handler) parseAndValidateChatRequest(c echo.Context) (ChatRequest, error) {
	var chatReq ChatRequest
	if err := c.Bind(&chatReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind chat request")
		return ChatRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
	}

	// Validate required fields
	if chatReq.Content == "" || chatReq.Model == "" || chatReq.ThreadID == "" {
		log.Error().Msg("content, model, and thread_id are required")
		return ChatRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "content, model, and thread_id are required",
		})
	}

	// Log sanitized request
	log.Info().
		Str("thread_id", chatReq.ThreadID).
		Str("model", chatReq.Model).
		Int("message_length", len(chatReq.Content)).
		Msg("Chat request received")

	return chatReq, nil
}

func (h *Handler) getThread(c echo.Context, threadID string) (db.ChatThread, error) {
	var thread db.ChatThread
	result := h.db.First(&thread, threadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", threadID).Msg("Thread not found")
			return db.ChatThread{}, c.JSON(http.StatusNotFound, ErrorResponse{Message: "Thread not found"})
		}
		log.Error().Err(result.Error).Str("thread_id", threadID).Msg("Failed to fetch thread")
		return db.ChatThread{}, c.JSON(http.StatusInternalServerError, ErrorResponse{Message: result.Error.Error()})
	}
	return thread, nil
}

func (h *Handler) createMessages(threadID uint, chatReq ChatRequest) (db.ChatMessage, db.ChatMessage, error) {
	// Create and save user message
	userMsg := db.ChatMessage{
		ThreadID:  threadID,
		Role:      RoleUser,
		Content:   chatReq.Content,
		Model:     chatReq.Model,
		Timestamp: time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		log.Error().Err(err).Uint("thread_id", threadID).Msg("Failed to save user message")
		return db.ChatMessage{}, db.ChatMessage{}, err
	}
	log.Info().
		Uint("message_id", userMsg.ID).
		Uint("thread_id", threadID).
		Msg("User message saved")

	// Create assistant message (will be updated with streamed content)
	assistantMsg := db.ChatMessage{
		ThreadID:  threadID,
		Role:      RoleAssistant,
		Content:   "",
		Think:     "",
		Model:     chatReq.Model,
		Timestamp: time.Now(),
		State:     StateIdle,
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		log.Error().Err(err).Uint("thread_id", threadID).Msg("Failed to create assistant message")
		return db.ChatMessage{}, db.ChatMessage{}, err
	}

	return userMsg, assistantMsg, nil
}

func (h *Handler) setupSSEHeaders(c echo.Context) {
	c.Response().Header().Set("Content-Type", "application/x-ndjson")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Transfer-Encoding", "chunked")
	c.Response().WriteHeader(http.StatusOK)
}

func (h *Handler) getThreadHistory(threadID string) ([]api.Message, error) {
	var threadMessages []db.ChatMessage
	result := h.db.Where("thread_id = ?", threadID).Order("timestamp ASC").Find(&threadMessages)
	if result.Error != nil {
		return nil, result.Error
	}

	messages := make([]api.Message, 0, len(threadMessages))
	for _, message := range threadMessages {
		messages = append(messages, api.Message{
			Role:    message.Role,
			Content: message.Content,
		})
	}
	return messages, nil
}

type StreamResult struct {
	FullContent string
	FullThink   string
	ChunkCount  int
	StartTime   time.Time
	EndTime     time.Time
}

func (h *Handler) streamResponse(c echo.Context, assistantMsg db.ChatMessage, messages []api.Message, chatReq ChatRequest) (StreamResult, error) {
	// Create a channel to handle client disconnection
	done := c.Request().Context().Done()
	streamStart := time.Now()

	result := StreamResult{
		StartTime:   streamStart,
		FullContent: "",
		FullThink:   "",
		ChunkCount:  0,
	}

	currentChunk := ""
	isThinking := false
	isThinkingModel := utils.IsThinkingModel(chatReq.Model)
	currentState := StateIdle

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
				Int("chunks_sent", result.ChunkCount).
				Dur("stream_duration_ms", time.Since(streamStart)).
				Msg("Client disconnected")
			return fmt.Errorf("client disconnected")
		default:
			if isThinkingModel {
				h.processThinkingModelResponse(&result, &currentChunk, &isThinking, &currentState, response.Message.Content)
			} else {
				h.processStandardModelResponse(&result, &currentChunk, &currentState, response.Message.Content)
			}

			// Prepare response
			chatResponse := h.prepareChatResponse(assistantMsg, currentChunk, result.FullThink, currentState, isThinking)

			// Send the chunk to the client
			if err := json.NewEncoder(c.Response()).Encode(chatResponse); err != nil {
				return err
			}
			c.Response().Flush()
			return nil
		}
	})

	result.EndTime = time.Now()
	return result, err
}

func (h *Handler) processThinkingModelResponse(result *StreamResult, currentChunk *string, isThinking *bool, currentState *string, content string) {
	if strings.HasPrefix(content, "<think>") {
		*isThinking = true
		*currentState = StateThinking
	}

	if strings.HasSuffix(content, "</think>") {
		*isThinking = false
		*currentState = StateResponding
	}

	*currentChunk = content
	if *isThinking {
		result.FullThink += content
	} else {
		result.FullContent += content
	}
}

func (h *Handler) processStandardModelResponse(result *StreamResult, currentChunk *string, currentState *string, content string) {
	result.ChunkCount++
	*currentState = StateResponding
	*currentChunk = content
	result.FullContent += content
}

func (h *Handler) prepareChatResponse(assistantMsg db.ChatMessage, currentChunk, fullThink, currentState string, isThinking bool) ChatResponse {
	res := ChatResponse{
		ID:        assistantMsg.ID,
		ThreadID:  assistantMsg.ThreadID,
		Role:      assistantMsg.Role,
		Model:     assistantMsg.Model,
		Timestamp: assistantMsg.Timestamp,
		State:     currentState,
	}

	if isThinking {
		res.Content = ""
		res.Think = currentChunk
	} else {
		res.Content = currentChunk
		res.Think = fullThink
	}

	return res
}

func (h *Handler) updateMessageAndThread(assistantMsg db.ChatMessage, thread db.ChatThread, result StreamResult) error {
	// Update the assistant message with the complete response
	if err := h.db.Model(&assistantMsg).
		Updates(map[string]interface{}{
			"content": result.FullContent,
			"think":   result.FullThink,
			"state":   StateDone,
		}).Error; err != nil {
		return err
	}

	// Update thread's updated_at timestamp
	return h.db.Model(&thread).Update("updated_at", time.Now()).Error
}

func logStreamError(err error, threadID string, result StreamResult) {
	log.Error().Err(err).
		Str("thread_id", threadID).
		Int("chunks_sent", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Msg("Streaming failed")
}

func logCompletedStream(threadID string, result StreamResult, startTime time.Time) {
	log.Info().
		Str("thread_id", threadID).
		Int("response_length", len(result.FullContent)+len(result.FullThink)).
		Int("chunks_received", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Dur("update_duration_ms", time.Since(result.EndTime)).
		Dur("total_duration_ms", time.Since(startTime)).
		Msg("Chat stream completed")
}
