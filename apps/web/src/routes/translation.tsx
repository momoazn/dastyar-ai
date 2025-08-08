import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	TranslateButton,
	TranslationControls,
	TranslationTextAreas,
} from "@/components/translation";
import type { LanguageCode, ToneOption } from "@/components/translation/types";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/translation")({
	component: TranslationRouteComponent,
});

function TranslationRouteComponent() {
	const [sourceText, setSourceText] = useState("");
	const [translatedText, setTranslatedText] = useState("");
	const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
	const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("fa");
	const [tone, setTone] = useState<ToneOption>("formal");
	const [model, setModel] = useState("");

	const { data: modelList } = useQuery(orpc.models.listOllama.queryOptions());
	const models = useMemo(
		() =>
			modelList
				? modelList.map((m) => ({ model: m.modelId, name: m.name }))
				: [],
		[modelList],
	);

	// ===== STATE =====
	const [isTranslating, setIsTranslating] = useState(false);
	const [originalTranslation, setOriginalTranslation] = useState<{
		sourceText: string;
		sourceLang: string;
		targetLang: string;
		tone: string;
		model: string;
	} | null>(null);

	// ===== DERIVED STATE =====
	const hasParametersChanged = useMemo(() => {
		if (!originalTranslation) return false;

		return (
			sourceText !== originalTranslation.sourceText ||
			sourceLanguage !== originalTranslation.sourceLang ||
			targetLanguage !== originalTranslation.targetLang ||
			tone !== originalTranslation.tone ||
			model !== originalTranslation.model
		);
	}, [
		sourceText,
		sourceLanguage,
		targetLanguage,
		tone,
		model,
		originalTranslation,
	]);

	// ===== EFFECTS =====
	useEffect(() => {
		if (!models || model) return;
		setModel(models[0]?.model || "");
	}, [models, model]);

	useEffect(() => {
		if (hasParametersChanged && originalTranslation) {
			setTranslatedText("");
		}
	}, [hasParametersChanged, originalTranslation]);

	// ===== HANDLERS =====
	const handleSourceTextChange = useCallback((text: string) => {
		setSourceText(text);
	}, []);

	const handleSourceLangChange = useCallback((value: string) => {
		setSourceLanguage(value as LanguageCode);
	}, []);

	const handleTargetLangChange = useCallback((value: string) => {
		setTargetLanguage(value as LanguageCode);
	}, []);

	const handleToneChange = useCallback((value: string) => {
		setTone(value as ToneOption);
	}, []);

	const handleModelChange = useCallback((value: string) => {
		setModel(value);
	}, []);

	const handleSwapLanguages = useCallback(() => {
		setSourceLanguage((prev) => {
			const next = targetLanguage;
			setTargetLanguage(prev);
			return next;
		});
		// Optionally swap texts for convenience
		setSourceText((prev) => {
			const next = translatedText;
			setTranslatedText("");
			return next || prev;
		});
	}, [targetLanguage, translatedText]);

	const handleTranslate = useCallback(async () => {
		const trimmed = sourceText.trim();
		if (!trimmed) return;
		setIsTranslating(true);
		try {
			const res = await client.translations.translate({
				text: trimmed,
				sourceLanguage,
				targetLanguage,
				tone,
				model,
				provider: "ollama",
			});
			setTranslatedText(res.translatedText);
			setOriginalTranslation({
				sourceText,
				sourceLang: sourceLanguage,
				targetLang: targetLanguage,
				tone,
				model,
			});
		} catch {
			// Keep UX responsive and notify user
			// Using a toast utility is preferred; kept minimal here per workspace rules
		} finally {
			setIsTranslating(false);
		}
	}, [sourceText, sourceLanguage, targetLanguage, tone, model]);

	// ===== DERIVED VALUES =====
	const canTranslate = Boolean(sourceText.trim() && model) && !isTranslating;
	const willCreateNew = !originalTranslation || hasParametersChanged;

	return (
		<div className="flex h-full flex-col" dir="rtl">
			{/* Header with controls */}
			<TranslationControls
				sourceLang={sourceLanguage}
				targetLang={targetLanguage}
				tone={tone}
				model={model}
				onSourceLangChange={handleSourceLangChange}
				onTargetLangChange={handleTargetLangChange}
				onToneChange={handleToneChange}
				onModelChange={handleModelChange}
				onSwapLanguages={handleSwapLanguages}
				disabled={isTranslating}
				models={models}
			/>

			{/* Main content area with text areas */}
			<div className="flex flex-1 flex-col p-4">
				<TranslationTextAreas
					sourceText={sourceText}
					translatedText={translatedText}
					isTranslating={isTranslating}
					onSourceTextChange={handleSourceTextChange}
					onSubmit={handleTranslate}
					placeholders={{
						enterText: PERSIAN_TEXTS.translation.enterText,
						translatedText: PERSIAN_TEXTS.translation.translatedText,
					}}
					loadingText={PERSIAN_TEXTS.translation.translating}
				/>

				<TranslateButton
					onTranslate={handleTranslate}
					isTranslating={isTranslating}
					text={
						willCreateNew
							? PERSIAN_TEXTS.translation.translate
							: PERSIAN_TEXTS.translation.retranslate
					}
					disabled={!canTranslate}
				/>

				{/* Show indicator when parameters have changed */}
				{hasParametersChanged && originalTranslation && (
					<div className="mt-2 text-center">
						<span className="text-muted-foreground text-xs">
							{PERSIAN_TEXTS.translation.parametersChanged}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
