package db

import (
	"os"
	"time"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Initialize database connection and create tables
func InitDB() (*gorm.DB, error) {
	start := time.Now()
	log.Info().Msg("Initializing database connection...")

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./chats.db"
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
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
	if err := db.AutoMigrate(&ChatThread{}, &Message{}, &Translation{}); err != nil {
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
	var chatThreadCount, messageCount, translationCount int64
	if err := db.Model(&ChatThread{}).Count(&chatThreadCount).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to get chat thread count")
	}
	if err := db.Model(&Message{}).Count(&messageCount).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to get message count")
	}
	if err := db.Model(&Translation{}).Count(&translationCount).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to get translation count")
	}

	log.Info().
		Int64("chat_thread_count", chatThreadCount).
		Int64("message_count", messageCount).
		Int64("translation_count", translationCount).
		Dur("total_duration_ms", time.Since(start)).
		Msg("Database initialization done successfully")

	return db, nil
}
