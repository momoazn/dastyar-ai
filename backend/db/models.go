package db

import "time"

type ChatThread struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Title      string    `json:"title"`
	Messages   []Message `json:"messages,omitempty" gorm:"foreignKey:ChatThreadID"`
	Model      string    `json:"model"`
	IsArchived bool      `json:"is_archived" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Message struct {
	ID           uint       `json:"id" gorm:"primaryKey"`
	ChatThreadID uint       `json:"chat_thread_id"`
	ChatThread   ChatThread `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role         string     `json:"role"`
	Content      string     `json:"content"`
	Reasoning    string     `json:"reasoning"`
	Model        string     `json:"model"`
	Status       string     `json:"status"`
	SentAt       time.Time  `json:"sent_at"`
}

type Translation struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	SourceText     string    `json:"source_text"`
	TranslatedText string    `json:"translated_text"`
	Model          string    `json:"model"`
	SourceLanguage string    `json:"source_language"`
	TargetLanguage string    `json:"target_language"`
	Tone           string    `json:"tone"`
	Instructions   string    `json:"-"`
	CreatedAt      time.Time `json:"created_at"`
}
