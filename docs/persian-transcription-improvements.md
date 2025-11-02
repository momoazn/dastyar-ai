# Persian Transcription Improvements

## Summary

This document outlines the improvements made to enhance Persian/Farsi transcription accuracy in the Whisper API service.

## Implemented Improvements

### 1. Initial Prompt Support ✅

**What it does**: Allows users to provide domain-specific vocabulary, proper nouns, and technical terms to guide transcription.

**Why it helps**: Whisper can better recognize specialized terms and names when given context through an initial prompt.

**Implementation**:
- Added `initial_prompt` parameter to API schemas (apps/whisper/api/schemas.py)
- Updated API route to accept the parameter (apps/whisper/api/routes.py)
- Modified whisper_engine.py to use initial_prompt in transcription

**Usage example**:
```python
# When calling the transcription API, include:
initial_prompt = "نام‌های خاص و اصطلاحات تخصصی مانند محمدحسین، دستیار هوش مصنوعی"
```

**Note**: The initial_prompt only affects the first 30 seconds of audio, as subsequent segments use the previous transcription as context.

### 2. Default Model Upgrade: tiny → large-v2 ✅

**What changed**: Default model changed from "tiny" to "large-v2"

**Why it helps**:
- Research shows tiny and small models perform poorly for Persian
- large-v2 achieves ~14% WER on clean Persian speech vs ~30%+ for smaller models
- Provides significantly better accuracy for Persian's complex phonology

**Configuration**: Updated in `apps/whisper/api/config.py`

**Trade-off**: Slower transcription, but much better accuracy for Persian

### 3. Language Parameter Set to 'fa' ✅

**What it does**: Explicitly sets language to Persian instead of auto-detection

**Why it helps**: Avoids auto-detection overhead and ensures Persian-optimized processing

**Already implemented**: The API already supports the `language` parameter. Users should pass `language="fa"` for Persian transcription.

### 4. Temperature = 0.0 ✅

**What it does**: Uses deterministic output (no randomness)

**Why it helps**: Provides consistent, repeatable transcriptions

**Already implemented**: Set in whisper_engine.py line 96

### 5. Enhanced Persian Normalization with Hazm ✅

**What it does**: Uses the hazm library for comprehensive Persian text normalization

**Why it helps**:
- Converts Arabic characters to Persian equivalents (ي → ی, ك → ک)
- Unicode normalization (NFC, NFKC)
- Character variant normalization
- Persian-specific text cleaning
- More comprehensive than basic character mapping

**Implementation**:
- Added hazm>=1.0.0 to dependencies
- Updated text_normalize.py with hazm integration
- Falls back to basic normalization if hazm is unavailable

**Normalization steps**:
1. Arabic to Persian character conversion
2. Remove tatweel (ـ)
3. Convert Latin punctuation to Persian (، ؛ ؟)
4. Normalize spacing around punctuation
5. Collapse multiple spaces

## Performance Expectations

### Before Improvements (tiny model, no optimization):
- WER: ~30-40% on Persian speech
- Many typos and invalid Persian words
- Poor handling of specialized vocabulary

### After Improvements (large-v2 + optimizations):
- WER: ~14-20% on clean Persian speech
- Better word formation
- Improved handling of domain-specific terms (with initial_prompt)
- More consistent output

## Usage Guidelines

### For Best Results:

1. **Use large-v2 or large-v3 model**:
   ```python
   model = "large-v2"  # or "large-v3"
   ```

2. **Always set language explicitly**:
   ```python
   language = "fa"
   ```

3. **Provide domain-specific initial_prompt**:
   ```python
   initial_prompt = "نام‌های خاص: محمدحسین، علی، فاطمه. اصطلاحات: هوش مصنوعی، یادگیری ماشین"
   ```

4. **Use high-quality audio**:
   - 16kHz sample rate recommended
   - Minimize background noise
   - Clear speech

### API Call Example:

```python
# Using the Whisper API
import requests

url = "http://localhost:8001/transcribe"
files = {"file": open("audio.wav", "rb")}
data = {
    "model": "large-v2",
    "language": "fa",
    "engine": "whisper",
    "initial_prompt": "نام‌های خاص و اصطلاحات تخصصی"
}

response = requests.post(url, files=files, data=data)
result = response.json()
print(result["text"])
```

## Further Improvements (Future Considerations)

### 1. Fine-tuned Models
- Use pre-trained fine-tuned models on Common Voice Persian:
  - `speechbrain/asr-whisper-large-v2-commonvoice-fa`
  - `vhdm/whisper-large-fa-v1`
- Expected WER: ~10-14% on domain-specific data

### 2. Custom Fine-tuning
- Collect 300+ hours of domain-specific Persian audio
- Fine-tune on your use case
- Expected WER: <10% on target domain

### 3. Post-processing with Language Models
- Apply Persian language models for context-aware correction
- Fix common transcription errors
- Improve punctuation and formatting

### 4. Whisper.cpp Integration
- 3x faster inference than Python implementation
- Same accuracy with better performance

## Known Limitations

1. **Limited Training Data**: Whisper was trained on only 24 hours of Persian speech (vs 563,000 hours for English)

2. **Initial Prompt Scope**: Only affects the first 30 seconds of audio

3. **Model Size**: large-v2 requires more compute resources:
   - ~3GB VRAM (GPU)
   - Slower CPU inference
   - Larger download size

4. **Small Model Performance**: tiny/small/base models perform poorly for Persian and should be avoided

## Testing

To verify the improvements work correctly:

1. **Install dependencies**:
   ```bash
   cd apps/whisper
   uv pip install -e .
   ```

2. **Start the server**:
   ```bash
   python -m api.main
   ```

3. **Test with Persian audio**:
   ```bash
   curl -X POST "http://localhost:8001/transcribe" \
     -F "file=@test_persian.wav" \
     -F "model=large-v2" \
     -F "language=fa" \
     -F "engine=whisper" \
     -F "initial_prompt=نام‌های خاص و اصطلاحات تخصصی"
   ```

## References

- [OpenAI Whisper](https://github.com/openai/whisper)
- [Hazm - Persian NLP Library](https://github.com/roshan-research/hazm)
- [Fine-tuning Whisper on Persian](https://github.com/AriaAhmadii/persian_speech_to_text)
- [Common Voice Persian Dataset](https://commonvoice.mozilla.org/fa)
- [Whisper Persian Models on Hugging Face](https://huggingface.co/models?search=whisper+persian)

## Changelog

### 2025-11-03
- ✅ Added initial_prompt parameter support
- ✅ Changed default model from tiny to large-v2
- ✅ Added hazm library for enhanced Persian normalization
- ✅ Updated documentation

### Previous
- ✅ Temperature set to 0.0 for deterministic output
- ✅ Language parameter support
- ✅ Basic Persian text normalization
