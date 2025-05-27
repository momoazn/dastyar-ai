package handlers

import (
	"ai-assistant/db"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
)

// TranslateRequest represents a translation request
// @Description Request payload for translating text between languages
type TranslateRequest struct {
	SourceText     string `json:"source_text" example:"سلام دنیا" binding:"required"` // The text to be translated
	Model          string `json:"model" example:"llama3.2:latest" binding:"required"` // The model to use for translation
	SourceLanguage string `json:"source_language" example:"fa" binding:"required"`    // Source language code (e.g., 'fa', 'en', 'ar')
	TargetLanguage string `json:"target_language" example:"en" binding:"required"`    // Target language code (e.g., 'fa', 'en', 'ar')
	Tone           string `json:"tone" example:"formal"`                              // Translation tone (formal, casual, technical, friendly)
}

// TranslateResponse represents a translation response
// @Description Response payload containing the translated text
type TranslateResponse struct {
	Translation string `json:"translation" example:"Hello World"` // The translated text
}

var (
	languageMap = map[string]string{
		"fa": "Persian (Farsi)", "en": "English", "ar": "Modern Standard Arabic",
		"fr": "French", "de": "German", "es": "Spanish", "ru": "Russian",
		"it": "Italian", "pt": "Portuguese", "ja": "Japanese", "ko": "Korean",
		"zh": "Chinese (Simplified)", "tr": "Turkish", "hi": "Hindi",
		"persian": "Persian (Farsi)", "english": "English", "arabic": "Modern Standard Arabic",
		"french": "French", "german": "German", "spanish": "Spanish",
	}

	toneMap = map[string]string{
		"formal":    "formal, respectful, and professional tone suitable for business or academic contexts",
		"casual":    "casual, friendly, and conversational tone suitable for everyday communication",
		"technical": "precise, technical, and specialized tone suitable for professional or scientific contexts",
		"friendly":  "warm, approachable, and personable tone suitable for social interactions",
	}

	translateResponseSchema = json.RawMessage(`{
		"type": "object",
		"properties": {
			"translation": {
				"type": "string",
				"minLength": 1,
				"description": "The translated text in the target language"
			}
		},
		"required": ["translation"],
		"additionalProperties": false
	}`)
)

// @Summary Get all translations
// @Description Retrieve a paginated list of all translation records, ordered by creation date (newest first)
// @Tags Translations
// @Produce json
// @Success 200 {object} PaginatedResponse[db.Translation] "List of translations with pagination info"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations [get]
// @ID getTranslations
func (h *Handler) handleGetAllTranslations(c echo.Context) error {
	log.Info().Msg("Fetching all translations")

	var translations []db.Translation
	if err := h.db.Order("created_at DESC").Find(&translations).Error; err != nil {
		log.Error().Err(err).Msg("Failed to fetch translations")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	count := len(translations)
	log.Info().Int("count", count).Msg("Translations retrieved successfully")

	return c.JSON(http.StatusOK, PaginatedResponse[db.Translation]{
		Data:        translations,
		HasNext:     count > 10,
		Total:       count,
		CurrentPage: 1,
		TotalPages:  (count + 9) / 10, // Ceiling division
	})
}

// @Summary Get translation by ID
// @Description Retrieve a specific translation record by its unique identifier
// @Tags Translations
// @Produce json
// @Param id path string true "Translation ID" example:"123"
// @Success 200 {object} Response[db.Translation] "Translation details"
// @Failure 404 {object} ErrorResponse "Translation not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations/{id} [get]
// @ID getTranslation
func (h *Handler) handleGetTranslationById(c echo.Context) error {
	translation, err := h.findTranslationByID(c.Param("id"))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, Response[db.Translation]{Data: *translation})
}

// @Summary Delete translation by ID
// @Description Delete a specific translation record by its unique identifier
// @Tags Translations
// @Produce json
// @Param id path string true "Translation ID" example:"123"
// @Success 204 "Translation deleted successfully"
// @Failure 404 {object} ErrorResponse "Translation not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /translations/{id} [delete]
// @ID deleteTranslation
func (h *Handler) handleDeleteTranslation(c echo.Context) error {
	translation, err := h.findTranslationByID(c.Param("id"))
	if err != nil {
		return err
	}

	if err := h.db.Delete(translation).Error; err != nil {
		log.Error().Err(err).Uint("id", translation.ID).Msg("Failed to delete translation")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
	}

	log.Info().Uint("id", translation.ID).Msg("Translation deleted successfully")
	return c.NoContent(http.StatusNoContent)
}

// @Summary Create translation
// @Description Translate text from one language to another using AI models. Supports multiple languages (Persian, English, Arabic, French, German, Spanish) and different tones (formal, casual, technical, friendly). The translation is processed synchronously and stored in the database.
// @Tags Translations
// @Accept json
// @Produce json
// @Param request body TranslateRequest true "Translation request payload"
// @Success 200 {object} Response[db.Translation] "Translation completed successfully"
// @Failure 400 {object} ErrorResponse "Bad request - missing required fields or invalid parameters"
// @Failure 500 {object} ErrorResponse "Internal server error - model or database error"
// @Router /translations [post]
// @ID createTranslation
func (h *Handler) handleCreateTranslation(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Processing translation request")

	// Parse and validate request
	req, err := h.parseTranslateRequest(c)
	if err != nil {
		return err
	}

	// Create and process translation
	translation, err := h.createAndProcessTranslation(c, req)
	if err != nil {
		return err
	}

	log.Info().
		Uint("id", translation.ID).
		Int("length", len(translation.TranslatedText)).
		Dur("duration", time.Since(start)).
		Msg("Translation completed successfully")

	return c.JSON(http.StatusOK, Response[db.Translation]{Data: *translation})
}

// Helper functions

func (h *Handler) findTranslationByID(id string) (*db.Translation, error) {
	translationID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		log.Error().Err(err).Str("id", id).Msg("Invalid translation ID")
		return nil, echo.NewHTTPError(http.StatusBadRequest, "Invalid translation ID")
	}

	var translation db.Translation
	if err := h.db.First(&translation, translationID).Error; err != nil {
		log.Error().Err(err).Str("id", id).Msg("Translation not found")
		return nil, echo.NewHTTPError(http.StatusNotFound, "Translation not found")
	}

	return &translation, nil
}

func (h *Handler) parseTranslateRequest(c echo.Context) (*TranslateRequest, error) {
	var req TranslateRequest
	if err := c.Bind(&req); err != nil {
		log.Error().Err(err).Msg("Failed to parse request")
		return nil, c.JSON(http.StatusBadRequest, ErrorResponse{Message: "Invalid request format"})
	}

	// Set defaults and validate
	if req.Tone == "" {
		req.Tone = "formal"
	}

	if err := h.validateTranslateRequest(&req); err != nil {
		return nil, c.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
	}

	log.Info().
		Str("source_lang", req.SourceLanguage).
		Str("target_lang", req.TargetLanguage).
		Str("tone", req.Tone).
		Int("text_length", len(req.SourceText)).
		Msg("Translation request validated")

	return &req, nil
}

func (h *Handler) validateTranslateRequest(req *TranslateRequest) error {
	switch {
	case req.SourceText == "":
		return fmt.Errorf("source_text is required")
	case req.Model == "":
		return fmt.Errorf("model is required")
	case req.SourceLanguage == "":
		return fmt.Errorf("source_language is required")
	case req.TargetLanguage == "":
		return fmt.Errorf("target_language is required")
	default:
		return nil
	}
}

func (h *Handler) createAndProcessTranslation(c echo.Context, req *TranslateRequest) (*db.Translation, error) {
	// Create translation record
	translation := &db.Translation{
		SourceText:     req.SourceText,
		Model:          req.Model,
		SourceLanguage: req.SourceLanguage,
		TargetLanguage: req.TargetLanguage,
		Tone:           req.Tone,
		Instructions:   h.buildSystemPrompt(req),
		CreatedAt:      time.Now(),
	}

	if err := h.db.Create(translation).Error; err != nil {
		log.Error().Err(err).Msg("Failed to create translation record")
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to create translation")
	}

	// Process translation with AI
	translatedText, err := h.callTranslationAPI(c, translation)
	if err != nil {
		log.Error().Err(err).Uint("id", translation.ID).Msg("Translation processing failed")
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Translation processing failed")
	}

	// Update with result
	translation.TranslatedText = translatedText
	if err := h.db.Save(translation).Error; err != nil {
		log.Error().Err(err).Uint("id", translation.ID).Msg("Failed to save translation result")
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "Failed to save translation")
	}

	return translation, nil
}

func (h *Handler) callTranslationAPI(c echo.Context, translation *db.Translation) (string, error) {
	var result string

	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model: translation.Model,
		Messages: []api.Message{{
			Role:    "user",
			Content: translation.Instructions,
		}},
		Format: translateResponseSchema,
		Stream: func() *bool { b := false; return &b }(),
		Options: map[string]interface{}{
			"temperature": 0.3, // Lower temperature for more consistent translations
			"top_p":       0.9,
			"top_k":       40,
		},
	}, func(response api.ChatResponse) error {
		var translateResponse TranslateResponse
		if err := json.Unmarshal([]byte(response.Message.Content), &translateResponse); err != nil {
			log.Error().Err(err).Msg("Failed to parse translation response")
			return err
		}
		result = translateResponse.Translation
		return nil
	})

	if err != nil {
		return "", err
	}

	// Post-process and validate the translation
	result = h.postProcessTranslation(result, translation.SourceLanguage, translation.TargetLanguage)

	if result == "" {
		return "", fmt.Errorf("translation result is empty")
	}

	return result, nil
}

// postProcessTranslation cleans up and validates translation results
func (h *Handler) postProcessTranslation(text, sourceLang, targetLang string) string {
	// Remove common unwanted prefixes/suffixes that AI models sometimes add
	unwantedPrefixes := []string{
		"Translation: ",
		"Here is the translation: ",
		"The translation is: ",
		"Translated text: ",
		"Result: ",
	}

	unwantedSuffixes := []string{
		"\n\nNote:",
		"\n\nExplanation:",
		"\n\n---",
		"\n\nTranslation note:",
	}

	// Clean up the text
	result := strings.TrimSpace(text)

	// Remove unwanted prefixes
	for _, prefix := range unwantedPrefixes {
		if strings.HasPrefix(result, prefix) {
			result = strings.TrimSpace(strings.TrimPrefix(result, prefix))
		}
	}

	// Remove unwanted suffixes
	for _, suffix := range unwantedSuffixes {
		if idx := strings.Index(result, suffix); idx != -1 {
			result = strings.TrimSpace(result[:idx])
		}
	}

	// Language-specific post-processing
	switch targetLang {
	case "fa": // Persian
		result = h.postProcessPersian(result)
	case "ar": // Arabic
		result = h.postProcessArabic(result)
	case "en": // English
		result = h.postProcessEnglish(result)
	}

	return result
}

// postProcessPersian applies Persian-specific cleaning
func (h *Handler) postProcessPersian(text string) string {
	// Fix common Persian typography issues
	text = strings.ReplaceAll(text, "?", "؟") // Replace question mark
	text = strings.ReplaceAll(text, ";", "؛") // Replace semicolon
	text = strings.ReplaceAll(text, "ي", "ی") // Fix Arabic ya to Persian ya
	text = strings.ReplaceAll(text, "ك", "ک") // Fix Arabic kaf to Persian kaf
	text = strings.ReplaceAll(text, "٠", "۰") // Fix Arabic-Indic digits
	text = strings.ReplaceAll(text, "١", "۱")
	text = strings.ReplaceAll(text, "٢", "۲")
	text = strings.ReplaceAll(text, "٣", "۳")
	text = strings.ReplaceAll(text, "٤", "۴")
	text = strings.ReplaceAll(text, "٥", "۵")
	text = strings.ReplaceAll(text, "٦", "۶")
	text = strings.ReplaceAll(text, "٧", "۷")
	text = strings.ReplaceAll(text, "٨", "۸")
	text = strings.ReplaceAll(text, "٩", "۹")

	return text
}

// postProcessArabic applies Arabic-specific cleaning
func (h *Handler) postProcessArabic(text string) string {
	// Ensure proper Arabic typography
	text = strings.ReplaceAll(text, "ي", "ي") // Keep Arabic ya
	text = strings.ReplaceAll(text, "ک", "ك") // Use Arabic kaf
	text = strings.ReplaceAll(text, "؟", "؟") // Keep Arabic question mark

	return text
}

// postProcessEnglish applies English-specific cleaning
func (h *Handler) postProcessEnglish(text string) string {
	// Fix common English typography issues
	text = strings.ReplaceAll(text, "؟", "?") // Replace Persian question mark
	text = strings.ReplaceAll(text, "؛", ";") // Replace Persian semicolon

	// Ensure proper capitalization of sentences
	sentences := strings.Split(text, ". ")
	for i, sentence := range sentences {
		if len(sentence) > 0 {
			sentences[i] = strings.ToUpper(string(sentence[0])) + sentence[1:]
		}
	}
	text = strings.Join(sentences, ". ")

	return text
}

func (h *Handler) buildSystemPrompt(req *TranslateRequest) string {
	sourceLang := getLanguageName(req.SourceLanguage)
	targetLang := getLanguageName(req.TargetLanguage)
	toneDesc := getToneDescription(req.Tone)

	// Special instructions for specific language pairs
	var languageSpecificInstructions string
	if req.SourceLanguage == "en" && req.TargetLanguage == "fa" {
		languageSpecificInstructions = `
PERSIAN-SPECIFIC GUIDELINES:
• Use proper Persian grammar and sentence structure
• Choose appropriate Persian vocabulary over loan words when natural equivalents exist
• Maintain proper Persian politeness levels and honorifics
• Use correct Persian punctuation (؟ for questions, ؛ for semicolons)
• Handle English technical terms appropriately (transliterate or translate based on common usage)
• Preserve Persian reading flow (right-to-left)`
	} else if req.SourceLanguage == "fa" && req.TargetLanguage == "en" {
		languageSpecificInstructions = `
ENGLISH-SPECIFIC GUIDELINES:
• Use natural English phrasing and idioms
• Convert Persian cultural concepts to equivalent English expressions when appropriate
• Maintain appropriate English formality levels
• Use standard English punctuation and capitalization
• Handle Persian proper nouns and technical terms appropriately`
	} else if req.TargetLanguage == "ar" {
		languageSpecificInstructions = `
ARABIC-SPECIFIC GUIDELINES:
• Use Modern Standard Arabic unless specified otherwise
• Apply correct Arabic grammar, including case endings where appropriate
• Choose classical Arabic vocabulary when suitable for the context
• Use proper Arabic punctuation and diacritics when necessary
• Maintain Arabic sentence structure and flow`
	}

	return fmt.Sprintf(`You are an expert professional translator with deep cultural and linguistic knowledge of %s and %s languages. Your task is to provide accurate, natural, and contextually appropriate translations.

SOURCE LANGUAGE: %s
TARGET LANGUAGE: %s
TRANSLATION STYLE: %s

CORE TRANSLATION PRINCIPLES:
1. ACCURACY: Preserve the exact meaning, intent, and nuance of the original text
2. NATURALNESS: Ensure the translation reads naturally in the target language
3. CONTEXT PRESERVATION: Maintain the original context, purpose, and audience
4. CULTURAL ADAPTATION: Adapt cultural references and idioms appropriately for the target culture
5. TONE CONSISTENCY: Maintain the specified tone throughout the translation

DETAILED GUIDELINES:

CONTENT HANDLING:
• Translate the complete text without omitting any parts
• Preserve the original structure, paragraph breaks, and formatting
• Keep proper nouns (names, places, brands) in their original form unless commonly translated
• Handle numbers, dates, and measurements according to target language conventions
• Maintain any technical terminology accuracy

LANGUAGE QUALITY:
• Use natural, fluent phrasing that sounds native to the target language
• Avoid literal word-for-word translations that sound unnatural
• Choose vocabulary appropriate for the specified tone and context
• Ensure grammatical correctness and proper syntax
• Maintain consistent terminology throughout the text

CULTURAL SENSITIVITY:
• Adapt idioms, metaphors, and cultural references to equivalent expressions in the target culture
• Consider cultural context when translating humor, wordplay, or cultural-specific concepts
• Respect cultural sensitivities and social norms of the target language community
• Handle religious, political, or sensitive topics with appropriate cultural awareness

FORMATTING & STRUCTURE:
• Preserve bullet points, lists, and hierarchical structures
• Maintain emphasis (bold, italics) and special formatting when possible
• Keep line breaks and paragraph structure intact
• Preserve any special characters, symbols, or markup that don't require translation

QUALITY ASSURANCE:
• Ensure the translation sounds natural when read aloud
• Verify that the meaning is complete and accurate
• Check that the tone matches the specified style requirement
• Confirm cultural appropriateness for the target audience

%s

IMPORTANT: Respond ONLY with the translation. Do not include explanations, notes, or commentary.

TEXT TO TRANSLATE:
%s`, sourceLang, targetLang, sourceLang, targetLang, toneDesc, languageSpecificInstructions, req.SourceText)
}

func getLanguageName(code string) string {
	if name, exists := languageMap[code]; exists {
		return name
	}
	return code
}

func getToneDescription(tone string) string {
	if desc, exists := toneMap[tone]; exists {
		return desc
	}
	return tone
}
