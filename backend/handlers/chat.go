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
)

// Message roles
const (
	RoleUser      = "user"
	RoleAssistant = "assistant"
)

type ChatRequest struct {
	Content        string `json:"content"`
	AIModel        string `json:"ai_model"`
	ConversationID string `json:"conversation_id"`
}

type ChatResponse struct {
	ID             uint      `json:"id"`
	ConversationID uint      `json:"conversation_id"`
	Content        string    `json:"content"`
	Reasoning      string    `json:"reasoning"`
	Status         string    `json:"status"`
	Role           string    `json:"role"`
	AIModel        string    `json:"ai_model"`
	SentAt         time.Time `json:"sent_at"`
}

func (h *Handler) handleStreamChat(c echo.Context) error {
	startTime := time.Now()
	log.Info().Msg("Handling stream chat request")

	// 1. Parse and validate request
	chatReq, err := h.parseAndValidateChatRequest(c)
	if err != nil {
		return err
	}

	// 2. Retrieve conversation
	conversation, err := h.getConversation(c, chatReq.ConversationID)
	if err != nil {
		return err
	}

	// 3. Create user and assistant messages
	_, assistantMsg, err := h.createMessages(conversation.ID, chatReq)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 4. Setup streaming response
	h.setupSSEHeaders(c)

	// 5. Get conversation history
	messages, err := h.getConversationHistory(chatReq.ConversationID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 6. Stream response to client
	streamResult, err := h.streamResponse(c, assistantMsg, messages, chatReq)
	if err != nil {
		logStreamError(err, chatReq.ConversationID, streamResult)
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	// 7. Update assistant message with final content
	if err := h.updateMessageAndConversation(assistantMsg, conversation, streamResult); err != nil {
		log.Error().Err(err).Str("conversation_id", chatReq.ConversationID).Msg("Failed to update records")
	}

	logCompletedStream(chatReq.ConversationID, streamResult, startTime)
	return nil
}

func (h *Handler) parseAndValidateChatRequest(c echo.Context) (ChatRequest, error) {
	var chatReq ChatRequest
	if err := c.Bind(&chatReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind chat request")
		return ChatRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
	}

	// Validate required fields
	if chatReq.Content == "" || chatReq.AIModel == "" || chatReq.ConversationID == "" {
		log.Error().Msg("content, ai_model, and conversation_id are required")
		return ChatRequest{}, c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "content, ai_model, and conversation_id are required",
		})
	}

	// Log sanitized request
	log.Info().
		Str("conversation_id", chatReq.ConversationID).
		Str("ai_model", chatReq.AIModel).
		Int("message_length", len(chatReq.Content)).
		Msg("Chat request received")

	return chatReq, nil
}

func (h *Handler) getConversation(c echo.Context, conversationID string) (db.Conversation, error) {
	var conversation db.Conversation
	result := h.db.First(&conversation, conversationID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("conversation_id", conversationID).Msg("Conversation not found")
			return db.Conversation{}, c.JSON(http.StatusNotFound, ErrorResponse{Message: "Conversation not found"})
		}
		log.Error().Err(result.Error).Str("conversation_id", conversationID).Msg("Failed to fetch conversation")
		return db.Conversation{}, c.JSON(http.StatusInternalServerError, ErrorResponse{Message: result.Error.Error()})
	}
	return conversation, nil
}

func (h *Handler) createMessages(conversationID uint, chatReq ChatRequest) (db.Message, db.Message, error) {
	// Create and save user message
	userMsg := db.Message{
		ConversationID: conversationID,
		Role:           RoleUser,
		Content:        chatReq.Content,
		AIModel:        chatReq.AIModel,
		SentAt:         time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		log.Error().Err(err).Uint("conversation_id", conversationID).Msg("Failed to save user message")
		return db.Message{}, db.Message{}, err
	}
	log.Info().
		Uint("message_id", userMsg.ID).
		Uint("conversation_id", conversationID).
		Msg("User message saved")

	// Create assistant message (will be updated with streamed content)
	assistantMsg := db.Message{
		ConversationID: conversationID,
		Role:           RoleAssistant,
		Content:        "",
		Reasoning:      "",
		AIModel:        chatReq.AIModel,
		SentAt:         time.Now(),
		Status:         StatusIdle,
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		log.Error().Err(err).Uint("conversation_id", conversationID).Msg("Failed to create assistant message")
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

func (h *Handler) getConversationHistory(conversationID string) ([]api.Message, error) {
	var conversationMessages []db.Message
	result := h.db.Where("conversation_id = ?", conversationID).Order("sent_at ASC").Find(&conversationMessages)
	if result.Error != nil {
		return nil, result.Error
	}

	messages := make([]api.Message, 0, len(conversationMessages))
	for _, message := range conversationMessages {
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
	isReasoningModel := utils.IsReasoningModel(chatReq.AIModel)
	currentStatus := StatusIdle

	// Start streaming response
	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model:    chatReq.AIModel,
		Messages: messages,
		Stream:   func() *bool { b := true; return &b }(),
	}, func(response api.ChatResponse) error {
		select {
		case <-done:
			log.Info().
				Str("conversation_id", chatReq.ConversationID).
				Int("chunks_sent", result.ChunkCount).
				Dur("stream_duration_ms", time.Since(streamStart)).
				Msg("Client disconnected")
			return fmt.Errorf("client disconnected")
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
				return err
			}
			c.Response().Flush()
			return nil
		}
	})

	result.EndTime = time.Now()
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
		ID:             assistantMsg.ID,
		ConversationID: assistantMsg.ConversationID,
		Role:           assistantMsg.Role,
		AIModel:        assistantMsg.AIModel,
		SentAt:         assistantMsg.SentAt,
		Status:         currentStatus,
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

func (h *Handler) updateMessageAndConversation(assistantMsg db.Message, conversation db.Conversation, result StreamResult) error {
	// Update the assistant message with the complete response
	if err := h.db.Model(&assistantMsg).
		Updates(map[string]interface{}{
			"content":   result.FullContent,
			"reasoning": result.FullReasoning,
			"status":    StatusDone,
		}).Error; err != nil {
		return err
	}

	// Update conversation's updated_at timestamp
	return h.db.Model(&conversation).Update("updated_at", time.Now()).Error
}

func logStreamError(err error, conversationID string, result StreamResult) {
	log.Error().Err(err).
		Str("conversation_id", conversationID).
		Int("chunks_sent", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Msg("Streaming failed")
}

func logCompletedStream(conversationID string, result StreamResult, startTime time.Time) {
	log.Info().
		Str("conversation_id", conversationID).
		Int("response_length", len(result.FullContent)+len(result.FullReasoning)).
		Int("chunks_received", result.ChunkCount).
		Dur("stream_duration_ms", time.Since(result.StartTime)).
		Dur("update_duration_ms", time.Since(result.EndTime)).
		Dur("total_duration_ms", time.Since(startTime)).
		Msg("Chat stream completed")
}
