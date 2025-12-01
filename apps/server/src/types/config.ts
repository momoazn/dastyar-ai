/**
 * Configuration types
 * Defines the structure of configuration values
 */

export type ConfigValue = string | number | boolean | string[] | null;

export type ConfigMap = Record<string, ConfigValue>;
