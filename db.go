package main

import (
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Session struct {
	ID        uint          `json:"id" gorm:"primaryKey"`
	Title     string        `json:"title"`
	Messages  []ChatMessage `json:"messages,omitempty" gorm:"foreignKey:SessionID"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type ChatMessage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	SessionID uint      `json:"session_id"`
	Session   Session   `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	Model     string    `json:"model"`
}

// Initialize database connection and create tables
func initDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open("chats.db"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&Session{}, &ChatMessage{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
