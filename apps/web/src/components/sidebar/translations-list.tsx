import { useNavigate } from "@tanstack/react-router";
import { SidebarItem } from "./sidebar-item";

// Placeholder until translations backend wired
export function TranslationsList() {
	const navigate = useNavigate();
	const translations: Array<{ id: string; sourceText: string }> = [];

	return (
		<>
			{translations.map((t) => (
				<SidebarItem
					to={`/translation?id=${t.id}`}
					key={t.id}
					title={t.sourceText?.slice(0, 30) || "بدون عنوان"}
					onDelete={(e) => {
						e.stopPropagation();
						navigate({ to: "/translation" });
					}}
				/>
			))}
		</>
	);
}
