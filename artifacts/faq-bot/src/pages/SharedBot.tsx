import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetBot, useChatWithBot } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

export default function SharedBot() {
  const { id } = useParams<{ id: string }>();
  const { data: bot, isLoading, isError } = useGetBot(id ?? "");
  const chatWithBot = useChatWithBot();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bot) {
      setChatMessages([
        { role: "bot", content: "Hi! I'm your FAQ bot. Ask me anything about this business!" },
      ]);
    }
  }, [bot]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !bot) return;

    const userMsg = currentQuestion.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setCurrentQuestion("");

    chatWithBot.mutate(
      {
        data: {
          question: userMsg,
          faqs: bot.faqs,
          businessDescription: bot.businessDescription,
          botId: bot.id,
        },
      },
      {
        onSuccess: (result) => {
          setChatMessages((prev) => [...prev, { role: "bot", content: result.answer }]);
        },
        onError: () => {
          setChatMessages((prev) => [
            ...prev,
            { role: "bot", content: "Sorry, I had trouble answering that. Try again?" },
          ]);
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#000000] text-white relative font-dm">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute bg-blob-1 -top-[20%] -left-[10%] w-[600px] h-[600px] blur-[150px] opacity-8" />
        <div className="absolute bg-blob-2 top-[60%] -right-[10%] w-[500px] h-[500px] blur-[150px] opacity-6" />
        <div className="absolute inset-0 grid-overlay" />
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-black/90 backdrop-blur-sm border-b border-white/5">
        <Link href="/" className="font-syne font-extrabold text-lg text-white tracking-[-0.02em]">
          FAQBOT
        </Link>
        <Link
          href="/"
          className="bg-[#ff6b35] text-black font-syne font-bold px-6 py-2.5 rounded-[4px] hover:bg-white transition-colors duration-200"
          data-testid="link-create-your-own"
        >
          Create Your Own &rarr;
        </Link>
      </nav>

      <main className="relative z-10 w-full pt-24 pb-16">
        {isLoading && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
            <div className="font-syne text-2xl text-[#888888]">Loading bot...</div>
          </div>
        )}

        {isError && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
            <div className="font-syne font-extrabold text-4xl text-white mb-4">
              Bot not <span className="text-[#ff6b35]">found.</span>
            </div>
            <p className="text-[#888888] mb-8">This FAQ bot doesn't exist or may have been removed.</p>
            <Link
              href="/"
              className="bg-[#ff6b35] text-black font-syne font-bold px-8 py-4 rounded-[4px] hover:bg-white transition-colors"
              data-testid="link-home-error"
            >
              Create Your Own FAQ Bot &rarr;
            </Link>
          </div>
        )}

        {bot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col lg:flex-row"
          >
            {/* LEFT COLUMN - FAQs */}
            <div className="w-full lg:w-1/2 bg-[#000000] lg:border-r border-white/5 p-8 lg:px-20 lg:pb-20 lg:pt-8">
              <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                &mdash; FREQUENTLY ASKED QUESTIONS
              </div>
              <h1 className="mb-6">
                <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">10 Questions</div>
                <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">Answered.</div>
              </h1>
              <p className="text-sm text-[#888888] leading-[1.6] mb-10">{bot.businessDescription}</p>

              <div className="max-h-[60vh] overflow-y-auto pr-4">
                {bot.faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="border-b border-white/5 py-6 group"
                  >
                    <div className="font-syne font-bold text-[11px] text-[#ff6b35] tracking-[0.1em]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-syne font-bold text-base text-white mt-2 group-hover:text-[#ff6b35] transition-colors duration-200">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-[#888888] leading-[1.6] mt-2">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN - Chat */}
            <div className="w-full lg:w-1/2 bg-[#050505] p-8 lg:p-20 lg:sticky lg:top-16 h-auto lg:h-[calc(100dvh-4rem)] flex flex-col">
              <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                &mdash; TEST THIS BOT
              </div>
              <h2 className="mb-8">
                <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">Chat with</div>
                <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">this FAQ bot.</div>
              </h2>

              <div className="flex-1 h-[420px] overflow-y-auto mb-0 pr-4 space-y-4">
                <AnimatePresence initial={false}>
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`text-sm p-3 px-4 max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-[#ff6b35] text-[#000000] rounded-[4px_4px_0_4px]"
                            : "bg-[#1a1a1a] text-white border border-white/5 rounded-[4px_4px_4px_0]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {chatWithBot.isPending && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#1a1a1a] border border-white/5 rounded-[4px_4px_4px_0] p-3 px-4 flex space-x-1 items-center">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-1.5 h-1.5 bg-[#888888] rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-[#888888] rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-[#888888] rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <form onSubmit={handleChat} className="flex space-x-4">
                  <input
                    data-testid="input-chat-shared"
                    type="text"
                    className="flex-1 bg-[#0d0d0d] border-b border-white/10 text-white font-dm h-12 px-4 focus:border-[#ff6b35] focus:outline-none transition-colors"
                    placeholder="Ask this FAQ bot..."
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    disabled={chatWithBot.isPending}
                  />
                  <button
                    data-testid="button-send-chat-shared"
                    type="submit"
                    disabled={!currentQuestion.trim() || chatWithBot.isPending}
                    className="bg-[#ff6b35] text-black font-syne font-bold h-12 px-5 rounded-[4px] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 px-12 flex justify-between items-center relative z-10 bg-transparent">
        <div className="font-syne font-bold text-[#888888]">FAQBOT</div>
        <Link href="/" className="font-dm text-[13px] text-[#444444] hover:text-[#ff6b35] transition-colors">
          Create your own bot &rarr;
        </Link>
      </footer>
    </div>
  );
}
