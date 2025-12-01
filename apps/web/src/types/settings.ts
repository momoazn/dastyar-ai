/**
 * System settings types
 * Defines the structure of system settings values
 */

export type SystemSettingValue = string | number | boolean | string[] | null;

export type SystemSettingsMap = Record<string, SystemSettingValue>;

export type SystemSettingKey =
  | "app_name"
  | "app_description"
  | "max_file_size_mb"
  | "allowed_file_types"
  | "token_expiration_hours"
  | "session_timeout_minutes"
  | "password_min_length"
  | "password_require_special_chars"
  | "password_require_numbers"
  | "password_require_uppercase"
  | "rate_limit_enabled"
  | "rate_limit_requests_per_minute"
  | "model_response_timeout_seconds"
  | "enable_transcription"
  | "enable_translation"
  | "enable_code_execution"
  | "enable_image_generation";

export type TypedSystemSetting<T extends SystemSettingKey> = {
  key: T;
  value: SystemSettingValue;
  description?: string;
};
