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
	if err := db.Model(&Conversation{}).Count(&count).Error; err != nil {
		log.Error().Err(err).Msg("Failed to check existing conversation count")
		return err
	}

	if count > 0 {
		log.Info().Int64("existing_conversations", count).Msg("Database already contains data, skipping seed")
		return nil
	}

	log.Info().Msg("No existing data found, proceeding with seeding")

	// Create 3 test conversations with 5 messages each
	conversations := []Conversation{
		{
			Title:   "آموزش هوش مصنوعی",
			AIModel: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "هوش مصنوعی چیست و چگونه کار می‌کند؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "هوش مصنوعی سیستمی است که می‌تواند داده‌ها را تحلیل کرده و با یادگیری از آنها، تصمیم‌گیری کند. این سیستم‌ها از الگوریتم‌های پیچیده برای شبیه‌سازی تفکر انسانی استفاده می‌کنند.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "تفاوت بین یادگیری عمیق و یادگیری ماشین چیست؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "یادگیری ماشین زیرمجموعه‌ای از هوش مصنوعی است که از الگوریتم‌ها برای یادگیری از داده‌ها استفاده می‌کند. یادگیری عمیق نوع پیشرفته‌تری است که از شبکه‌های عصبی چندلایه برای یادگیری استفاده می‌کند.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "کاربردهای هوش مصنوعی در زندگی روزمره چیست؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "هوش مصنوعی در بسیاری از جنبه‌های زندگی روزمره کاربرد دارد: دستیارهای صوتی مثل سیری، پیشنهادات خرید در فروشگاه‌های آنلاین، تشخیص چهره در دوربین‌ها، سیستم‌های پیشنهاد محتوا در شبکه‌های اجتماعی، و ترجمه خودکار زبان.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
		{
			Title:   "مشاوره برنامه‌نویسی",
			AIModel: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "بهترین زبان برنامه‌نویسی برای شروع کدام است؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "پایتون یک انتخاب عالی برای شروع است. سینتکس ساده و خوانایی بالایی دارد و منابع آموزشی زیادی در دسترس است.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "چطور می‌توانم در برنامه‌نویسی پیشرفت کنم؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "تمرین مداوم، کار روی پروژه‌های شخصی، مطالعه کد دیگران و مشارکت در پروژه‌های متن‌باز بهترین راه‌های پیشرفت هستند.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "برای یادگیری وب چه مسیری را پیشنهاد می‌کنید؟", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "برای شروع، HTML و CSS را یاد بگیرید. سپس JavaScript را مطالعه کنید. بعد می‌توانید فریم‌ورک‌های مدرن مثل React یا Vue را یاد بگیرید. برای بک‌اند هم Node.js یا Python با Django خوب هستند.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
		{
			Title:   "Understanding Go Concurrency",
			AIModel: "deepseek-r1",
			Messages: []Message{
				{Role: "user", Content: "What is concurrent programming in Go?", AIModel: "gpt-4", Status: "done", SentAt: time.Now()},
				{Role: "assistant", Content: "Concurrent programming in Go is a way to handle multiple tasks simultaneously using goroutines and channels. This makes programs more efficient and responsive.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(time.Minute)},
				{Role: "user", Content: "What are the benefits of using goroutines?", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(2 * time.Minute)},
				{Role: "assistant", Content: "Goroutines are lightweight, requiring only a few KB of memory. They start quickly, can run thousands concurrently, and communicate safely through channels.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(3 * time.Minute)},
				{Role: "user", Content: "Could you explain error handling in concurrent Go?", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(4 * time.Minute)},
				{Role: "assistant", Content: "In concurrent Go, error handling is typically done through channels and select statements. You can also use error groups for managing multiple goroutines, and panic/recover for unexpected errors. Always ensure proper error propagation to maintain program stability.", AIModel: "gpt-4", Status: "done", SentAt: time.Now().Add(5 * time.Minute)},
			},
		},
	}

	// Create translation projects with example entries
	translationProjects := []TranslationProject{
		{
			Title:   "فارسی به انگلیسی",
			AIModel: "gpt-4",
			Translations: []Translation{
				{
					SourceText:     "سلام، حال شما چطور است؟",
					TranslatedText: "Hello, how are you?",
					AIModel:        "gpt-4",
					SourceLanguage: "fa",
					TargetLanguage: "en",
					Tone:           "casual",
					CreatedAt:      time.Now(),
				},
				{
					SourceText:     "من یک برنامه‌نویس هستم و در حال توسعه یک اپلیکیشن هوش مصنوعی هستم.",
					TranslatedText: "I am a programmer and I am developing an artificial intelligence application.",
					AIModel:        "gpt-4",
					SourceLanguage: "fa",
					TargetLanguage: "en",
					Tone:           "professional",
					CreatedAt:      time.Now().Add(5 * time.Minute),
				},
			},
		},
		{
			Title:   "English to Persian",
			AIModel: "gpt-4",
			Translations: []Translation{
				{
					SourceText:     "Machine learning is transforming the way we solve problems.",
					TranslatedText: "یادگیری ماشین در حال تغییر روش حل مسائل است.",
					AIModel:        "gpt-4",
					SourceLanguage: "en",
					TargetLanguage: "fa",
					Tone:           "formal",
					CreatedAt:      time.Now(),
				},
				{
					SourceText:     "The weather is beautiful today!",
					TranslatedText: "امروز هوا خیلی خوب است!",
					AIModel:        "gpt-4",
					SourceLanguage: "en",
					TargetLanguage: "fa",
					Tone:           "casual",
					CreatedAt:      time.Now().Add(5 * time.Minute),
				},
			},
		},
	}

	// Set timestamps for conversations and messages
	now := time.Now()
	for i := range conversations {
		conversations[i].CreatedAt = now.Add(-time.Duration(i) * time.Minute * 10)
		conversations[i].UpdatedAt = now.Add(-time.Duration(i) * time.Minute * 10)

		for j := range conversations[i].Messages {
			conversations[i].Messages[j].SentAt = now.Add(time.Duration(j) * time.Minute)
		}
	}

	// Set timestamps for translation projects
	for i := range translationProjects {
		translationProjects[i].CreatedAt = now.Add(-time.Duration(i) * time.Minute * 10)
		translationProjects[i].UpdatedAt = now.Add(-time.Duration(i) * time.Minute * 10)
	}

	// Create the conversations and their messages in the database
	log.Info().
		Int("conversation_count", len(conversations)).
		Int("total_messages", len(conversations)*5).
		Int("translation_project_count", len(translationProjects)).
		Int("total_translations", len(translationProjects[0].Translations)+len(translationProjects[1].Translations)).
		Msg("Creating seed data...")

	if err := db.Create(&conversations).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create conversation seed data")
		return err
	}

	if err := db.Create(&translationProjects).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create translation project seed data")
		return err
	}

	log.Info().
		Int("conversation_count", len(conversations)).
		Int("total_messages", len(conversations)*5).
		Int("translation_project_count", len(translationProjects)).
		Int("total_translations", len(translationProjects[0].Translations)+len(translationProjects[1].Translations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Seed data created successfully")

	return nil
}
