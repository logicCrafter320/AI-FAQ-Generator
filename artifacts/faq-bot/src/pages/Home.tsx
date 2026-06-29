import { useState, useRef, useEffect } from "react";
import { useGenerateFaqs, useChatWithBot } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Check, Copy, RefreshCw, Code, Loader2 } from "lucide-react";
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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  
  const [isCopied, setIsCopied] = useState(false);
  const [isEmbedCopied, setIsEmbedCopied] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

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
            description: err.error || "An error occurred while generating FAQs.",
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

  const embedCode = `<!-- FAQ Bot Widget -->
<div id="faq-bot-widget"></div>
<script>
  window.FAQBotConfig = {
    faqs: ${JSON.stringify(faqs, null, 2)}
  };
</script>
<script src="https://cdn.faqbot.ai/widget.js"></script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setIsEmbedCopied(true);
    toast({ title: "Embed code copied!" });
    setTimeout(() => setIsEmbedCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-white relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8b5cf6]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06b6d4]/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 py-12 md:py-24 max-w-6xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                Build Your <span className="text-gradient">AI FAQ Bot</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-12">
                Describe your business and we'll generate a complete FAQ bot in seconds. No coding required.
              </p>

              <div className="glass-panel rounded-2xl p-6 md:p-8 text-left relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] rounded-2xl opacity-0 group-hover:opacity-20 transition duration-500 blur" />
                <div className="relative">
                  <Textarea
                    data-testid="input-business-description"
                    className="min-h-[200px] bg-black/40 border-white/10 text-white placeholder:text-gray-600 resize-none text-lg p-4 focus-visible:ring-[#8b5cf6]"
                    placeholder="We are a fitness coaching business that helps people lose weight and build healthy habits. We offer 1-on-1 coaching, group programs, and meal planning..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                  />
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      data-testid="button-generate-bot"
                      size="lg"
                      className="bg-gradient-btn text-base px-8 h-14 rounded-xl group/btn"
                      onClick={handleGenerate}
                      disabled={generateFaqs.isPending}
                    >
                      {generateFaqs.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          AI is crafting your FAQs...
                        </>
                      ) : (
                        <>
                          Generate FAQ Bot <span className="ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
            >
              {/* Left Column: FAQs */}
              <div className="flex flex-col h-full max-h-[80vh]">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold">Your FAQ Bot is Ready</h2>
                  <p className="text-gray-400 mt-2">Here are the questions we generated based on your business.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 pb-4 custom-scrollbar">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel p-5 rounded-xl hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(139,92,246,0.15)] transition-all duration-300 group"
                    >
                      <div className="flex gap-4">
                        <span className="text-[#8b5cf6] font-mono font-bold mt-1">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                          <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Button
                    data-testid="button-copy-faqs"
                    variant="outline"
                    className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-12"
                    onClick={handleCopyFaqs}
                  >
                    {isCopied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />}
                    {isCopied ? "Copied!" : "Copy All FAQs"}
                  </Button>
                </div>
              </div>

              {/* Right Column: Live Chat */}
              <div className="flex flex-col h-[600px] lg:h-[80vh]">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold">Test Your Bot</h2>
                    <p className="text-gray-400 mt-2">Try asking a question to see how it responds.</p>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden border-[#8b5cf6]/20 bg-black/60 backdrop-blur-2xl">
                  {/* Chat Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <AnimatePresence initial={false}>
                      {chatMessages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {msg.role === 'bot' && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div
                              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white rounded-tr-sm'
                                  : 'bg-white/10 border border-white/5 text-gray-200 rounded-tl-sm backdrop-blur-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {chatWithBot.isPending && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex gap-3 max-w-[85%] flex-row">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 border border-white/5 text-gray-200 rounded-tl-sm backdrop-blur-md flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/10 bg-black/40">
                    <form onSubmit={handleChat} className="flex gap-3">
                      <Input
                        data-testid="input-chat"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="Ask your FAQ bot..."
                        className="flex-1 bg-white/5 border-white/10 focus-visible:ring-[#8b5cf6] text-white h-12 rounded-xl"
                        disabled={chatWithBot.isPending}
                      />
                      <Button
                        data-testid="button-send-chat"
                        type="submit"
                        size="icon"
                        className="h-12 w-12 rounded-xl bg-gradient-btn shrink-0"
                        disabled={!currentQuestion.trim() || chatWithBot.isPending}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    data-testid="button-get-embed"
                    size="lg"
                    className="bg-gradient-btn px-8 h-12 rounded-xl group"
                    onClick={() => setStep(3)}
                  >
                    Get Embed Code <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#06b6d4]/20 border border-white/10 mb-6">
                  <Code className="w-8 h-8 text-[#06b6d4]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Add Your Bot to Any Website</h1>
                <p className="text-lg text-gray-400">
                  Paste this snippet into your website's HTML, just before the <code className="text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-1 rounded">&lt;/body&gt;</code> tag.
                </p>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden mb-8 border-[#8b5cf6]/30">
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <Button
                    data-testid="button-copy-code"
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={handleCopyEmbed}
                  >
                    {isEmbedCopied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
                    {isEmbedCopied ? "Copied!" : "Copy Code"}
                  </Button>
                </div>
                <div className="p-6 overflow-x-auto bg-[#0a0a0a]">
                  <pre className="text-sm text-gray-300 font-mono">
                    <code>{embedCode}</code>
                  </pre>
                </div>
              </div>

              <div className="flex justify-center mt-12">
                <Button
                  data-testid="button-start-over"
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl"
                  onClick={() => {
                    setStep(1);
                    setBusinessDescription("");
                    setFaqs([]);
                    setChatMessages([]);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Start Over
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.5);
        }
      `}} />
    </div>
  );
}
