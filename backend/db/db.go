package db

import (
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
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
	Think     string    `json:"think"`
	Model     string    `json:"model"`
	State     string    `json:"state"`
	Timestamp time.Time `json:"timestamp"`
}

type TranslateMessage struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	ThreadID   uint      `json:"thread_id"`
	Thread     Thread    `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Content    string    `json:"content"`
	Model      string    `json:"model"`
	SourceLang string    `json:"source_lang"`
	TargetLang string    `json:"target_lang"`
	State      string    `json:"state"`
	Tone       string    `json:"tone"`
	Timestamp  time.Time `json:"timestamp"`
}

// Initialize database connection and create tables
func InitDB() (*gorm.DB, error) {
	start := time.Now()
	log.Info().Msg("Initializing database connection...")

	db, err := gorm.Open(sqlite.Open("../chats.db"), &gorm.Config{
		Logger: logger.New(
			&log.Logger,
			logger.Config{
				SlowThreshold:             time.Second, // Log queries slower than 1s
				LogLevel:                  logger.Info, // Log all SQL queries
				IgnoreRecordNotFoundError: false,       // Log not found errors
				Colorful:                  false,       // Disable color
			},
		),
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to connect to database")
		return nil, err
	}
	log.Info().Dur("duration_ms", time.Since(start)).Msg("Database connection established")

	// Auto migrate the schema
	log.Info().Msg("Running database migrations...")
	migStart := time.Now()
	if err := db.AutoMigrate(&Thread{}, &ChatMessage{}, &TranslateMessage{}); err != nil {
		log.Error().Err(err).Msg("Failed to run database migrations")
		return nil, err
	}
	log.Info().Dur("duration_ms", time.Since(migStart)).Msg("Database migrations done")

	// Seed initial data
	log.Info().Msg("Checking for seed data...")
	if err := seedDatabase(db); err != nil {
		log.Error().Err(err).Msg("Failed to seed database")
		return nil, err
	}

	// Log some database stats
	var threadCount, messageCount int64
	if err := db.Model(&Thread{}).Count(&threadCount).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to get thread count")
	}
	if err := db.Model(&ChatMessage{}).Count(&messageCount).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to get message count")
	}

	log.Info().
		Int64("thread_count", threadCount).
		Int64("message_count", messageCount).
		Dur("total_duration_ms", time.Since(start)).
		Msg("Database initialization done successfully")

	return db, nil
}

// seedDatabase adds test data to the database for UI testing purposes.
// It includes both English and Persian content to ensure proper multilingual support.
func seedDatabase(db *gorm.DB) error {
	start := time.Now()
	log.Info().Msg("Starting database seeding process...")

	// Check if seeding has already been done
	var count int64
	if err := db.Model(&Thread{}).Count(&count).Error; err != nil {
		log.Error().Err(err).Msg("Failed to check existing thread count")
		return err
	}

	if count > 0 {
		log.Info().Int64("existing_threads", count).Msg("Database already contains data, skipping seed")
		return nil
	}

	log.Info().Msg("No existing data found, proceeding with seeding")

	// Create 3 test threads with 5 messages each
	threads := []Thread{
		{
			Title: "آموزش هوش مصنوعی",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "هوش مصنوعی چیست و چگونه کار می‌کند؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "هوش مصنوعی سیستمی است که می‌تواند داده‌ها را تحلیل کرده و با یادگیری از آنها، تصمیم‌گیری کند. این سیستم‌ها از الگوریتم‌های پیچیده برای شبیه‌سازی تفکر انسانی استفاده می‌کنند.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "تفاوت بین یادگیری عمیق و یادگیری ماشین چیست؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "یادگیری ماشین زیرمجموعه‌ای از هوش مصنوعی است که از الگوریتم‌ها برای یادگیری از داده‌ها استفاده می‌کند. یادگیری عمیق نوع پیشرفته‌تری است که از شبکه‌های عصبی چندلایه برای یادگیری استفاده می‌کند.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "کاربردهای هوش مصنوعی در زندگی روزمره چیست؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "هوش مصنوعی در بسیاری از جنبه‌های زندگی روزمره کاربرد دارد: دستیارهای صوتی مثل سیری، پیشنهادات خرید در فروشگاه‌های آنلاین، تشخیص چهره در دوربین‌ها، سیستم‌های پیشنهاد محتوا در شبکه‌های اجتماعی، و ترجمه خودکار زبان.", Model: "gpt-4", State: "done"},
			},
		},
		{
			Title: "مشاوره برنامه‌نویسی",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "بهترین زبان برنامه‌نویسی برای شروع کدام است؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "پایتون یک انتخاب عالی برای شروع است. سینتکس ساده و خوانایی بالایی دارد و منابع آموزشی زیادی در دسترس است.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "چطور می‌توانم در برنامه‌نویسی پیشرفت کنم؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "تمرین مداوم، کار روی پروژه‌های شخصی، مطالعه کد دیگران و مشارکت در پروژه‌های متن‌باز بهترین راه‌های پیشرفت هستند.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "برای یادگیری وب چه مسیری را پیشنهاد می‌کنید؟", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "برای شروع، HTML و CSS را یاد بگیرید. سپس JavaScript را مطالعه کنید. بعد می‌توانید فریم‌ورک‌های مدرن مثل React یا Vue را یاد بگیرید. برای بک‌اند هم Node.js یا Python با Django خوب هستند.", Model: "gpt-4", State: "done"},
			},
		},
		{
			Title: "Understanding Go Concurrency",
			Model: "gpt-4",
			Messages: []ChatMessage{
				{Role: "user", Content: "What is concurrent programming in Go?", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "Concurrent programming in Go is a way to handle multiple tasks simultaneously using goroutines and channels. This makes programs more efficient and responsive.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "What are the benefits of using goroutines?", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "Goroutines are lightweight, requiring only a few KB of memory. They start quickly, can run thousands concurrently, and communicate safely through channels.", Model: "gpt-4", State: "done"},
				{Role: "user", Content: "Could you explain error handling in concurrent Go?", Model: "gpt-4", State: "done"},
				{Role: "assistant", Content: "In concurrent Go, error handling is typically done through channels and select statements. You can also use error groups for managing multiple goroutines, and panic/recover for unexpected errors. Always ensure proper error propagation to maintain program stability.", Model: "gpt-4", State: "done"},
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
			threads[i].Messages[j].Timestamp = now.Add(time.Duration(j) * time.Minute)
		}
	}

	// Create the threads and their messages in the database
	log.Info().
		Int("thread_count", len(threads)).
		Int("total_messages", len(threads)*5).
		Msg("Creating seed data...")

	if err := db.Create(&threads).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create seed data")
		return err
	}

	log.Info().
		Int("thread_count", len(threads)).
		Int("total_messages", len(threads)*5).
		Dur("duration_ms", time.Since(start)).
		Msg("Seed data created successfully")

	return nil
}
