import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LanguageCode, ToneOption } from "@/components/translation/types";
import { modelsQueryOptions, translateText } from "@/services/translation";

interface UseTranslationState {
	sourceText: string;
	translatedText: string;
	sourceLanguage: LanguageCode;
	targetLanguage: LanguageCode;
	tone: ToneOption;
	model: string;
	isTranslating: boolean;
	errorMessage: string | null;
	charCount: number;
}

interface UseTranslationHandlers {
	setSourceText: (text: string) => void;
	setSourceLanguage: (lang: LanguageCode) => void;
	setTargetLanguage: (lang: LanguageCode) => void;
	setTone: (tone: ToneOption) => void;
	setModel: (model: string) => void;
	swapLanguages: () => void;
	translate: () => Promise<void>;
	clearError: () => void;
}

export function useTranslation(): [
	UseTranslationState,
	UseTranslationHandlers,
	{ models: Array<{ model: string; name?: string }> },
] {
	const [sourceText, setSourceText] = useState("");
	const [translatedText, setTranslatedText] = useState("");
	const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
	const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("fa");
	const [tone, setTone] = useState<ToneOption>("formal");
	const [model, setModel] = useState("");
	const [isTranslating, setIsTranslating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const { data: modelList } = useQuery(modelsQueryOptions());
	const models = useMemo(
		() =>
			modelList
				? modelList.map((m) => ({ model: m.modelId, name: m.name }))
				: [],
		[modelList],
	);

	// original request snapshot to detect parameter changes
	const [originalTranslation, setOriginalTranslation] = useState<{
		sourceText: string;
		sourceLang: string;
		targetLang: string;
		tone: string;
		model: string;
	} | null>(null);

	const hasParametersChanged = useMemo(() => {
		if (!originalTranslation) return false;
		return (
			sourceText !== originalTranslation.sourceText ||
			sourceLanguage !== originalTranslation.sourceLang ||
			targetLanguage !== originalTranslation.targetLang ||
			tone !== (originalTranslation.tone as ToneOption) ||
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

	useEffect(() => {
		if (!models || model) return;
		setModel(models[0]?.model ?? "");
	}, [models, model]);

	useEffect(() => {
		if (hasParametersChanged && originalTranslation) {
			setTranslatedText("");
		}
	}, [hasParametersChanged, originalTranslation]);

	const swapLanguages = useCallback(() => {
		setSourceLanguage((prev) => {
			const next = targetLanguage;
			setTargetLanguage(prev);
			return next;
		});
		setSourceText((prev) => {
			const next = translatedText;
			setTranslatedText("");
			return next || prev;
		});
	}, [targetLanguage, translatedText]);

	const translate = useCallback(async () => {
		const trimmed = sourceText.trim();
		if (!trimmed || !model) return;
		setIsTranslating(true);
		setErrorMessage(null);
		try {
			const res = await translateText({
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
		} catch (error) {
			const message = error instanceof Error ? error.message : "خطا در ترجمه";
			setErrorMessage(message);
		} finally {
			setIsTranslating(false);
		}
	}, [sourceText, sourceLanguage, targetLanguage, tone, model]);

	const charCount = sourceText.length;

	return [
		{
			sourceText,
			translatedText,
			sourceLanguage,
			targetLanguage,
			tone,
			model,
			isTranslating,
			errorMessage,
			charCount,
		},
		{
			setSourceText,
			setSourceLanguage,
			setTargetLanguage,
			setTone,
			setModel,
			swapLanguages,
			translate,
			clearError: () => setErrorMessage(null),
		},
		{ models },
	];
}
