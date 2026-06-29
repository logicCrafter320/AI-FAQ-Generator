import { Router, type IRouter } from "express";
import { GenerateFaqsBody, ChatWithBotBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, body: errorText }, "Groq API error");
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "";
}

router.post("/faq/generate", async (req, res): Promise<void> => {
  const parsed = GenerateFaqsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessDescription } = parsed.data;

  const prompt = `You are a helpful FAQ bot for this business: ${businessDescription}.

Generate exactly 10 frequently asked questions with clear, helpful answers.
Format your response as a valid JSON array only, with no additional text before or after:
[{"question": "...", "answer": "..."}, ...]

Make the questions realistic and the answers detailed and helpful.`;

  try {
    const content = await callGroq([{ role: "user", content: prompt }]);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      req.log.error({ content }, "Failed to extract JSON from Groq response");
      res.status(500).json({ error: "AI returned an invalid response format" });
      return;
    }

    const faqs = JSON.parse(jsonMatch[0]) as Array<{ question: string; answer: string }>;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      res.status(500).json({ error: "AI returned an empty FAQ list" });
      return;
    }

    res.json({ faqs: faqs.slice(0, 10) });
  } catch (err) {
    req.log.error({ err }, "FAQ generation failed");
    res.status(500).json({ error: "Failed to generate FAQs. Please try again." });
  }
});

router.post("/faq/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithBotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, faqs, businessDescription } = parsed.data;

  const faqContext = faqs
    .map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful FAQ bot${businessDescription ? ` for: ${businessDescription}` : ""}.

Here are the FAQs you know about:

${faqContext}

Answer the user's question based on the FAQ content above. If the question matches or is related to an FAQ, provide the answer. If it doesn't match any FAQ, politely say you can only answer questions related to the business FAQs and suggest they contact the business directly for other inquiries. Keep answers concise and helpful.`;

  try {
    const answer = await callGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ]);

    res.json({ answer: answer.trim() });
  } catch (err) {
    req.log.error({ err }, "Chat request failed");
    res.status(500).json({ error: "Failed to get a response. Please try again." });
  }
});

export default router;
