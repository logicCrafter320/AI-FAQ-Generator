import { useState, useRef, useEffect } from "react";
import { useGenerateFaqs, useChatWithBot, useCreateBot } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { FaqItem } from "@workspace/api-client-react";

type ChatMessage = {
  role: "user" | "bot";
  content: string;
};

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessDescription, setBusinessDescription] = useState("");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const { toast } = useToast();

  const generateFaqs = useGenerateFaqs();
  const chatWithBot = useChatWithBot();
  const createBot = useCreateBot();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  
  const [isCopied, setIsCopied] = useState(false);
  const [isEmbedCopied, setIsEmbedCopied] = useState(false);
  
  const [loadingCount, setLoadingCount] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generateFaqs.isPending) {
      setLoadingCount(1);
      interval = setInterval(() => {
        setLoadingCount(prev => (prev < 10 ? prev + 1 : 10));
      }, 250);
    }
    return () => clearInterval(interval);
  }, [generateFaqs.isPending]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGenerate = () => {
    if (!businessDescription || businessDescription.length < 10) {
      toast({
        title: "Input too short",
        description: "Please provide a more detailed business description (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    generateFaqs.mutate(
      { data: { businessDescription } },
      {
        onSuccess: (result) => {
          setFaqs(result.faqs);
          setChatMessages([
            { role: "bot", content: "Hi! I'm your FAQ bot. Ask me anything about your business!" }
          ]);
          setStep(2);
        },
        onError: (err) => {
          toast({
            title: "Generation failed",
            description: err.data?.error || "An error occurred while generating FAQs.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim()) return;

    const userMsg = currentQuestion.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setCurrentQuestion("");

    chatWithBot.mutate(
      {
        data: {
          question: userMsg,
          faqs: faqs,
          businessDescription,
        }
      },
      {
        onSuccess: (result) => {
          setChatMessages((prev) => [...prev, { role: "bot", content: result.answer }]);
        },
        onError: () => {
          setChatMessages((prev) => [...prev, { role: "bot", content: "Sorry, I had trouble answering that. Try again?" }]);
        }
      }
    );
  };

  const handleCopyFaqs = () => {
    const text = faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const embedCode = `<!-- FAQ Bot Widget -->\n<div id="faq-bot-widget"></div>\n<script>\n  window.FAQBotConfig = {\n    faqs: ${JSON.stringify(faqs, null, 2)}\n  };\n</script>\n<script src="https://cdn.faqbot.ai/widget.js"></script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setIsEmbedCopied(true);
    toast({ title: "Embed code copied!" });
    setTimeout(() => setIsEmbedCopied(false), 2000);
  };

  const handleSaveAndShare = () => {
    createBot.mutate(
      { data: { businessDescription, faqs } },
      {
        onSuccess: (result) => {
          const url = `${window.location.origin}/bot/${result.id}`;
          setShareUrl(url);
        },
        onError: (err) => {
          toast({
            title: "Failed to create share link",
            description: err.data?.error || "An error occurred while saving your bot.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCopyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setIsShareCopied(true);
    toast({ title: "Share link copied!" });
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  const scrollToInput = () => {
    const input = document.getElementById("business-input");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => input.focus(), 500);
    }
  };

  const formatCodeBlock = (code: string) => {
    return code.split(/(<[^>]+>)/g).map((part, i) => {
      if (part.startsWith("<") && part.endsWith(">")) {
        return <span key={i} style={{ color: "#ff6b35" }}>{part}</span>;
      }
      return <span key={i} style={{ color: "#fff" }}>{part}</span>;
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#000000] text-white relative font-dm">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute bg-blob-1 -top-[20%] -left-[10%] w-[600px] h-[600px] blur-[150px] opacity-8" />
        <div className="absolute bg-blob-2 top-[60%] -right-[10%] w-[500px] h-[500px] blur-[150px] opacity-6" />
        <div className="absolute bg-blob-3 top-[40%] left-[40%] w-[400px] h-[400px] blur-[150px] opacity-4" />
        <div className="absolute inset-0 grid-overlay" />
      </div>

      {/* NAVBAR */}
      <nav 
        className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300 ${
          scrolled ? "bg-black/90 backdrop-blur-sm border-b border-white/5" : "bg-transparent"
        }`}
      >
        <div className="font-syne font-extrabold text-lg text-white tracking-[-0.02em]">FAQBOT</div>
        <button 
          onClick={scrollToInput}
          className="bg-[#ff6b35] text-black font-syne font-bold px-6 py-2.5 rounded-[4px] hover:bg-white transition-colors duration-200"
        >
          Generate Free &rarr;
        </button>
      </nav>

      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {generateFaqs.isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-1 bg-[#ff6b35]"
            />
            <div className="text-center">
              <div className="font-syne text-[8rem] font-bold text-[#ff6b35] leading-none mb-4">
                {loadingCount}
              </div>
              <div className="text-white text-lg mb-2">Generating your FAQ bot...</div>
              <div className="text-[#888888] text-sm">Analyzing your business...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="min-h-screen flex flex-col justify-center items-center max-w-5xl mx-auto px-6 pt-24 pb-12"
            >
              <div className="inline-flex items-center text-[#ff6b35] text-[13px] border border-[#ff6b35]/40 rounded-full px-4 py-1.5 mb-10">
                ✦ Powered by Groq AI &middot; Free to use
              </div>
              
              <h1 className="text-center mb-8">
                <div className="font-syne font-extrabold text-[clamp(3.5rem,10vw,8rem)] text-white tracking-[-0.04em] leading-[0.95]">
                  Your Business.
                </div>
                <div className="font-syne font-extrabold text-[clamp(3.5rem,10vw,8rem)] text-[#ff6b35] tracking-[-0.04em] leading-[0.95]">
                  Answered.
                </div>
              </h1>

              <p className="text-center text-lg text-[#888888] max-w-xl mx-auto mb-6">
                Paste your business info. Get 10 AI-generated FAQs in seconds. Embed on any website. Free.
              </p>

              <div className="flex items-center justify-center gap-12 mb-12">
                <div className="flex flex-col items-center">
                  <span className="font-syne font-bold text-lg text-white">10 FAQs</span>
                  <span className="text-[13px] text-[#888888]"></span>
                </div>
                <div className="w-[1px] h-6 bg-white/15" />
                <div className="flex flex-col items-center">
                  <span className="font-syne font-bold text-lg text-white">&lt; 30 seconds</span>
                  <span className="text-[13px] text-[#888888]"></span>
                </div>
                <div className="w-[1px] h-6 bg-white/15" />
                <div className="flex flex-col items-center">
                  <span className="font-syne font-bold text-lg text-white">Free forever</span>
                  <span className="text-[13px] text-[#888888]"></span>
                </div>
              </div>

              <div className="w-full max-w-2xl mx-auto">
                <textarea
                  id="business-input"
                  data-testid="input-business-description"
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-[4px] font-fira text-sm text-white placeholder-[#444444] min-h-[160px] p-5 focus:border-[#ff6b35] focus:outline-none focus:ring-1 focus:ring-[#ff6b35] transition-colors duration-200 resize-y"
                  placeholder="We are a fitness coaching business that helps people lose weight and build healthy habits..."
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                />
                <button
                  data-testid="button-generate-bot"
                  onClick={handleGenerate}
                  disabled={generateFaqs.isPending}
                  className="w-full mt-4 bg-[#ff6b35] text-black font-syne font-bold text-base py-4 px-10 rounded-[4px] hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate FAQ Bot &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col lg:flex-row min-h-[100dvh]"
            >
              {/* LEFT COLUMN - FAQs */}
              <div className="w-full lg:w-1/2 bg-[#000000] lg:border-r border-white/5 p-8 lg:p-20 pt-24 lg:pt-24">
                <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                  &mdash; YOUR FAQS
                </div>
                <h2 className="mb-12">
                  <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">10 Questions</div>
                  <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">Answered.</div>
                </h2>
                
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                  {faqs.map((faq, i) => (
                    <motion.div 
                      key={i}
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      className="border-b border-white/5 py-6 group"
                    >
                      <div className="font-syne font-bold text-[11px] text-[#ff6b35] tracking-[0.1em]">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <h3 className="font-syne font-bold text-base text-white mt-2 group-hover:text-[#ff6b35] transition-colors duration-200">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-[#888888] leading-[1.6] mt-2">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>
                
                <button
                  data-testid="button-copy-faqs"
                  onClick={handleCopyFaqs}
                  className="mt-8 bg-transparent border border-white/20 text-white font-dm px-6 py-3 rounded-[4px] hover:bg-[#ff6b35] hover:text-black hover:border-[#ff6b35] transition-all duration-200"
                >
                  {isCopied ? "Copied!" : "Copy All FAQs"}
                </button>
              </div>

              {/* RIGHT COLUMN - Chat */}
              <div className="w-full lg:w-1/2 bg-[#050505] p-8 lg:p-20 pt-12 lg:pt-24 lg:sticky lg:top-0 h-auto lg:h-[100dvh] flex flex-col">
                <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                  &mdash; TEST YOUR BOT
                </div>
                <h2 className="mb-8">
                  <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">Chat with</div>
                  <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">your FAQ bot.</div>
                </h2>
                
                <div className="flex-1 h-[420px] overflow-y-auto mb-0 pr-4 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`text-sm p-3 px-4 max-w-[80%] ${
                          msg.role === 'user' 
                            ? 'bg-[#ff6b35] text-[#000000] rounded-[4px_4px_0_4px]' 
                            : 'bg-[#1a1a1a] text-white border border-white/5 rounded-[4px_4px_4px_0]'
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
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-[#888888] rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#888888] rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#888888] rounded-full" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                  <form onSubmit={handleChat} className="flex space-x-4">
                    <input
                      data-testid="input-chat"
                      type="text"
                      className="flex-1 bg-[#0d0d0d] border-b border-white/10 text-white font-dm h-12 px-4 focus:border-[#ff6b35] focus:outline-none transition-colors"
                      placeholder="Ask your FAQ bot..."
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      disabled={chatWithBot.isPending}
                    />
                    <button
                      data-testid="button-send-chat"
                      type="submit"
                      disabled={!currentQuestion.trim() || chatWithBot.isPending}
                      className="bg-[#ff6b35] text-black font-syne font-bold h-12 px-5 rounded-[4px] hover:bg-white transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>

                <button
                  data-testid="button-get-embed"
                  onClick={() => setStep(3)}
                  className="mt-8 w-full bg-transparent border border-[#ff6b35] text-[#ff6b35] font-syne font-bold py-4 rounded-[4px] hover:bg-[#ff6b35] hover:text-black transition-colors"
                >
                  Get Embed Code &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto px-6 py-24 min-h-[100dvh]"
            >
              <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                &mdash; EMBED CODE
              </div>
              <h2 className="mb-12">
                <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">Add to your website</div>
                <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">in 60 seconds.</div>
              </h2>
              
              <div className="bg-[#000000] border border-[#ff6b35]/25 rounded-[4px] overflow-hidden">
                <div className="bg-[#0d0d0d] border-b border-white/5 py-3 px-4 flex justify-between items-center">
                  <span className="font-fira text-[12px] text-[#888888]">HTML</span>
                  <button 
                    data-testid="button-copy-code"
                    onClick={handleCopyEmbed}
                    className="bg-[#ff6b35] text-black font-syne font-bold text-[12px] px-3 py-1.5 rounded-[2px] hover:bg-white transition-colors"
                  >
                    {isEmbedCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="font-fira text-[13px] leading-[1.7] whitespace-pre-wrap">
                    {formatCodeBlock(embedCode)}
                  </pre>
                </div>
              </div>
              
              <div className="mt-10 font-syne text-base text-[#888888] space-y-2">
                <div><span className="text-[#ff6b35]">01 &rarr;</span> Copy the code</div>
                <div><span className="text-[#ff6b35]">02 &rarr;</span> Open your website HTML</div>
                <div><span className="text-[#ff6b35]">03 &rarr;</span> Paste before &lt;/body&gt;</div>
              </div>

              <div className="mt-16 pt-10 border-t border-white/5">
                <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
                  &mdash; SHARE
                </div>
                <h2 className="mb-6">
                  <div className="font-syne font-extrabold text-[2rem] text-white leading-tight">Share your bot</div>
                  <div className="font-syne font-extrabold text-[2rem] text-[#ff6b35] leading-tight">with a link.</div>
                </h2>

                {!shareUrl ? (
                  <button
                    data-testid="button-save-share"
                    onClick={handleSaveAndShare}
                    disabled={createBot.isPending}
                    className="bg-[#ff6b35] text-black font-syne font-bold text-base py-4 px-10 rounded-[4px] hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createBot.isPending ? "Saving..." : "Save & Get Share Link \u2192"}
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      data-testid="input-share-url"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-[4px] font-fira text-sm text-white h-12 px-4 focus:outline-none"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      data-testid="button-copy-share-url"
                      onClick={handleCopyShareUrl}
                      className="bg-[#ff6b35] text-black font-syne font-bold h-12 px-6 rounded-[4px] hover:bg-white transition-colors shrink-0"
                    >
                      {isShareCopied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                )}
              </div>

              <button
                data-testid="button-start-over"
                onClick={() => {
                  setStep(1);
                  setBusinessDescription("");
                  setFaqs([]);
                  setChatMessages([]);
                  setShareUrl(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-12 bg-transparent border border-white/15 text-[#888888] font-dm px-8 py-3 rounded-[4px] hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors"
              >
                Start Over
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 px-12 flex justify-between items-center relative z-10 bg-transparent">
        <div className="font-syne font-bold text-[#888888]">FAQBOT</div>
        <a href="#" className="font-dm text-[13px] text-[#444444] hover:text-[#ff6b35] transition-colors">
          jothiganesh.netlify.app
        </a>
      </footer>
    </div>
  );
}
