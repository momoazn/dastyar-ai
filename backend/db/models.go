package db

import (
	"time"
)

// ChatThread represents a chat thread between a user and the AI
type ChatThread struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Messages  []Message `json:"messages,omitempty" gorm:"foreignKey:ChatThreadID"`
	LLM       string    `json:"llm"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Message represents a single message in a chat thread
type Message struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	ChatThreadID uint       `json:"chat_thread_id"`
	ChatThread   ChatThread `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role         string     `json:"role"`
	Content      string     `json:"content"`
	Reasoning    string     `json:"reasoning"`
	LLM          string     `json:"llm"`
	Status       string     `json:"status"`
	SentAt       time.Time  `json:"sent_at"`
}

// TranslationThread represents a collection of translations
type TranslationThread struct {
	ID           uint          `json:"id" gorm:"primaryKey"`
	Title        string        `json:"title"`
	Translations []Translation `json:"translations,omitempty" gorm:"foreignKey:ThreadID"`
	LLM          string        `json:"llm"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// Translation represents a single translation entry
type Translation struct {
	ID             uint              `json:"id" gorm:"primaryKey"`
	ThreadID       uint              `json:"thread_id"`
	Thread         TranslationThread `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	SourceText     string            `json:"source_text"`
	TranslatedText string            `json:"translated_text"`
	LLM            string            `json:"llm"`
	SourceLanguage string            `json:"source_language"`
	TargetLanguage string            `json:"target_language"`
	Tone           string            `json:"tone"`
	Instructions   string            `json:"-"`
	CreatedAt      time.Time         `json:"created_at"`
}
