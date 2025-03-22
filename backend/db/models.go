package db

import (
	"time"
)

// Conversation represents a chat thread between a user and the AI
type Conversation struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Messages  []Message `json:"messages,omitempty" gorm:"foreignKey:ConversationID"`
	AIModel   string    `json:"ai_model"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Message represents a single message in a conversation
type Message struct {
	ID             uint         `json:"id" gorm:"primaryKey"`
	ConversationID uint         `json:"conversation_id"`
	Conversation   Conversation `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role           string       `json:"role"`
	Content        string       `json:"content"`
	Reasoning      string       `json:"reasoning"`
	AIModel        string       `json:"ai_model"`
	Status         string       `json:"status"`
	SentAt         time.Time    `json:"sent_at"`
}

// TranslationProject represents a collection of translations
type TranslationProject struct {
	ID           uint          `json:"id" gorm:"primaryKey"`
	Title        string        `json:"title"`
	Translations []Translation `json:"translations,omitempty" gorm:"foreignKey:ProjectID"`
	AIModel      string        `json:"ai_model"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// Translation represents a single translation entry
type Translation struct {
	ID             uint               `json:"id" gorm:"primaryKey"`
	ProjectID      uint               `json:"project_id"`
	Project        TranslationProject `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	SourceText     string             `json:"source_text"`
	TranslatedText string             `json:"translated_text"`
	AIModel        string             `json:"ai_model"`
	SourceLanguage string             `json:"source_language"`
	TargetLanguage string             `json:"target_language"`
	Tone           string             `json:"tone"`
	Instructions   string             `json:"-"`
	CreatedAt      time.Time          `json:"created_at"`
}
