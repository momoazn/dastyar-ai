package main

import (
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Thread struct {
	ID            uint          `json:"id" gorm:"primaryKey"`
	Title         string        `json:"title"`
	Messages      []ChatMessage `json:"messages,omitempty" gorm:"foreignKey:ThreadID"`
	Model         string        `json:"model"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	LastMessageAt time.Time     `json:"last_message_at"`
}

type ChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ThreadID  uint      `json:"thread_id"`
	Thread    Thread    `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Model     string    `json:"model"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// Initialize database connection and create tables
func initDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open("chats.db"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&Thread{}, &ChatMessage{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
