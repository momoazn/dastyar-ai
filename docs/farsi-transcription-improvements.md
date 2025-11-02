# Farsi (Persian) Transcription Improvements

This note summarizes concrete ways to improve Farsi transcription quality in this project, grouped by: model choice, decoding options, audio pre/post‑processing, and UX.

## Model and Engine

- Prefer larger Whisper models for Farsi when feasible: `small` → `medium` → `large-v3` improves accuracy significantly, especially for dialectal variance and named entities.
- Keep `language="fa"` to disable auto‑detect confusion on short clips. The server and web already default to Farsi.
- For CPU, `compute_type="int8"` (current default) is a good speed/quality balance. For GPU, `float16` is already used.

## Decoding Options (Whisper/WhisperX)

- Use stable decoding for Farsi:
  - `temperature = 0.0`
  - `beam_size = 5` (or 3–5). If using sampling, use a small `best_of`.
- For long audios, consider `condition_on_previous_text = False` to reduce drift between segments.
- Hotwords biasing (Faster-Whisper/WhisperX): pass a list of domain terms or names to nudge decoding. Useful for product names, brand lists, or proper nouns in Farsi.
- Keep `task = "transcribe"` (not `translate`) to stay in the source language.

Note: the current Python WhisperX wrapper exposes only the essentials. If you want these options, we can extend the `/transcribe` API to accept them and forward to the engine safely.

## Audio Preprocessing

- Voice Activity Detection (VAD) cut: trim leading/trailing silence and split long files on silence. This reduces hallucinations and speeds up decoding. WhisperX supports VAD; we can add an opt‑in flag to the API.
- Ensure `ffmpeg` resamples to a consistent mono 16 kHz (Whisper friendly) path.
- Avoid very quiet recordings; normalize to a consistent loudness (e.g., EBU R128 target) before decoding.

## Post‑Processing for Farsi (Implemented)

- We now normalize common orthography and punctuation on the server when `language = "fa"`:
  - Arabic Yeh/Kaf → Persian forms (ی/ک)
  - Remove tatweel (ـ)
  - Convert `, ; ?` → `، ؛ ؟`
  - Normalize spacing around punctuation and collapse extra spaces

Files:
- `apps/whisper/api/text_normalize.py`
- Applied in both engines after transcription.

## UX and Display

- The web app is already RTL and sets `<html lang="fa" dir="rtl">`. Keep the textarea/preview `dir` synced to the selected language (implemented).
- Optional: Add a “Normalize Persian output” toggle (currently always on for `fa`).
- Optional: Provide a “Convert digits to Persian” toggle for environments that prefer Persian numerals.

## Data and Fine‑Tuning

- If accuracy on specific domains is critical, gather a small Farsi corpus (10–50 hours) and fine‑tune a medium model. Alternatively, train a small domain lexicon and pass as hotwords.
- Add a light punctuation restoration model trained on Farsi subtitles if your audio lacks natural punctuation.

## Next Steps (Low‑Risk)

1. Add optional API inputs: `beam_size`, `temperature`, `condition_on_previous_text`, `hotwords`, `vad` and forward safely to the engine.
2. Surface these as advanced options in the UI (hidden by default) for power users.
3. Keep default model at `small` or `medium` for Farsi projects where latency is acceptable; otherwise allow per‑user override.

