import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/ai")({
	component: RouteComponent,
});

function RouteComponent() {
	const [selectedModel, setSelectedModel] = useState<string | undefined>(
		undefined,
	);
	const { data: models } = useQuery({
		queryKey: ["models.listOllama"],
		queryFn: () => client.models.listOllama(),
	});

	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			api: `${import.meta.env.VITE_SERVER_URL}/ai`,
			body: () => ({ model: selectedModel }),
		}),
	});
	const [input, setInput] = useState("");

	const messagesEndRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: .
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		sendMessage({ text: input });
		setInput("");
	};

	return (
		<div className="mx-auto grid w-full grid-rows-[1fr_auto] overflow-hidden p-4">
			<div className="space-y-4 overflow-y-auto pb-4">
				<div className="flex items-center gap-2">
					<Select value={selectedModel} onValueChange={setSelectedModel}>
						<SelectTrigger className="min-w-[220px]">
							<SelectValue placeholder="Select a model" />
						</SelectTrigger>
						<SelectContent>
							{models?.map((m: { id: string; displayName: string }) => (
								<SelectItem key={m.id} value={m.id}>
									{m.displayName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{messages.length === 0 ? (
					<div className="mt-8 text-center text-muted-foreground">
						Ask me anything to get started!
					</div>
				) : (
					messages.map((message) => (
						<div
							className={`rounded-lg p-3 ${
								message.role === "user"
									? "ml-8 bg-primary/10"
									: "mr-8 bg-secondary/20"
							}`}
							key={message.id}
						>
							<p className="mb-1 font-semibold text-sm">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							<div className="whitespace-pre-wrap">
								{message.parts.map((part) =>
									part.type === "text" ? (
										<span key={part.text}>{part.text}</span>
									) : null,
								)}
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<form
				className="flex w-full items-center space-x-2 border-t pt-2"
				onSubmit={handleSubmit}
			>
				<Input
					autoComplete="off"
					autoFocus
					className="flex-1"
					disabled={status !== "ready"}
					name="prompt"
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					value={input}
				/>
				<Button disabled={status !== "ready"} size="icon" type="submit">
					<Send size={18} />
				</Button>
			</form>
		</div>
	);
}
