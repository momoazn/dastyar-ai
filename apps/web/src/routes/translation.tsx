import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import {
	TranslateButton,
	TranslationControls,
	TranslationTextAreas,
} from "@/components/translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/use-translation";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export const Route = createFileRoute("/translation")({
	component: TranslationRouteComponent,
});

function TranslationRouteComponent() {
	const [state, handlers, meta] = useTranslation();
	const {
		sourceText,
		translatedText,
		sourceLanguage,
		targetLanguage,
		tone,
		model,
		isTranslating,
		errorMessage,
		charCount,
	} = state;
	const {
		setSourceText,
		setSourceLanguage,
		setTargetLanguage,
		setTone,
		setModel,
		swapLanguages,
		translate,
		clearError,
	} = handlers;
	const { models } = meta;

	const canTranslate = Boolean(sourceText.trim() && model) && !isTranslating;
	const willCreateNew = useMemo(
		() => Boolean(sourceText && !translatedText),
		[sourceText, translatedText],
	);

	return (
		<div className="flex h-full flex-col" dir="rtl">
			{/* Header with controls */}
			<TranslationControls
				sourceLang={sourceLanguage}
				targetLang={targetLanguage}
				tone={tone}
				model={model}
				onSourceLangChange={(v) =>
					setSourceLanguage(v as typeof sourceLanguage)
				}
				onTargetLangChange={(v) =>
					setTargetLanguage(v as typeof targetLanguage)
				}
				onToneChange={(v) => setTone(v as typeof tone)}
				onModelChange={setModel}
				onSwapLanguages={swapLanguages}
				disabled={isTranslating}
				models={models}
			/>

			{/* Main content area with text areas */}
			<div className="flex flex-1 flex-col p-4">
				{errorMessage && (
					<Alert
						variant="destructive"
						role="alert"
						className="mb-3"
						dir="rtl"
						onAnimationEnd={clearError}
					>
						<TriangleAlert className="h-4 w-4" />
						<AlertTitle>خطا</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				<TranslationTextAreas
					sourceText={sourceText}
					translatedText={translatedText}
					isTranslating={isTranslating}
					onSourceTextChange={setSourceText}
					onSubmit={translate}
					placeholders={{
						enterText: PERSIAN_TEXTS.translation.enterText,
						translatedText: PERSIAN_TEXTS.translation.translatedText,
					}}
					loadingText={PERSIAN_TEXTS.translation.translating}
					charCount={charCount}
				/>

				<TranslateButton
					onTranslate={translate}
					isTranslating={isTranslating}
					text={
						willCreateNew
							? PERSIAN_TEXTS.translation.translate
							: PERSIAN_TEXTS.translation.retranslate
					}
					disabled={!canTranslate}
				/>

				{/* Subtle helper text */}
				{!!translatedText && (
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
