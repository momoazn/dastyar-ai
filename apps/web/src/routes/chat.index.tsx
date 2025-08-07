import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BotIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { client, orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/chat/")({
	component: ChatIndexRouteComponent,
});

function ChatIndexRouteComponent() {
	const navigate = useNavigate();
	const [chatModel, setChatModel] = useState("");
	const [prompt, setPrompt] = useState("");

	const { data: modelList } = useQuery(orpc.models.listOllama.queryOptions());
	const availableModels = useMemo(
		() => (modelList ? modelList.map((m) => m.id) : []),
		[modelList],
	);

	const handleSendFirstMessage = useCallback(async () => {
		const trimmed = prompt.trim();
		if (!trimmed || !chatModel) return;
		const created = await client.threads.create({ title: undefined });
		await queryClient.invalidateQueries({
			queryKey: orpc.threads.list.queryKey(),
		});
		navigate({
			to: "/chat/$id",
			params: { id: created.id },
			state: { initialPrompt: trimmed, initialModel: chatModel },
		});
		setPrompt("");
	}, [prompt, chatModel, navigate]);

	return (
		<div className="flex h-full flex-col">
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="mx-auto max-w-4xl px-6 py-8 pb-32">
						<div className="flex h-64 items-center justify-center">
							<div className="text-center">
								<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted p-4">
									<BotIcon className="h-full w-full text-muted-foreground" />
								</div>
								<h3 className="mb-2 text-lg font-semibold text-foreground">
									{PERSIAN_TEXTS.chat.askQuestion}
								</h3>
								<p className="text-sm text-muted-foreground">
									{PERSIAN_TEXTS.chat.askQuestionDescription}
								</p>
							</div>
						</div>
					</div>
				</ScrollArea>
			</div>

			<div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<ChatInput
					prompt={prompt}
					setPrompt={setPrompt}
					handleSendPrompt={handleSendFirstMessage}
					chatModel={chatModel}
					setChatModel={setChatModel}
					isStreaming={false}
					stopStreaming={() => {}}
					models={availableModels}
				/>
			</div>
		</div>
	);
}
