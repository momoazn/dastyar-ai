package db

import (
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// seedDatabase adds test data to the database for UI testing purposes.
// It includes both English and Persian content to ensure proper multilingual support.
func seedDatabase(db *gorm.DB) error {
	start := time.Now()
	log.Info().Msg("Starting database seeding process...")

	// Check if seeding has already been done
	var count int64
	if err := db.Model(&ChatThread{}).Count(&count).Error; err != nil {
		log.Error().Err(err).Msg("Failed to check existing chat threads count")
		return err
	}

	if count > 0 {
		log.Info().Int64("existing_chatThreads", count).Msg("Database already contains data, skipping seed")
		return nil
	}

	log.Info().Msg("No existing data found, proceeding with seeding")

	// Create 3 test chatThreads with 5 messages each
	chatThreads := []ChatThread{
		{
			Title: "آموزش هوش مصنوعی",
			Model: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "هوش مصنوعی چیست و چگونه کار می‌کند؟", Model: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "هوش مصنوعی سیستمی است که می‌تواند داده‌ها را تحلیل کرده و با یادگیری از آنها، تصمیم‌گیری کند. این سیستم‌ها از الگوریتم‌های پیچیده برای شبیه‌سازی تفکر انسانی استفاده می‌کنند.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "تفاوت بین یادگیری عمیق و یادگیری ماشین چیست؟", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "یادگیری ماشین زیرمجموعه‌ای از هوش مصنوعی است که از الگوریتم‌ها برای یادگیری از داده‌ها استفاده می‌کند. یادگیری عمیق نوع پیشرفته‌تری است که از شبکه‌های عصبی چندلایه برای یادگیری استفاده می‌کند.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "کاربردهای هوش مصنوعی در زندگی روزمره چیست؟", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "هوش مصنوعی در بسیاری از جنبه‌های زندگی روزمره کاربرد دارد: دستیارهای صوتی مثل سیری، پیشنهادات خرید در فروشگاه‌های آنلاین، تشخیص چهره در دوربین‌ها، سیستم‌های پیشنهاد محتوا در شبکه‌های اجتماعی، و ترجمه خودکار زبان.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
		{
			Title: "مشاوره برنامه‌نویسی",
			Model: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "بهترین زبان برنامه‌نویسی برای شروع کدام است؟", Model: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "پایتون یک انتخاب عالی برای شروع است. سینتکس ساده و خوانایی بالایی دارد و منابع آموزشی زیادی در دسترس است.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "چطور می‌توانم در برنامه‌نویسی پیشرفت کنم؟", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "تمرین مداوم، کار روی پروژه‌های شخصی، مطالعه کد دیگران و مشارکت در پروژه‌های متن‌باز بهترین راه‌های پیشرفت هستند.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "برای یادگیری وب چه مسیری را پیشنهاد می‌کنید؟", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "برای شروع، HTML و CSS را یاد بگیرید. سپس JavaScript را مطالعه کنید. بعد می‌توانید فریم‌ورک‌های مدرن مثل React یا Vue را یاد بگیرید. برای بک‌اند هم Node.js یا Python با Django خوب هستند.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
		{
			Title: "Understanding Go Concurrency",
			Model: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "What is concurrent programming in Go?", Model: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "Concurrent programming in Go is a way to handle multiple tasks simultaneously using goroutines and channels. This makes programs more efficient and responsive.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "What are the benefits of using goroutines?", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "Goroutines are lightweight, requiring only a few KB of memory. They start quickly, can run thousands concurrently, and communicate safely through channels.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "Could you explain error handling in concurrent Go?", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "In concurrent Go, error handling is typically done through channels and select statements. You can also use error groups for managing multiple goroutines, and panic/recover for unexpected errors. Always ensure proper error propagation to maintain program stability.", Model: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
	}

	// Create translation threads with example entries
	translations := []Translation{
		{
			SourceText:     "سلام، حال شما چطور است؟",
			TranslatedText: "Hello, how are you?",
			Model:          "gpt-4",
			SourceLanguage: "fa",
			TargetLanguage: "en",
			Tone:           "casual",
			CreatedAt:      time.Now(),
		},
		{
			SourceText:     "من یک برنامه‌نویس هستم و در حال توسعه یک اپلیکیشن هوش مصنوعی هستم.",
			TranslatedText: "I am a programmer and I am developing an artificial intelligence application.",
			Model:          "gpt-4",
			SourceLanguage: "fa",
			TargetLanguage: "en",
			Tone:           "professional",
			CreatedAt:      time.Now().Add(5 * time.Minute),
		},
		{
			SourceText:     "Machine learning is transforming the way we solve problems.",
			TranslatedText: "یادگیری ماشین در حال تغییر روش حل مسائل است.",
			Model:          "gpt-4",
			SourceLanguage: "en",
			TargetLanguage: "fa",
			Tone:           "formal",
			CreatedAt:      time.Now(),
		},
		{
			SourceText:     "The weather is beautiful today!",
			TranslatedText: "امروز هوا خیلی خوب است!",
			Model:          "gpt-4",
			SourceLanguage: "en",
			TargetLanguage: "fa",
			Tone:           "casual",
			CreatedAt:      time.Now().Add(5 * time.Minute),
		},
	}

	// Set timestamps for chatThreads and messages
	now := time.Now()
	for i := range chatThreads {
		chatThreads[i].CreatedAt = now.Add(-time.Duration(i) * time.Minute * 10)
		chatThreads[i].UpdatedAt = now.Add(-time.Duration(i) * time.Minute * 10)

		for j := range chatThreads[i].Messages {
			chatThreads[i].Messages[j].SentAt = now.Add(time.Duration(j) * time.Minute)
		}
	}

	// Set timestamps for translation threads
	for i := range translations {
		translations[i].CreatedAt = now.Add(-time.Duration(i) * time.Minute * 10)
	}

	// Create the chatThreads and their messages in the database
	log.Info().
		Int("chat_threads_count", len(chatThreads)).
		Int("total_messages", len(chatThreads)*5).
		Int("translation_threads_count", len(translations)).
		Int("total_translations", len(translations)).
		Msg("Creating seed data...")

	if err := db.Create(&chatThreads).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create chat threads seed data")
		return err
	}

	if err := db.Create(&translations).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create translations seed data")
		return err
	}

	log.Info().
		Int("chat_threads_count", len(chatThreads)).
		Int("total_messages", len(chatThreads)*5).
		Int("total_translations", len(translations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Seed data created successfully")

	return nil
}
