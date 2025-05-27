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

// Message statuses
const (
	StatusIdle       = "idle"
	StatusReasoning  = "reasoning"
	StatusResponding = "responding"
	StatusDone       = "done"
	StatusStopped    = "stopped"
)

// Message roles
const (
	RoleUser      = "user"
	RoleAssistant = "assistant"
)

// ChatRequest represents a chat message request
// @Description Request payload for sending a chat message
type ChatRequest struct {
	Content  string `json:"content" example:"Hello, how are you?" binding:"required"` // The message content to send
	Model    string `json:"model" example:"llama3.2:latest" binding:"required"`       // The model to use for the response
	ThreadID string `json:"thread_id" example:"123" binding:"required"`               // The chat thread ID to send the message to
}

// ChatResponse represents a chat message response
// @Description Response payload for a chat message (used in streaming)
type ChatResponse struct {
	ID        uint      `json:"id" example:"456"`                                   // Unique message ID
	ThreadID  uint      `json:"thread_id" example:"123"`                            // Chat thread ID
	Content   string    `json:"content" example:"Hello! I'm doing well, thank you"` // The message content
	Reasoning string    `json:"reasoning" example:""`                               // Reasoning content (for reasoning models)
	Status    string    `json:"status" example:"done"`                              // Message status (idle, reasoning, responding, done)
	Role      string    `json:"role" example:"assistant"`                           // Message role (user or assistant)
	Model     string    `json:"model" example:"llama3.2:latest"`                    // Model used
	SentAt    time.Time `json:"sent_at" example:"2023-01-01T00:00:00Z"`             // Timestamp when message was sent
}

// @Summary Stream chat response
// @Description Send a message to an AI model and receive a streamed response. This endpoint supports both standard and reasoning models. For reasoning models, the response includes thinking process in the reasoning field. The response is streamed as NDJSON (newline-delimited JSON) for real-time updates.
// @Tags Chat
// @Accept json
// @Produce application/x-ndjson
// @Param request body ChatRequest true "Chat request payload"
// @Success 200 {object} ChatResponse "Streamed chat response (NDJSON format)"
// @Failure 400 {object} ErrorResponse "Bad request - missing required fields"
// @Failure 404 {object} ErrorResponse "Chat thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - model or database error"
// @Router /chat [post]
// @ID sendChatMessage
func (h *Handler) handleStreamChat(c echo.Context) error {
	startTime := time.Now()
	log.Info().Msg("Handling stream chat request")

	// 1. Parse and validate request
	chatReq, err := h.parseAndValidateChatRequest(c)
	if err != nil {
		return err
	}

	// 2. Retrieve conversation
	thread, err := h.getChatThread(c, chatReq.ThreadID)
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

	// 5. Get conversation history
	messages, err := h.getChatThreadMessages(thread.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 6. Stream response to client
	streamResult, err := h.streamResponse(c, assistantMsg, messages, chatReq)

	// Handle stopped streaming (not an error)
	if streamResult.FinalStatus == StatusStopped {
		log.Info().
			Uint("thread_id", thread.ID).
			Int("chunks_sent", streamResult.ChunkCount).
			Dur("total_duration_ms", time.Since(startTime)).
			Msg("Chat stream stopped by client")
		return nil
	}

	// Handle actual errors
	if err != nil {
		logStreamError(err, thread.ID, streamResult)
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 7. Update assistant message with final content (only for completed streams)
	if err := h.updateMessageAndChatThread(assistantMsg, thread, streamResult); err != nil {
		log.Error().Err(err).Uint("thread_id", thread.ID).Msg("Failed to update records")
	}

	logCompletedStream(thread.ID, streamResult, startTime)
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

func (h *Handler) getChatThread(c echo.Context, chatThreadID string) (db.ChatThread, error) {
	var chatThread db.ChatThread
	result := h.db.First(&chatThread, chatThreadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", chatThreadID).Msg("Chat thread not found")
			return db.ChatThread{}, c.JSON(http.StatusNotFound, ErrorResponse{Message: "Chat thread not found"})
		}
		log.Error().Err(result.Error).Str("thread_id", chatThreadID).Msg("Failed to fetch chat thread")
		return db.ChatThread{}, c.JSON(http.StatusInternalServerError, ErrorResponse{Message: result.Error.Error()})
	}
	return chatThread, nil
}

func (h *Handler) createMessages(ThreadID uint, chatReq ChatRequest) (db.Message, db.Message, error) {
	// Create and save user message
	userMsg := db.Message{
		ChatThreadID: ThreadID,
		Role:         RoleUser,
		Content:      chatReq.Content,
		Model:        chatReq.Model,
		SentAt:       time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		log.Error().Err(err).Uint("thread_id", ThreadID).Msg("Failed to save user message")
		return db.Message{}, db.Message{}, err
	}
	log.Info().
		Uint("message_id", userMsg.ID).
		Uint("thread_id", ThreadID).
		Msg("User message saved")

	// Create assistant message (will be updated with streamed content)
	assistantMsg := db.Message{
		ChatThreadID: ThreadID,
		Role:         RoleAssistant,
		Content:      "",
		Reasoning:    "",
		Model:        chatReq.Model,
		SentAt:       time.Now(),
		Status:       StatusIdle,
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		log.Error().Err(err).Uint("thread_id", ThreadID).Msg("Failed to create assistant message")
		return db.Message{}, db.Message{}, err
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

func (h *Handler) getChatThreadMessages(chatThreadID uint) ([]api.Message, error) {
	var chatThreadMessages []db.Message
	result := h.db.Where("chat_thread_id = ?", chatThreadID).Order("sent_at ASC").Find(&chatThreadMessages)
	if result.Error != nil {
		return nil, result.Error
	}

	messages := make([]api.Message, 0, len(chatThreadMessages))
	for _, message := range chatThreadMessages {
		messages = append(messages, api.Message{
			Role:    message.Role,
			Content: message.Content,
		})
	}
	return messages, nil
}

type StreamResult struct {
	FullContent   string
	FullReasoning string
	ChunkCount    int
	StartTime     time.Time
	EndTime       time.Time
	FinalStatus   string
}

func (h *Handler) streamResponse(c echo.Context, assistantMsg db.Message, messages []api.Message, chatReq ChatRequest) (StreamResult, error) {
	// Create a channel to handle client disconnection
	done := c.Request().Context().Done()
	streamStart := time.Now()

	result := StreamResult{
		StartTime:     streamStart,
		FullContent:   "",
		FullReasoning: "",
		ChunkCount:    0,
	}

	currentChunk := ""
	isReasoning := false
	isReasoningModel := utils.IsReasoningModel(chatReq.Model)
	currentStatus := StatusIdle
	wasStopped := false

	// Start streaming response
	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model:    chatReq.Model,
		Messages: messages,
		Stream:   func() *bool { b := true; return &b }(),
	}, func(response api.ChatResponse) error {
		select {
		case <-done:
			// Client disconnected - mark as stopped and save partial content
			wasStopped = true
			log.Info().
				Str("thread_id", chatReq.ThreadID).
				Int("chunks_sent", result.ChunkCount).
				Dur("stream_duration_ms", time.Since(streamStart)).
				Msg("Client disconnected - streaming stopped")
			return fmt.Errorf("streaming stopped by client")
		default:
			if isReasoningModel {
				h.processReasoningModelResponse(&result, &currentChunk, &isReasoning, &currentStatus, response.Message.Content)
			} else {
				h.processStandardModelResponse(&result, &currentChunk, &currentStatus, response.Message.Content)
			}

			// Prepare response
			chatResponse := h.prepareChatResponse(assistantMsg, currentChunk, result.FullReasoning, currentStatus, isReasoning)

			// Send the chunk to the client
			if err := json.NewEncoder(c.Response()).Encode(chatResponse); err != nil {
				// Client disconnected during send - mark as stopped
				wasStopped = true
				return fmt.Errorf("streaming stopped by client")
			}
			c.Response().Flush()
			return nil
		}
	})

	result.EndTime = time.Now()

	// If streaming was stopped by client, update the result accordingly
	if wasStopped {
		result.FinalStatus = StatusStopped
		// Save partial content to database immediately
		h.updateMessageWithStoppedStatus(assistantMsg, result)
		return result, nil // Return success instead of error
	}

	result.FinalStatus = StatusDone
	return result, err
}

func (h *Handler) processReasoningModelResponse(result *StreamResult, currentChunk *string, isReasoning *bool, currentStatus *string, content string) {
	if strings.HasPrefix(content, "<think>") {
		*isReasoning = true
		*currentStatus = StatusReasoning
	}

	if strings.HasSuffix(content, "</think>") {
		*isReasoning = false
		*currentStatus = StatusResponding
	}

	*currentChunk = content
	if *isReasoning {
		result.FullReasoning += content
	} else {
		result.FullContent += content
	}
}

func (h *Handler) processStandardModelResponse(result *StreamResult, currentChunk *string, currentStatus *string, content string) {
	result.ChunkCount++
	*currentStatus = StatusResponding
	*currentChunk = content
	result.FullContent += content
}

func (h *Handler) prepareChatResponse(assistantMsg db.Message, currentChunk, fullReasoning, currentStatus string, isReasoning bool) ChatResponse {
	res := ChatResponse{
		ID:       assistantMsg.ID,
		ThreadID: assistantMsg.ChatThreadID,
		Role:     assistantMsg.Role,
		Model:    assistantMsg.Model,
		SentAt:   assistantMsg.SentAt,
		Status:   currentStatus,
	}

	if isReasoning {
		res.Content = ""
		res.Reasoning = currentChunk
	} else {
		res.Content = currentChunk
		res.Reasoning = fullReasoning
	}

	return res
}

func (h *Handler) updateMessageAndChatThread(assistantMsg db.Message, chatThread db.ChatThread, result StreamResult) error {
	// Update the assistant message with the complete response
	if err := h.db.Model(&assistantMsg).
		Updates(map[string]interface{}{
			"content":   result.FullContent,
			"reasoning": result.FullReasoning,
			"status":    result.FinalStatus,
		}).Error; err != nil {
		return err
	}

	// Update chat thread's updated_at timestamp
	return h.db.Model(&chatThread).Update("updated_at", time.Now()).Error
}

func (h *Handler) updateMessageWithStoppedStatus(assistantMsg db.Message, result StreamResult) error {
	// Update the assistant message with the stopped status and partial content
	if err := h.db.Model(&assistantMsg).
		Updates(map[string]interface{}{
			"content":   result.FullContent,
			"reasoning": result.FullReasoning,
			"status":    result.FinalStatus,
		}).Error; err != nil {
		return err
	}

	// Update chat thread's updated_at timestamp
	return h.db.Model(&assistantMsg.ChatThread).Update("updated_at", time.Now()).Error
}

func logStreamError(err error, chatThreadID uint, result StreamResult) {
	log.Error().Err(err).
		Uint("thread_id", chatThreadID).
		Int("chunks_sent", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Msg("Streaming failed")
}

func logCompletedStream(chatThreadID uint, result StreamResult, startTime time.Time) {
	log.Info().
		Uint("thread_id", chatThreadID).
		Int("response_length", len(result.FullContent)+len(result.FullReasoning)).
		Int("chunks_received", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Dur("update_duration_ms", time.Since(result.EndTime)).
		Dur("total_duration_ms", time.Since(startTime)).
		Msg("Chat stream completed")
}
