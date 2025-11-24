// Database types - exported from server schema
// These types are used in the frontend for type safety

export interface SelectSystemSetting {
  id: number;
  key: string;
  value: unknown;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelectUser {
  id: number;
  username: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface SelectLlmModel {
  id: number;
  identifier: string;
  provider: "ollama" | "lmstudio" | "stable-diffusion" | "whisper";
  isEnabled: boolean;
  creator?: string | null;
  family?: string | null;
  size?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
