import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  chatModelIdAtom,
  codeModelIdAtom,
  summarizeModelIdAtom,
  translationModelIdAtom,
} from "@/atoms/model";
import { orpc } from "@/utils/orpc";
import { useUser } from "@/hooks/use-user";

type UseFeatureModelSelectionOptions = {
  threadId?: number;
  enabled?: boolean;
};

// Chat model selection hook
export function useChatModelSelection({
  threadId,
  enabled = true,
}: UseFeatureModelSelectionOptions = {}) {
  const [modelId, setModelId] = useAtom(chatModelIdAtom);

  const modelsQuery = useQuery({
    ...orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
    }),
    enabled,
  });

  // Get last used model in the current thread
  const threadLastUsedModelQuery = useQuery({
    ...orpc.messages.getLastUsedModel.queryOptions({
      input: { threadId: threadId || 0 },
    }),
    enabled: enabled && !!threadId,
  });

  // Get last used model across all messages (for empty threads)
  const globalLastUsedModelQuery = useQuery({
    ...orpc.messages.getLastUsedModelGlobal.queryOptions(),
    enabled: enabled && !threadId,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!modelsQuery.data) {
      return;
    }

    // If no model is selected, set a default based on priority
    if (!modelId) {
      // Priority 1: Last used model in current thread (if thread has messages)
      if (threadId && threadLastUsedModelQuery.data) {
        setModelId(threadLastUsedModelQuery.data.id);
        return;
      }

      // Priority 2: Last used model from all messages (if thread is empty)
      if (!threadId && globalLastUsedModelQuery.data) {
        setModelId(globalLastUsedModelQuery.data.id);
        return;
      }

      // Priority 3: First model in models list
      if (modelsQuery.data.length > 0) {
        setModelId(modelsQuery.data[0].id);
      }
    }
  }, [
    modelsQuery.data,
    modelId,
    setModelId,
    threadId,
    threadLastUsedModelQuery.data,
    globalLastUsedModelQuery.data,
    enabled,
  ]);

  return {
    modelId,
    setModelId,
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
  };
}

// Summarize model selection hook
export function useSummarizeModelSelection({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const [modelId, setModelId] = useAtom(summarizeModelIdAtom);
  const { data: user } = useUser();

  const modelsQuery = useQuery(
    orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
      enabled,
    })
  );

  const preferencesQuery = useQuery({
    ...orpc.settings.getPreferences.queryOptions(),
    enabled: enabled && !!user,
  });

  useEffect(() => {
    if (!(enabled && modelsQuery.data)) {
      return;
    }

    // If no model is selected, set a default based on priority
    if (!modelId) {
      // Priority 1: User preference
      if (preferencesQuery.data?.summarizeModelId) {
        setModelId(preferencesQuery.data.summarizeModelId);
        return;
      }

      // Priority 2: First available model
      if (modelsQuery.data.length > 0) {
        setModelId(modelsQuery.data[0].id);
      }
    }
  }, [modelsQuery.data, modelId, setModelId, enabled, preferencesQuery.data]);

  return {
    modelId,
    setModelId,
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
  };
}

// Translation model selection hook
export function useTranslationModelSelection({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const [modelId, setModelId] = useAtom(translationModelIdAtom);
  const { data: user } = useUser();

  const modelsQuery = useQuery(
    orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
      enabled,
    })
  );

  const preferencesQuery = useQuery({
    ...orpc.settings.getPreferences.queryOptions(),
    enabled: enabled && !!user,
  });

  useEffect(() => {
    if (!(enabled && modelsQuery.data)) {
      return;
    }

    // If no model is selected, set a default based on priority
    if (!modelId) {
      // Priority 1: User preference
      if (preferencesQuery.data?.translationModelId) {
        setModelId(preferencesQuery.data.translationModelId);
        return;
      }

      // Priority 2: First available model
      if (modelsQuery.data.length > 0) {
        setModelId(modelsQuery.data[0].id);
      }
    }
  }, [modelsQuery.data, modelId, setModelId, enabled, preferencesQuery.data]);

  return {
    modelId,
    setModelId,
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
  };
}

// Code model selection hook
export function useCodeModelSelection({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const [modelId, setModelId] = useAtom(codeModelIdAtom);
  const { data: user } = useUser();

  const modelsQuery = useQuery(
    orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
      enabled,
    })
  );

  const preferencesQuery = useQuery({
    ...orpc.settings.getPreferences.queryOptions(),
    enabled: enabled && !!user,
  });

  useEffect(() => {
    if (!(enabled && modelsQuery.data)) {
      return;
    }

    // If no model is selected, set a default based on priority
    if (!modelId) {
      // Priority 1: User preference
      if (preferencesQuery.data?.codeModelId) {
        setModelId(preferencesQuery.data.codeModelId);
        return;
      }

      // Priority 2: First available model
      if (modelsQuery.data.length > 0) {
        setModelId(modelsQuery.data[0].id);
      }
    }
  }, [modelsQuery.data, modelId, setModelId, enabled, preferencesQuery.data]);

  return {
    modelId,
    setModelId,
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
  };
}
