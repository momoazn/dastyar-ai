import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowLeftRightIcon,
	ClipboardCheck,
	ClipboardIcon,
	SendIcon,
	TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { LanguageCode, ToneOption } from "@/components/translation/types";
import { languages, tones } from "@/components/translation/types";
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
} from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { modelsQueryOptions, translateText } from "@/services/translation";

export const Route = createFileRoute("/translation")({
	component: TranslationPage,
});

function TranslationPage() {
	// State
	const [sourceText, setSourceText] = useState("");
	const [translatedText, setTranslatedText] = useState("");
	const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
	const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("fa");
	const [tone, setTone] = useState<ToneOption>("formal");
	const [model, setModel] = useState("");
	const [isTranslating, setIsTranslating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [hasCopied, setHasCopied] = useState(false);

	// Queries
	const { data: modelList } = useQuery(modelsQueryOptions());
	const models =
		modelList?.map((m) => ({
			model: m.modelId,
			name: m.name,
			provider: m.provider,
		})) ?? [];

	// Effects
	useEffect(() => {
		if (models.length > 0 && !model) {
			setModel(models[0].model);
		}
	}, [models, model]);

	useEffect(() => {
		if (!hasCopied) {
			return;
		}
		const timer = setTimeout(() => setHasCopied(false), 1500);
		return () => clearTimeout(timer);
	}, [hasCopied]);

	// Handlers
	const swapLanguages = useCallback(() => {
		setSourceLanguage(targetLanguage);
		setTargetLanguage(sourceLanguage);
		setSourceText(translatedText);
		setTranslatedText("");
	}, [sourceLanguage, targetLanguage, translatedText]);

	const handleTranslate = useCallback(async () => {
		const trimmed = sourceText.trim();
		if (!(trimmed && model)) {
			return;
		}

		// Find the selected model to get its provider
		const selectedModel = models.find((m) => m.model === model);
		if (!selectedModel) {
			setErrorMessage("مدل انتخاب شده یافت نشد");
			return;
		}

		setIsTranslating(true);
		setErrorMessage(null);

		try {
			const result = await translateText({
				text: trimmed,
				sourceLanguage,
				targetLanguage,
				tone,
				model,
				provider: selectedModel.provider as
					| "ollama"
					| "lmstudio"
					| "openai"
					| "anthropic"
					| "gemini"
					| "mistral"
					| "openrouter"
					| "requesty",
			});
			setTranslatedText(result.translatedText ?? "");
		} catch (error) {
			const message = error instanceof Error ? error.message : "خطا در ترجمه";
			setErrorMessage(message);
		} finally {
			setIsTranslating(false);
		}
	}, [sourceText, sourceLanguage, targetLanguage, tone, model, models]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(translatedText);
			setHasCopied(true);
		} catch {
			// Silent fail
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
			handleTranslate();
		}
	};

	// Computed values
	const canTranslate = Boolean(sourceText.trim() && model) && !isTranslating;
	const charCount = sourceText.length;

	return (
		<div className="flex h-full flex-col" dir="rtl">
			{/* Controls Header */}
			<div className="bg-background p-4">
				<div className="grid grid-cols-4 gap-4">
					{/* Source Language */}
					<div className="flex flex-col gap-2">
						<div className="font-medium text-sm">
							{PERSIAN_TEXTS.translation.sourceLanguage}
						</div>
						<Select
							disabled={isTranslating}
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
							{PERSIAN_TEXTS.translation.targetLanguage}
						</div>
						<Select
							disabled={isTranslating}
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
							{PERSIAN_TEXTS.translation.translationTone}
						</div>
						<Select
							disabled={isTranslating}
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
						<div className="font-medium text-sm">
							{PERSIAN_TEXTS.translation.model}
						</div>
						<Select
							disabled={isTranslating}
							onValueChange={setModel}
							value={model}
						>
							<SelectTrigger className="w-full text-right" dir="rtl">
								<SelectValue />
							</SelectTrigger>
							<SelectContent dir="rtl">
								{models.map((m) => (
									<SelectItem
										className="text-right"
										key={m.model}
										value={m.model}
									>
										{m.name || m.model}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Swap Languages Button */}
				<div className="mt-3 flex justify-end">
					<Button
						disabled={isTranslating}
						onClick={swapLanguages}
						type="button"
						variant="outline"
					>
						<ArrowLeftRightIcon className="mr-2 h-4 w-4" />
						{PERSIAN_TEXTS.translation.sourceLanguage} ↔{" "}
						{PERSIAN_TEXTS.translation.targetLanguage}
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 flex-col p-4">
				{/* Error Alert */}
				{errorMessage && (
					<Alert className="mb-3" dir="rtl" role="alert" variant="destructive">
						<TriangleAlert className="h-4 w-4" />
						<AlertTitle>خطا</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
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
									{sourceText.trim() ? "⌘/Ctrl+Enter برای ترجمه" : ""}
								</span>
							</div>

							{/* Text area */}
							<Textarea
								aria-label={PERSIAN_TEXTS.translation.enterText}
								className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
								onChange={(e) => setSourceText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={PERSIAN_TEXTS.translation.enterText}
								value={sourceText}
							/>
						</div>
					</Card>

					{/* Translated Text Area */}
					<Card className="flex-2/5 p-4">
						<div className="flex h-full flex-col">
							{isTranslating ? (
								<div className="flex h-full items-center justify-center">
									<div className="text-muted-foreground">
										{PERSIAN_TEXTS.translation.translating}...
									</div>
								</div>
							) : (
								<>
									{/* Header with copy button */}
									<div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
										<span>{PERSIAN_TEXTS.translation.translatedText}</span>
										<Button
											aria-label="کپی ترجمه"
											className="h-6 px-2"
											disabled={!translatedText}
											onClick={handleCopy}
											size="sm"
											type="button"
											variant="ghost"
										>
											{hasCopied ? (
												<ClipboardCheck className="h-3 w-3" />
											) : (
												<ClipboardIcon className="h-3 w-3" />
											)}
										</Button>
									</div>

									{/* Text area */}
									<Textarea
										aria-label={PERSIAN_TEXTS.translation.translatedText}
										aria-readonly
										className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
										placeholder={PERSIAN_TEXTS.translation.translatedText}
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
						onClick={handleTranslate}
						size="lg"
						type="button"
						variant="outline"
					>
						<span className="text-sm">
							{translatedText
								? PERSIAN_TEXTS.translation.retranslate
								: PERSIAN_TEXTS.translation.translate}
						</span>
						<SendIcon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
