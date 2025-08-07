import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { BotIcon, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInput } from "@/components/chat-input";
import { ScrollArea } from "@/components/ui";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/chat")({
	component: ChatRouteComponent,
});

function ChatRouteComponent() {
	const [chatModel, setChatModel] = useState("");
	const [prompt, setPrompt] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { data: modelList } = useQuery(orpc.models.listOllama.queryOptions());
	const availableModels = useMemo(
		() => (modelList ? modelList.map((m) => m.id) : []),
		[modelList],
	);

	const { messages, sendMessage, status, stop } = useChat({
		transport: new DefaultChatTransport({
			api: `${import.meta.env.VITE_SERVER_URL}/ai`,
			body: () => ({ model: chatModel }),
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

	const renderMessages = useMemo(() => {
		if (messages.length > 0) {
			return (
				<div className="space-y-4">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`rounded-lg p-3 ${
								message.role === "user"
									? "ml-8 bg-primary/10"
									: "mr-8 bg-secondary/20"
							}`}
						>
							<p className="mb-1 text-sm font-semibold">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							<div className="whitespace-pre-wrap">
								{message.parts.map((part, idx) => {
									if (part.type === "text") {
										return (
											<span key={`${message.id}-text-${idx}`}>{part.text}</span>
										);
									}
									if (part.type === "reasoning") {
										return (
											<pre
												key={`${message.id}-reason-${idx}`}
												className="mt-2 rounded bg-muted p-2 text-xs"
											>
												{part.text}
											</pre>
										);
									}
									return null;
								})}
							</div>
						</div>
					))}
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
