import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Sparkles } from "lucide-react";
import { getChatHistory, postChat } from "@/lib/api";
import { ErrorPanel } from "./_app.dashboard";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "AI Sales Coach · SalesCoach AI" }] }),
  component: ChatPage,
});

interface Msg { id: string; role: "user" | "assistant"; text: string }

function ChatPage() {
  const qc = useQueryClient();
  const history = useQuery({
    queryKey: ["chat", "history"],
    queryFn: getChatHistory,
  });

  const [pending, setPending] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: (message: string) => postChat(message),
    onSuccess: (res: any, message) => {
      const answer =
        res?.answer ?? res?.reply ?? res?.message ?? res?.content ?? "";
      setPending((p) => [
        ...p,
        { id: `u-${Date.now()}`, role: "user", text: message },
        { id: `a-${Date.now()}`, role: "assistant", text: String(answer) },
      ]);
      qc.invalidateQueries({ queryKey: ["chat", "history"] });
    },
  });

  const messages: Msg[] = [
    ...((history.data ?? []).map((m: any, i: number): Msg => ({
      id: m.id ?? `h-${i}`,
      role: (m.role === "user" || m.role === "assistant") ? m.role : (m.is_user ? "user" : "assistant"),
      text: m.text ?? m.message ?? m.content ?? "",
    }))),
    ...pending,
  ];

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, send.isPending]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    send.mutate(text);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
      <div className="relative overflow-hidden bg-gradient-primary p-5 text-primary-foreground">
        <div className="bg-mesh pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Sales Coach</h1>
            <p className="text-xs text-white/85">Personalized guidance powered by SalesCoach AI</p>
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 p-5">
        {history.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        ) : history.isError ? (
          <ErrorPanel message={(history.error as Error)?.message} />
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Start the conversation — ask anything about your merchants.
          </p>
        ) : (
          messages.map((m) => <Bubble key={m.id} role={m.role} text={m.text} />)
        )}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e as any); }}
            placeholder="Ask your AI coach…"
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
          <button
            type="submit" disabled={!input.trim() || send.isPending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`slide-up flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={[
        "max-w-[82%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm",
        isUser
          ? "rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground"
          : "rounded-2xl rounded-bl-sm border border-border bg-card text-foreground",
      ].join(" ")}>{text}</div>
    </div>
  );
}
