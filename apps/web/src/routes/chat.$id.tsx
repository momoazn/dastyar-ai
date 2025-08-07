import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useParams,
	useRouterState,
} from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { BotIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssistantMessage } from "@/components/assistant-message";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui";
import { UserMessage } from "@/components/user-message";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/chat/$id")({
	component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
	const params = useParams({ from: "/chat/$id" });
	const threadId = params.id;

	const routerState = useRouterState();
	const navigationState = (routerState.location.state ?? {}) as {
		initialPrompt?: string;
		initialModel?: string;
	};

	const [chatModel, setChatModel] = useState(
		navigationState.initialModel || "",
	);
	const [prompt, setPrompt] = useState(navigationState.initialPrompt || "");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { data: modelList } = useQuery(orpc.models.listOllama.queryOptions());
	const availableModels = useMemo(
		() => (modelList ? modelList.map((m) => m.id) : []),
		[modelList],
	);

	const { messages, sendMessage, status, stop } = useChat({
		transport: new DefaultChatTransport({
			api: `${import.meta.env.VITE_SERVER_URL}/ai`,
			body: () => ({ model: chatModel, threadId }),
		}),
	});

	const isStreaming = status === "streaming" || status === "submitted";

	const handleSendMessage = useCallback(() => {
		if (!prompt.trim() || !chatModel) return;
		sendMessage({ text: prompt });
		setPrompt("");
	}, [prompt, chatModel, sendMessage]);

	const stopStreaming = useCallback(() => {
		stop();
	}, [stop]);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	useEffect(() => {
		if (navigationState.initialPrompt && navigationState.initialModel) {
			// Clear the initial state after first render submission
			setTimeout(() => {
				sendMessage({ text: navigationState.initialPrompt! });
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const renderMessages = useMemo(() => {
		if (messages.length > 0) {
			const parsed = messages.map((m) => {
				let text = "";
				let reasoning = "";
				for (const p of m.parts) {
					if (p.type === "text") text += p.text;
					if (p.type === "reasoning") reasoning += p.text;
				}
				return { id: m.id, role: m.role, text, reasoning };
			});

			return (
				<div className="space-y-4">
					{parsed.map((m) =>
						m.role === "user" ? (
							<UserMessage
								key={m.id}
								message={{ role: "user", content: m.text }}
							/>
						) : (
							<AssistantMessage
								key={m.id}
								message={{
									role: "assistant",
									content: m.text,
									reasoning: m.reasoning,
								}}
							/>
						),
					)}
				</div>
			);
		}

		if (isStreaming) {
			return (
				<div className="flex h-32 items-center justify-center">
					<div className="flex items-center gap-3">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<span className="text-sm text-muted-foreground">
							{PERSIAN_TEXTS.general.loading}...
						</span>
					</div>
				</div>
			);
		}

		return (
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
		);
	}, [messages, isStreaming]);

	return (
		<div className="flex h-full flex-col">
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="mx-auto max-w-4xl px-6 py-8 pb-32">
						{renderMessages}
						<div ref={messagesEndRef} />
					</div>
				</ScrollArea>
			</div>

			<div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<ChatInput
					prompt={prompt}
					setPrompt={setPrompt}
					handleSendPrompt={handleSendMessage}
					chatModel={chatModel}
					setChatModel={setChatModel}
					isStreaming={isStreaming}
					stopStreaming={stopStreaming}
					models={availableModels}
				/>
			</div>
		</div>
	);
}
