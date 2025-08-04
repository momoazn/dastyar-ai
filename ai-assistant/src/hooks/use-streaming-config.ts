"use client";

import { useState, useCallback } from "react";

interface StreamingConfig {
  isEnabled: boolean;
  bufferSize: number;
  debounceMs: number;
  autoScroll: boolean;
}

const DEFAULT_CONFIG: StreamingConfig = {
  isEnabled: true,
  bufferSize: 50,
  debounceMs: 100,
  autoScroll: true,
};

export function useStreamingConfig(initialConfig?: Partial<StreamingConfig>) {
  const [config, setConfig] = useState<StreamingConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const updateConfig = useCallback((updates: Partial<StreamingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleStreaming = useCallback(() => {
    setConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setConfig(prev => ({ ...prev, autoScroll: !prev.autoScroll }));
  }, []);

  return {
    config,
    updateConfig,
    toggleStreaming,
    toggleAutoScroll,
  };
}