import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import {
  ArrowLeftRightIcon,
  ClipboardIcon,
  SendIcon,
  TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { LanguageCode, ToneOption } from '@/components/translation/types';
import { languages, tones } from '@/components/translation/types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { detectTextDirection } from '@/lib/utils';
import { orpc, queryClient } from '@/utils/orpc';

export const Route = createFileRoute('/translation')({
  component: TranslationPage,
});

function TranslationPage() {
  const search = useSearch({ from: '/translation' }) as { id?: string };
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('fa');
  const [tone, setTone] = useState<ToneOption>('formal');
  const [modelId, setModelId] = useState('');

  const { data: modelList } = useQuery(
    orpc.models.list.queryOptions({ input: { isEnabled: true } })
  );

  // Load translation if ID is provided in URL
  const { data: selectedTranslation } = useQuery(
    orpc.translations.get.queryOptions({
      input: { id: search.id || '' },
      enabled: !!search.id,
    })
  );

  const translateMutation = useMutation(
    orpc.translations.translate.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.translations.list.queryKey(),
        });
        setTranslatedText(data.translatedText ?? '');
        // Update URL to reflect the new translation
        navigate({
          to: '/translation',
          search: { id: data.id },
        });
      },
    })
  );

  // Load translation data when selectedTranslation changes
  useEffect(() => {
    if (selectedTranslation) {
      setSourceText(selectedTranslation.sourceText || '');
      setTranslatedText(selectedTranslation.translatedText || '');
      setSourceLanguage(selectedTranslation.sourceLanguage as LanguageCode);
      setTargetLanguage(selectedTranslation.targetLanguage as LanguageCode);
      setTone((selectedTranslation.tone as ToneOption) || 'formal');
      setModelId(selectedTranslation.modelId || '');
    }
  }, [selectedTranslation]);

  useEffect(() => {
    if (modelList && modelList.length > 0 && !modelId) {
      setModelId(modelList[0].id);
    }
  }, [modelList, modelId]);

  const swapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText('');
  }, [sourceLanguage, targetLanguage, translatedText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch {
      // Silent fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      translateMutation.mutate({
        text: sourceText,
        sourceLanguage,
        targetLanguage,
        tone,
        modelId,
      });
    }
  };

  const canTranslate =
    Boolean(sourceText.trim() && modelId) && !translateMutation.isPending;
  const charCount = sourceText.length;

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Controls Header */}
      <div className="bg-background p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Source Language */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.translation.sourceLanguage}
            </div>
            <Select
              disabled={translateMutation.isPending}
              onValueChange={(v) => setSourceLanguage(v as LanguageCode)}
              value={sourceLanguage}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {languages.map((lang) => (
                  <SelectItem
                    className="text-right"
                    key={lang.value}
                    value={lang.value}
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Language */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.translation.targetLanguage}
            </div>
            <Select
              disabled={translateMutation.isPending}
              onValueChange={(v) => setTargetLanguage(v as LanguageCode)}
              value={targetLanguage}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {languages.map((lang) => (
                  <SelectItem
                    className="text-right"
                    key={lang.value}
                    value={lang.value}
                  >
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.translation.translationTone}
            </div>
            <Select
              disabled={translateMutation.isPending}
              onValueChange={(v) => setTone(v as ToneOption)}
              value={tone}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {tones.map((t) => (
                  <SelectItem
                    className="text-right"
                    key={t.value}
                    value={t.value}
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">{fa.translation.model}</div>
            <Select
              disabled={translateMutation.isPending}
              onValueChange={setModelId}
              value={modelId}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modelList?.map((m) => (
                  <SelectItem className="text-right" key={m.id} value={m.id}>
                    {m.name || m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap Languages Button */}
        <div className="mt-3 flex justify-end">
          <Button
            disabled={translateMutation.isPending}
            onClick={swapLanguages}
            type="button"
            variant="outline"
          >
            <ArrowLeftRightIcon className="mr-2 h-4 w-4" />
            {fa.translation.sourceLanguage} ↔ {fa.translation.targetLanguage}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Error Alert */}
        {translateMutation.error && (
          <Alert className="mb-3" dir="rtl" role="alert" variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>
              {translateMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Text Areas */}
        <div className="flex h-full w-full flex-col gap-4">
          {/* Source Text Area */}
          <Card aria-live="polite" className="flex-2/5 p-4">
            <div className="flex h-full flex-col">
              {/* Header with counter and hint */}
              <div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
                <span>{charCount} کاراکتر</span>
                <span>
                  {sourceText.trim() ? '⌘/Ctrl+Enter برای ترجمه' : ''}
                </span>
              </div>

              {/* Text area */}
              <Textarea
                aria-label={fa.translation.enterText}
                className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
                dir={sourceText ? detectTextDirection(sourceText) : 'rtl'}
                onChange={(e) => setSourceText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={fa.translation.enterText}
                value={sourceText}
              />
            </div>
          </Card>

          {/* Translated Text Area */}
          <Card className="flex-2/5 p-4">
            <div className="flex h-full flex-col">
              {translateMutation.isPending ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-muted-foreground">
                    {fa.translation.translating}...
                  </div>
                </div>
              ) : (
                <>
                  {/* Header with copy button */}
                  <div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
                    <span>{fa.translation.translatedText}</span>
                    <Button
                      aria-label={fa.translation.copyTranslation}
                      className="h-6 px-2"
                      disabled={!translatedText}
                      onClick={handleCopy}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ClipboardIcon className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Text area */}
                  <Textarea
                    aria-label={fa.translation.translatedText}
                    aria-readonly
                    className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
                    dir={
                      translatedText
                        ? detectTextDirection(translatedText)
                        : 'rtl'
                    }
                    placeholder={fa.translation.translatedText}
                    readOnly
                    value={translatedText}
                  />
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Translate Button */}
        <div className="mt-4 flex w-full flex-1/5 justify-end">
          <Button
            className="w-full cursor-pointer"
            disabled={!canTranslate}
            onClick={() =>
              translateMutation.mutate({
                text: sourceText,
                sourceLanguage,
                targetLanguage,
                tone,
                modelId,
              })
            }
            size="lg"
            type="button"
            variant="outline"
          >
            <span className="text-sm">
              {translatedText
                ? fa.translation.retranslate
                : fa.translation.translate}
            </span>
            <SendIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
