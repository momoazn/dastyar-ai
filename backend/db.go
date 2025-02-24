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

	// Seed initial data
	err = seedDatabase(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}

// seedDatabase adds test data to the database for UI testing purposes.
// It includes both English and Persian content to ensure proper multilingual support.
func seedDatabase(db *gorm.DB) error {
	// Check if seeding has already been done by looking for any existing threads
	var count int64
	db.Model(&Thread{}).Count(&count)
	if count > 0 {
		return nil // Database already has data
	}

	// Create 3 test threads with 5 messages each
	threads := []Thread{
		{
			Title: "آموزش هوش مصنوعی",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "هوش مصنوعی چیست و چگونه کار می‌کند؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "هوش مصنوعی سیستمی است که می‌تواند داده‌ها را تحلیل کرده و با یادگیری از آنها، تصمیم‌گیری کند. این سیستم‌ها از الگوریتم‌های پیچیده برای شبیه‌سازی تفکر انسانی استفاده می‌کنند.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "تفاوت بین یادگیری عمیق و یادگیری ماشین چیست؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "یادگیری ماشین زیرمجموعه‌ای از هوش مصنوعی است که از الگوریتم‌ها برای یادگیری از داده‌ها استفاده می‌کند. یادگیری عمیق نوع پیشرفته‌تری است که از شبکه‌های عصبی چندلایه برای یادگیری استفاده می‌کند.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "کاربردهای هوش مصنوعی در زندگی روزمره چیست؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "هوش مصنوعی در بسیاری از جنبه‌های زندگی روزمره کاربرد دارد: دستیارهای صوتی مثل سیری، پیشنهادات خرید در فروشگاه‌های آنلاین، تشخیص چهره در دوربین‌ها، سیستم‌های پیشنهاد محتوا در شبکه‌های اجتماعی، و ترجمه خودکار زبان.", Model: "gpt-4", Status: "completed"},
			},
		},
		{
			Title: "مشاوره برنامه‌نویسی",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "بهترین زبان برنامه‌نویسی برای شروع کدام است؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "پایتون یک انتخاب عالی برای شروع است. سینتکس ساده و خوانایی بالایی دارد و منابع آموزشی زیادی در دسترس است.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "چطور می‌توانم در برنامه‌نویسی پیشرفت کنم؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "تمرین مداوم، کار روی پروژه‌های شخصی، مطالعه کد دیگران و مشارکت در پروژه‌های متن‌باز بهترین راه‌های پیشرفت هستند.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "برای یادگیری وب چه مسیری را پیشنهاد می‌کنید؟", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "برای شروع، HTML و CSS را یاد بگیرید. سپس JavaScript را مطالعه کنید. بعد می‌توانید فریم‌ورک‌های مدرن مثل React یا Vue را یاد بگیرید. برای بک‌اند هم Node.js یا Python با Django خوب هستند.", Model: "gpt-4", Status: "completed"},
			},
		},
		{
			Title: "Understanding Go Concurrency",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "What is concurrent programming in Go?", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "Concurrent programming in Go is a way to handle multiple tasks simultaneously using goroutines and channels. This makes programs more efficient and responsive.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "What are the benefits of using goroutines?", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "Goroutines are lightweight, requiring only a few KB of memory. They start quickly, can run thousands concurrently, and communicate safely through channels.", Model: "gpt-4", Status: "completed"},
				{Role: "user", Content: "Could you explain error handling in concurrent Go?", Model: "gpt-4", Status: "completed"},
				{Role: "assistant", Content: "In concurrent Go, error handling is typically done through channels and select statements. You can also use error groups for managing multiple goroutines, and panic/recover for unexpected errors. Always ensure proper error propagation to maintain program stability.", Model: "gpt-4", Status: "completed"},
			},
		},
	}

	// Set timestamps for threads and messages
	now := time.Now()
	for i := range threads {
		threads[i].CreatedAt = now
		threads[i].UpdatedAt = now
		threads[i].LastMessageAt = now

		for j := range threads[i].Messages {
			threads[i].Messages[j].CreatedAt = now.Add(time.Duration(j) * time.Minute)
		}
	}

	// Create the threads and their messages in the database
	return db.Create(&threads).Error
}
