import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { Copy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Alert,
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

export const Route = createFileRoute('/summarize')({
  component: SummarizePage,
});

type SummarizeMode = 'concise' | 'standard' | 'detailed';
type ToneOption = 'neutral' | 'formal' | 'casual';

const modes: Array<{ value: SummarizeMode; label: string }> = [
  { value: 'concise', label: fa.summarize.modes.concise },
  { value: 'standard', label: fa.summarize.modes.standard },
  { value: 'detailed', label: fa.summarize.modes.detailed },
];

const tones: Array<{ value: ToneOption; label: string }> = [
  { value: 'neutral', label: fa.tones.neutral },
  { value: 'formal', label: fa.tones.formal },
  { value: 'casual', label: fa.tones.casual },
];

function SummarizePage() {
  const search = useSearch({ from: '/summarize' }) as { id?: string };
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [mode, setMode] = useState<SummarizeMode>('standard');
  const [tone, setTone] = useState<ToneOption>('neutral');
  const [modelId, setModelId] = useState('');

  const { data: modelList } = useQuery(
    orpc.models.list.queryOptions({ input: { isEnabled: true } })
  );

  // Load summary if ID is provided in URL
  const { data: selectedSummary } = useQuery(
    orpc.summarize.get.queryOptions({
      input: { id: search.id || '' },
      enabled: !!search.id,
    })
  );

  const summarizeMutation = useMutation(
    orpc.summarize.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.summarize.list.queryKey(),
        });
        setSummaryText(data.summaryText ?? '');
        // Update URL to reflect the new summary
        navigate({
          to: '/summarize',
          search: { id: data.id },
        });
      },
    })
  );

  // Load summary data when selectedSummary changes
  useEffect(() => {
    if (selectedSummary) {
      setSourceText(selectedSummary.sourceText || '');
      setSummaryText(selectedSummary.summaryText || '');
      setMode(selectedSummary.mode as SummarizeMode);
      setTone((selectedSummary.tone as ToneOption) || 'neutral');
      setModelId(selectedSummary.modelId || '');
    }
  }, [selectedSummary]);

  useEffect(() => {
    if (modelList && modelList.length > 0 && !modelId) {
      setModelId(modelList[0].id);
    }
  }, [modelList, modelId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      summarizeMutation.mutate({
        text: sourceText,
        mode,
        tone,
        modelId,
      });
    }
  };

  const canSummarize =
    Boolean(sourceText.trim() && modelId) && !summarizeMutation.isPending;
  const charCount = sourceText.length;

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Controls Header */}
      <div className="bg-background p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Mode */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">{fa.summarize.modeLabel}</div>
            <Select
              disabled={summarizeMutation.isPending}
              onValueChange={(v) => setMode(v as SummarizeMode)}
              value={mode}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modes.map((m) => (
                  <SelectItem
                    className="text-right"
                    key={m.value}
                    value={m.value}
                  >
                    {m.label}
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
              disabled={summarizeMutation.isPending}
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
            <div className="font-medium text-sm">{fa.summarize.model}</div>
            <Select
              disabled={summarizeMutation.isPending}
              onValueChange={(value) => setModelId(value)}
              value={modelId}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modelList?.map((model) => (
                  <SelectItem
                    className="text-right"
                    key={model.id}
                    value={model.id}
                  >
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 p-4">
        {/* Source Text */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">متن اصلی</h3>
            <span className="text-muted-foreground text-sm">
              {charCount} کاراکتر
            </span>
          </div>
          <Textarea
            className="min-h-[200px] resize-none"
            dir={sourceText ? detectTextDirection(sourceText) : 'rtl'}
            disabled={summarizeMutation.isPending}
            onChange={(e) => setSourceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={fa.summarize.enterText}
            value={sourceText}
          />
          <div className="mt-2 text-muted-foreground text-xs">
            برای خلاصه‌سازی از ⌘/Ctrl+Enter استفاده کنید
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">{fa.summarize.generatedText}</h3>
            {summaryText && (
              <Button onClick={handleCopy} size="sm" variant="ghost">
                <Copy className="h-4 w-4" />
                {fa.summarize.copy}
              </Button>
            )}
          </div>
          <Textarea
            className="min-h-[200px] resize-none"
            dir={summaryText ? detectTextDirection(summaryText) : 'rtl'}
            placeholder="خلاصه اینجا نمایش داده می‌شود..."
            readOnly
            value={summaryText}
          />
        </Card>

        {/* Error Display */}
        {summarizeMutation.isError && (
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <span>{fa.summarize.errors.requestFailed}</span>
              <span>{fa.translation.tryAgain}</span>
            </div>
          </Alert>
        )}

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            className="min-w-[120px]"
            disabled={!canSummarize}
            onClick={() =>
              summarizeMutation.mutate({
                text: sourceText,
                mode,
                tone,
                modelId,
              })
            }
          >
            {summarizeMutation.isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                {fa.summarize.generating}
              </>
            ) : (
              fa.summarize.generate
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
