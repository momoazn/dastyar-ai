<!-- 04f8150e-a163-4d90-96b4-8e04236fd087 9da99d59-e961-402d-bc39-a576d3b5245b -->
# Refactor Image Generation Flow

## Problems Identified

1. **Excessive prop drilling**: `ImageGenerationInput` receives 17+ props
2. **Duplicate state management**: Both routes destructure identical state
3. **Complex dual initialization in image.$id.tsx**: Two separate useEffect hooks (lines 144-181, 184-213) with duplicated search param parsing
4. **Duplicated type coercion**: String → number conversions repeated across multiple places
5. **Manual pending state**: `pendingPrompt` state duplicates loading information
6. **Size conversion scattered**: String ↔ object conversion logic in hook (lines 121-136)
7. **Inconsistent submit handlers**: Different patterns between routes

## Proposed Solution

### 1. Add Utilities (Extract Duplicated Logic)

**File**: `apps/web/src/lib/image-generation-constants.ts`

Add size conversion functions:

```typescript
export function parseSizeValue(value: string): { width: number; height: number }
export function formatSizeValue(width: number, height: number): string
```

**File**: `apps/web/src/lib/image-generation-utils.ts`

Add unified search param parser:

```typescript
export function parseSearchParams(search: Record<string, unknown>): {
  settings: Partial<GenerationSettings>;
  initialPrompt: string | null;
}
```

This consolidates the duplicated coercion logic from lines 149-207 in `image.$id.tsx`.

### 2. Enhance `useImageGeneration` Hook

**File**: `apps/web/src/hooks/use-image-generation.ts`

**Add new capabilities**:

1. **Unified initialization method**:
```typescript
const initializeFromSearch = useCallback((search: Record<string, unknown>) => {
  const { settings: parsedSettings, initialPrompt } = parseSearchParams(search);
  if (Object.keys(parsedSettings).length > 0) {
    updateSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
  }
  if (initialPrompt) {
    setPrompt(initialPrompt);
  }
}, [updateSettings]);
```

2. **Auto-submit handler** (replaces complex useEffect logic):
```typescript
const handleAutoSubmit = useCallback(async (
  threadId: number,
  onRename?: (title: string) => Promise<void>
) => {
  if (!prompt.trim() || isGenerating) return null;
  
  const result = await generate({
    ...settings,
    prompt,
    threadId,
  });
  
  if (result && onRename && images.length === 0) {
    await onRename(prompt.slice(0, 50));
  }
  
  setPrompt(""); // Clear after success
  return result;
}, [prompt, isGenerating, generate, settings, images.length]);
```

3. **Bundle form props** (reduce prop drilling):
```typescript
const formProps = useMemo(() => ({
  prompt, setPrompt,
  negativePrompt, setNegativePrompt,
  advancedSettingsOpen, setAdvancedSettingsOpen,
  transcribeModel, setTranscribeModel,
  settings,
  handleSizeChange,
  getSizeValue,
  handleTranscribeError,
  handleTranscribed,
  samplers,
}), [
  prompt, negativePrompt, advancedSettingsOpen, 
  transcribeModel, settings, samplers,
  handleSizeChange, getSizeValue,
  handleTranscribeError, handleTranscribed
]);
```


**Return structure**:

```typescript
return {
  // API data
  images, samplers, isServiceAvailable, isGenerating,
  
  // Actions
  generate, downloadImage, refetchImages,
  updateSettings, resetSettings,
  
  // NEW: Bundled form props
  formProps,
  
  // NEW: Initialization & auto-submit
  initializeFromSearch,
  handleAutoSubmit,
};
```

### 3. Simplify `ImageGenerationInput` Component

**File**: `apps/web/src/components/image-generation/image-generation-input.tsx`

**Changes**:

- Replace 17 individual props with bundled `formProps` + submission props
- Component becomes a thin wrapper

**New props** (lines 11-18):

```typescript
type ImageGenerationInputProps = {
  formProps: ReturnType<typeof useImageGeneration>['formProps'];
  onSubmit: () => void;
  onResetSettings: () => void;
  isGenerating: boolean;
  submitDisabled?: boolean;
  submitStatus?: "submitted" | undefined;
  submitVariant?: "default" | "destructive";
};
```

**Destructure from formProps** (line ~40):

```typescript
const {
  prompt, setPrompt, negativePrompt, setNegativePrompt,
  advancedSettingsOpen, setAdvancedSettingsOpen,
  transcribeModel, setTranscribeModel, settings,
  handleSizeChange, getSizeValue, samplers,
  handleTranscribeError, handleTranscribed,
} = formProps;
```

### 4. Dramatically Simplify `image.$id.tsx`

**File**: `apps/web/src/routes/image.$id.tsx`

**Remove** (net -90 lines):

- `pendingPrompt` state (line 51) - use `isGenerating` instead
- Manual `handleSubmitWithRename` (lines 86-131) - use `handleAutoSubmit` from hook
- First useEffect for settings merge (lines 144-181) - use `initializeFromSearch`
- Second useEffect for auto-submit (lines 184-213) - use `handleAutoSubmit`
- Duplicate destructuring (lines 64-78) - use `formProps`

**Add** (net +30 lines):

```typescript
const { 
  formProps, 
  images, 
  isServiceAvailable, 
  isGenerating,
  downloadImage,
  refetchImages,
  resetSettings,
  initializeFromSearch,
  handleAutoSubmit,
} = useImageGeneration({ threadId: numericThreadId });

const { rename } = useImageThreads();

// Single initialization useEffect
const hasInitializedRef = useRef(false);
useEffect(() => {
  if (hasInitializedRef.current) return;
  hasInitializedRef.current = true;
  
  initializeFromSearch(search);
  
  // Auto-submit if initialPrompt provided
  if (search.initialPrompt && images.length === 0) {
    handleAutoSubmit(numericThreadId, (title) => 
      rename.mutateAsync({ id: numericThreadId, title })
    );
  }
}, [search, images.length, numericThreadId, initializeFromSearch, handleAutoSubmit, rename]);

// Simple submit handler
const handleSubmit = () => {
  if (!formProps.prompt.trim() || !isServiceAvailable || isGenerating) return;
  
  handleAutoSubmit(numericThreadId, 
    images.length === 0 
      ? (title) => rename.mutateAsync({ id: numericThreadId, title })
      : undefined
  );
};
```

**ImageGenerationInput usage** (lines 341-377 become ~5 lines):

```typescript
<ImageGenerationInput
  formProps={formProps}
  onSubmit={handleSubmit}
  onResetSettings={resetSettings}
  isGenerating={isGenerating}
  submitDisabled={!formProps.prompt.trim() || !isServiceAvailable}
  submitStatus={isGenerating ? "submitted" : undefined}
  submitVariant={isGenerating ? "destructive" : "default"}
/>
```

**Pending prompt rendering** (lines 302-322 simplified):

```typescript
{isGenerating && images.length > 0 && formProps.prompt && (
  <>
    <AIMsg from="user">
      <AIMsgContent>
        <div className="whitespace-pre-wrap leading-relaxed">
          {formProps.prompt}
        </div>
        {formProps.negativePrompt && (
          <div className="text-[12px] text-muted-foreground">
            {fa.imageGeneration.negativePrefix} {formProps.negativePrompt}
          </div>
        )}
      </AIMsgContent>
    </AIMsg>
    <AIMsg from="assistant">
      <AIMsgContent><Loader /></AIMsgContent>
    </AIMsg>
  </>
)}
```

### 5. Simplify `image.index.tsx`

**File**: `apps/web/src/routes/image.index.tsx`

**Changes**:

- Use `formProps` bundle
- Simplify navigation handler

**Simplified hook usage** (lines 23-41 become ~5 lines):

```typescript
const { 
  formProps, 
  isServiceAvailable 
} = useImageGeneration();

const { create } = useImageThreads();
const [creating, setCreating] = useState(false);
```

**Simplified handler** (lines 43-80 become ~20 lines):

```typescript
const handleCreateAndNavigate = useCallback(async () => {
  const trimmed = formProps.prompt.trim();
  if (!trimmed || creating || !isServiceAvailable) return;
  
  try {
    setCreating(true);
    const created = await create.mutateAsync({
      title: fa.imageChat.newChatDefaultTitle,
    });
    
    navigate({
      to: "/image/$id",
      params: { id: created.id.toString() },
      search: {
        initialPrompt: trimmed,
        ...formProps.settings,
        negativePrompt: formProps.negativePrompt,
      },
    });
  } finally {
    setCreating(false);
  }
}, [formProps, creating, isServiceAvailable, create, navigate]);
```

**Simplified input** (lines 94-114 become ~7 lines):

```typescript
<ImageGenerationInput
  formProps={formProps}
  onSubmit={handleCreateAndNavigate}
  onResetSettings={resetSettings}
  isGenerating={creating}
  submitDisabled={creating || !formProps.prompt.trim()}
/>
```

## Key Improvements

1. **Unified initialization**: One `initializeFromSearch` replaces two complex useEffect hooks
2. **Eliminated manual pending state**: Use `isGenerating` + `formProps.prompt` instead
3. **Consistent submit pattern**: `handleAutoSubmit` works for both routes
4. **Less prop drilling**: 17 props → 8 props on `ImageGenerationInput`
5. **Centralized parsing**: All type coercion in one utility function
6. **Simpler route logic**: `image.$id.tsx` loses ~90 lines of complexity

## Benefits

- **-130 lines of code** across the codebase
- **Single useEffect in image.$id.tsx** instead of two complex ones
- **No manual pending state** management
- **Consistent initialization** pattern across routes
- **Type-safe bundled props** via TypeScript inference
- **Same exact behavior** preserved

## Migration Order

1. Add utilities (`parseSizeValue`, `formatSizeValue`, `parseSearchParams`)
2. Enhance `useImageGeneration` hook (add `formProps`, `initializeFromSearch`, `handleAutoSubmit`)
3. Update `ImageGenerationInput` to use `formProps` bundle
4. Refactor `image.$id.tsx` (replace dual useEffects, remove pendingPrompt, use new hook API)
5. Refactor `image.index.tsx` (use formProps, simplify handler)
6. Test all flows thoroughly

### To-dos

- [ ] Create ImageGenerationFormContext with provider and hooks
- [ ] Add size conversion and settings initialization utilities
- [ ] Simplify useImageGeneration hook by removing form state
- [ ] Update ImageGenerationInput to consume context instead of props
- [ ] Update both route components to use context and utilities
- [ ] Remove unused code and verify type safety across all files