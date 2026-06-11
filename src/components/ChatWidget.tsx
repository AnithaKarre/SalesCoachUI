import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { askCoach, ApiError } from "@/lib/api";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/**
 * Minimal-but-safe markdown rendering: bold, italic, inline code, code blocks,
 * unordered list, and line breaks. Avoids pulling a heavy markdown package.
 */
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // fenced code
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) =>
    `<pre class="my-2 overflow-x-auto rounded-lg bg-slate-900/90 p-3 text-[12px] leading-relaxed text-emerald-100"><code>${code}</code></pre>`);
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>');
  // bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // bullets
  html = html.replace(/(?:^|\n)([-*]) (.+)/g, "\n<li>$2</li>");
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul class="my-2 list-disc space-y-1 pl-5">$1</ul>');
  // line breaks
  html = html.replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>");
  return html;
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Seed welcome message whenever the widget opens fresh.
  useEffect(() => {
    if (open && messages.length === 0 && user) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        text: `Hi **${user.username}**, I am your **SalesCoach AI**. How can I help you today?\n\nYou can ask me about:\n- Top priority merchants in your area\n- Why a merchant's score changed\n- Best-practice talking points for a visit`,
      }]);
    }
  }, [open, messages.length, user]);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const res = await askCoach(text, { role: user?.role });
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: res.answer || "I'm not sure how to answer that yet." },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `Backend unavailable (${err.status}). Showing a local demo answer instead.`
          : `I couldn't reach the SalesCoach backend right now.`;
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `${message}\n\n_Demo response_: For **${text}**, I'd recommend starting with the top 3 prioritized merchants on your dashboard, focusing on those with the largest transaction declines.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition-all duration-300 hover:scale-110 hover:shadow-glow"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-success text-[9px] font-bold text-success-foreground ring-2 ring-background">
            AI
          </span>
        )}
      </button>

      {open && (
        <div className="slide-up fixed bottom-24 right-4 z-40 flex h-[600px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-primary p-4 text-primary-foreground">
            <div className="bg-mesh pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">SalesCoach AI</div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Online · powered by GCash insights
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 p-4">
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="typing-dot h-2 w-2 rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="border-t border-border bg-card p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
                }}
                placeholder="Ask anything about your merchants…"
                rows={1}
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Enter to send · Shift+Enter for newline
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex slide-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[82%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-2xl rounded-br-sm bg-gradient-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-sm border border-border bg-card text-foreground",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
      />
    </div>
  );
}
