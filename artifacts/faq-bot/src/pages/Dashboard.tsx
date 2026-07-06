import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListBots, getListBotsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getSavedBotIds, removeSavedBotId } from "@/lib/savedBots";

export default function Dashboard() {
  const [ids, setIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIds(getSavedBotIds());
  }, []);

  const listParams = { ids: ids.join(",") };
  const { data, isLoading, isError } = useListBots(listParams, {
    query: { enabled: ids.length > 0, queryKey: getListBotsQueryKey(listParams) },
  });

  const bots = data?.bots ?? [];

  const handleRemove = (id: string) => {
    removeSavedBotId(id);
    setIds((prev) => prev.filter((existingId) => existingId !== id));
    toast({ title: "Removed from My Bots" });
  };

  const handleCopy = (id: string) => {
    const url = `${window.location.origin}/bot/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Share link copied!" });
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
          data-testid="link-create-new-bot"
        >
          Create New Bot &rarr;
        </Link>
      </nav>

      <main className="relative z-10 w-full pt-24 pb-16 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="text-[#ff6b35] text-[11px] font-medium tracking-[0.2em] mb-4">
          &mdash; MY BOTS
        </div>
        <h1 className="mb-10">
          <div className="font-syne font-extrabold text-[2.5rem] text-white leading-tight">
            Your saved
          </div>
          <div className="font-syne font-extrabold text-[2.5rem] text-[#ff6b35] leading-tight">
            FAQ bots.
          </div>
        </h1>

        {ids.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[#888888] mb-8">
              You haven't saved any FAQ bots on this device yet.
            </p>
            <Link
              href="/"
              className="bg-[#ff6b35] text-black font-syne font-bold px-8 py-4 rounded-[4px] hover:bg-white transition-colors inline-block"
              data-testid="link-create-first-bot"
            >
              Create Your First Bot &rarr;
            </Link>
          </div>
        )}

        {ids.length > 0 && isLoading && (
          <div className="font-syne text-xl text-[#888888] py-16 text-center">Loading your bots...</div>
        )}

        {ids.length > 0 && isError && (
          <div className="font-syne text-xl text-[#888888] py-16 text-center">
            Failed to load your bots. Try again later.
          </div>
        )}

        {ids.length > 0 && !isLoading && !isError && bots.length === 0 && (
          <div className="text-center py-24">
            <p className="text-[#888888]">No saved bots were found. They may have been removed.</p>
          </div>
        )}

        <div className="space-y-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              data-testid={`card-bot-${bot.id}`}
              className="border border-white/10 rounded-[4px] p-6 bg-[#050505] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-white leading-[1.5] truncate">{bot.businessDescription}</p>
                <p className="text-xs text-[#888888] mt-1 font-fira">
                  {bot.faqs.length} FAQs &middot; saved {new Date(bot.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-[#ff6b35] mt-2 font-fira">
                  {bot.viewCount} {bot.viewCount === 1 ? "view" : "views"} &middot; {bot.chatCount}{" "}
                  {bot.chatCount === 1 ? "question" : "questions"} asked
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/bot/${bot.id}`}
                  data-testid={`link-view-bot-${bot.id}`}
                  className="font-syne font-bold text-sm text-[#ff6b35] hover:text-white transition-colors"
                >
                  View &rarr;
                </Link>
                <Link
                  href={`/bot/${bot.id}/edit`}
                  data-testid={`link-edit-bot-${bot.id}`}
                  className="bg-white/5 hover:bg-white/10 text-white font-syne font-bold text-sm px-4 py-2 rounded-[4px] transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleCopy(bot.id)}
                  data-testid={`button-copy-bot-${bot.id}`}
                  className="bg-white/5 hover:bg-white/10 text-white font-syne font-bold text-sm px-4 py-2 rounded-[4px] transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => handleRemove(bot.id)}
                  data-testid={`button-remove-bot-${bot.id}`}
                  className="bg-transparent border border-white/15 text-[#888888] hover:border-[#ff6b35] hover:text-[#ff6b35] font-syne font-bold text-sm px-4 py-2 rounded-[4px] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
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
