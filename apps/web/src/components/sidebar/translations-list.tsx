import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";

// Placeholder until translations backend wired
export function TranslationsList() {
	const translations: Array<{ id: string; sourceText: string }> = [];

	return (
		<>
			{translations.map((t) => (
				<Link
					to="/translation"
					search={{ id: t.id as string } as any}
					key={t.id}
					className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex h-12 items-center justify-between border-b p-4 text-sm"
				>
					{({ isActive }) => (
						<>
							{isActive && (
								<div className="absolute top-0 right-0 h-full w-1 bg-blue-500" />
							)}
							<span className="font-medium">
								{t.sourceText?.slice(0, 30) || "بدون عنوان"}
							</span>
							<div className="flex items-center gap-0">
								<Button
									variant="ghost"
									size="icon"
									className="cursor-pointer hover:text-red-500"
								>
									حذف
								</Button>
							</div>
						</>
					)}
				</Link>
			))}
		</>
	);
}
