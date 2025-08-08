import { ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Selector } from "./selector";
import { type LanguageCode, languages, type ToneOption, tones } from "./types";

interface TranslationControlsProps {
	sourceLang: LanguageCode;
	targetLang: LanguageCode;
	tone: ToneOption;
	model: string;
	onSourceLangChange: (value: string) => void;
	onTargetLangChange: (value: string) => void;
	onToneChange: (value: string) => void;
	onModelChange: (value: string) => void;
	models: Array<{ model: string; name?: string }>;
	onSwapLanguages?: () => void;
	disabled?: boolean;
}

export function TranslationControls({
	sourceLang,
	targetLang,
	tone,
	model,
	onSourceLangChange,
	onTargetLangChange,
	onToneChange,
	onModelChange,
	models,
	onSwapLanguages,
	disabled,
}: TranslationControlsProps) {
	const modelOptions = models.map((m) => ({
		value: m.model,
		label: m.name || m.model,
	}));

	return (
		<div className="bg-background p-4">
			<div className="w-full">
				<div className="grid grid-cols-4 gap-4">
					<Selector
						label={PERSIAN_TEXTS.translation.sourceLanguage}
						value={sourceLang}
						onChange={onSourceLangChange}
						options={languages}
						disabled={disabled}
					/>

					<Selector
						label={PERSIAN_TEXTS.translation.targetLanguage}
						value={targetLang}
						onChange={onTargetLangChange}
						options={languages}
						disabled={disabled}
					/>

					<Selector
						label={PERSIAN_TEXTS.translation.translationTone}
						value={tone}
						onChange={onToneChange}
						options={tones}
						disabled={disabled}
					/>

					<Selector
						label={PERSIAN_TEXTS.translation.model}
						value={model}
						onChange={onModelChange}
						options={modelOptions}
						disabled={disabled}
					/>
				</div>
				{onSwapLanguages && (
					<div className="mt-3 flex justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={onSwapLanguages}
							disabled={disabled}
						>
							<ArrowLeftRightIcon className="mr-2 h-4 w-4" />
							{PERSIAN_TEXTS.translation.sourceLanguage} ↔{" "}
							{PERSIAN_TEXTS.translation.targetLanguage}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
