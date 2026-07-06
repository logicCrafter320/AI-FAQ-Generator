import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetBot, useUpdateBot } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type EditableFaq = {
  question: string;
  answer: string;
};

export default function EditBot() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: bot, isLoading, isError } = useGetBot(id ?? "");
  const updateBot = useUpdateBot();

  const [faqs, setFaqs] = useState<EditableFaq[]>([]);

  useEffect(() => {
    if (bot) {
      setFaqs(bot.faqs.map((f) => ({ question: f.question, answer: f.answer })));
    }
  }, [bot]);

  const updateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFaqs((prev) => prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)));
  };

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleSave = () => {
    if (!id) return;
    const cleaned = faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question.length > 0 && f.answer.length > 0);

    if (cleaned.length === 0) {
      toast({ title: "Add at least one complete question and answer.", variant: "destructive" });
      return;
    }

    updateBot.mutate(
      { id, data: { faqs: cleaned } },
      {
        onSuccess: () => {
          toast({ title: "FAQs updated!" });
          setLocation(`/bot/${id}`);
        },
        onError: () => {
          toast({ title: "Failed to save changes. Try again.", variant: "destructive" });
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
          href="/dashboard"
          className="font-syne font-bold text-sm text-[#888888] hover:text-[#ff6b35] transition-colors"
          data-testid="link-back-dashboard"
        >
          &larr; Back to My Bots
        </Link>
      </nav>

      <main className="relative z-10 w-full pt-24 pb-16 px-6 md:px-12 max-w-3xl mx-auto">
        {isLoading && (
          <div className="font-syne text-xl text-[#888888] py-16 text-center">Loading bot...</div>
        )}

        {isError && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
            <div className="font-syne font-extrabold text-3xl text-white mb-4">
              Bot not <span className="text-[#ff6b35]">found.</span>
            </div>
            <Link
              href="/dashboard"
              className="bg-[#ff6b35] text-black font-syne font-bold px-8 py-4 rounded-[4px] hover:bg-white transition-colors"
            >
              Back to My Bots &rarr;
            </Link>
          </div>
        )}

        {bot && (
          <>
            <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
              &mdash; EDIT FAQS
            </div>
            <h1 className="mb-2">
              <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">
                Edit your
              </div>
              <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">
                FAQ bot.
              </div>
            </h1>
            <p className="text-sm text-[#888888] leading-[1.6] mb-10">{bot.businessDescription}</p>

            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  data-testid={`edit-faq-${i}`}
                  className="border border-white/10 rounded-[4px] p-6 bg-[#050505] relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="font-syne font-bold text-[11px] text-[#ff6b35] tracking-[0.1em]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <button
                      onClick={() => removeFaq(i)}
                      data-testid={`button-remove-faq-${i}`}
                      className="text-xs text-[#888888] hover:text-[#ff6b35] transition-colors font-fira"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    data-testid={`input-question-${i}`}
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Question"
                    className="w-full bg-transparent border-b border-white/10 text-white font-syne font-bold text-base h-10 mb-4 focus:border-[#ff6b35] focus:outline-none transition-colors"
                  />
                  <textarea
                    data-testid={`textarea-answer-${i}`}
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    placeholder="Answer"
                    rows={3}
                    className="w-full bg-transparent border-b border-white/10 text-[#cccccc] text-sm leading-[1.6] py-2 resize-none focus:border-[#ff6b35] focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addFaq}
              data-testid="button-add-faq"
              className="mt-6 w-full border border-dashed border-white/15 text-[#888888] hover:border-[#ff6b35] hover:text-[#ff6b35] font-syne font-bold text-sm py-4 rounded-[4px] transition-colors"
            >
              + Add Question
            </button>

            <div className="flex items-center gap-4 mt-10">
              <button
                onClick={handleSave}
                disabled={updateBot.isPending}
                data-testid="button-save-faqs"
                className="bg-[#ff6b35] text-black font-syne font-bold px-8 py-4 rounded-[4px] hover:bg-white transition-colors disabled:opacity-50"
              >
                {updateBot.isPending ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href={`/bot/${id}`}
                className="font-syne font-bold text-sm text-[#888888] hover:text-white transition-colors"
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 px-12 flex justify-between items-center relative z-10 bg-transparent">
        <div className="font-syne font-bold text-[#888888]">FAQBOT</div>
        <a href="#" className="font-dm text-[13px] text-[#444444] hover:text-[#ff6b35] transition-colors">
          jothiganesh.netlify.app
        </a>
      </footer>
    </div>
  );
}
