import { ClipboardCheck, ClipboardIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Textarea } from "@/components/ui";

interface TranslationTextAreasProps {
	sourceText: string;
	translatedText: string;
	isTranslating: boolean;
	onSourceTextChange: (value: string) => void;
	onSubmit?: () => void;
	placeholders: {
		enterText: string;
		translatedText: string;
	};
	loadingText: string;
	charCount?: number;
}

export function TranslationTextAreas({
	sourceText,
	translatedText,
	isTranslating,
	onSourceTextChange,
	onSubmit,
	placeholders,
	loadingText,
	charCount,
}: TranslationTextAreasProps) {
	const [hasCopied, setHasCopied] = useState(false);

	useEffect(() => {
		if (!hasCopied) return;
		const t = setTimeout(() => setHasCopied(false), 1500);
		return () => clearTimeout(t);
	}, [hasCopied]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(translatedText);
			setHasCopied(true);
		} catch {
			// Swallow to keep UI responsive
		}
	};
	return (
		<div className="flex h-full w-full flex-col gap-4">
			{/* Input text area */}
			<Card className="flex-2/5 p-4" aria-live="polite">
				<div className="h-full">
					<Textarea
						placeholder={placeholders.enterText}
						value={sourceText}
						onChange={(e) => onSourceTextChange(e.target.value)}
						onKeyDown={(e) => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
								e.preventDefault();
								onSubmit?.();
							}
						}}
						className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
						aria-label={placeholders.enterText}
					/>
					<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
						<span>{charCount ?? sourceText.length}</span>
						<span>{sourceText.trim() ? "⌘/Ctrl+Enter برای ترجمه" : ""}</span>
					</div>
				</div>
			</Card>

			{/* Translated text area */}
			<Card className="flex-2/5 p-4">
				<div className="h-full">
					{isTranslating ? (
						<div className="flex h-full items-center justify-center">
							<div className="text-muted-foreground">{loadingText}...</div>
						</div>
					) : (
						<div className="flex h-full flex-col">
							<div className="mb-2 flex justify-end">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-8 px-2"
									onClick={handleCopy}
									disabled={!translatedText}
									aria-label="کپی ترجمه"
								>
									{hasCopied ? (
										<ClipboardCheck className="h-4 w-4" />
									) : (
										<ClipboardIcon className="h-4 w-4" />
									)}
								</Button>
							</div>
							<Textarea
								placeholder={placeholders.translatedText}
								value={translatedText}
								readOnly
								className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
								aria-readonly
								aria-label={placeholders.translatedText}
							/>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
