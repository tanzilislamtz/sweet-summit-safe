import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  /** -1 when the learner skipped the question, -2 when simply browsing */
  userIndex: z.number().int(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  /** Language the explanation must be written in. Bangla by default. */
  language: z.string().default("Bangla (বাংলা)"),
});

export const explainAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const correct = data.options[data.correctIndex] ?? "";
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return {
        explanation: `সঠিক উত্তর: ${correct}. (AI ব্যাখ্যা এই মুহূর্তে পাওয়া যাচ্ছে না।)`,
        language: data.language,
      };
    }

    const answered = data.userIndex >= 0;
    const chosen = answered ? (data.options[data.userIndex] ?? "") : null;
    const isCorrect = answered && data.userIndex === data.correctIndex;

    // The prompt covers all three cases — right answer, wrong answer, skipped —
    // so every question gets an explanation, not just the wrong ones.
    const situation = !answered
      ? "The student did not answer this question."
      : isCorrect
        ? `The student answered correctly with: ${chosen}`
        : `The student answered incorrectly with: ${chosen}`;

    const prompt = `You are a friendly SSC-level tutor for Bangladeshi students.
${situation}

Write the whole explanation in ${data.language}. Use 3-5 short sentences covering:
1) what the correct answer is and why it is right,
2) ${isCorrect ? "one deeper insight or common trap for this topic" : "why the student's choice (or leaving it blank) is wrong"},
3) a short tip to remember it.
Plain sentences only — no markdown headings, no bullet symbols, no bold markers.

Subject: ${data.subject ?? "general"}
Topic: ${data.topic ?? "general"}
Question: ${data.question}
Options: ${data.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}
Correct answer: ${correct}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          reasoning_effort: "none",
          messages: [
            {
              role: "system",
              content: `You are a concise, encouraging tutor. Always reply in ${data.language}.`,
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429) {
        return {
          explanation: "অনেক বেশি অনুরোধ হয়ে গেছে — কিছুক্ষণ পর আবার চেষ্টা করুন।",
          language: data.language,
        };
      }
      if (res.status === 402) {
        return {
          explanation: "AI ক্রেডিট শেষ হয়ে গেছে। ওয়ার্কস্পেসে ক্রেডিট যোগ করুন।",
          language: data.language,
        };
      }
      if (!res.ok) {
        return {
          explanation: `ব্যাখ্যা আনা যায়নি (status ${res.status}). সঠিক উত্তর: ${correct}.`,
          language: data.language,
        };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      return { explanation: text || `সঠিক উত্তর: ${correct}.`, language: data.language };
    } catch {
      return {
        explanation: `সঠিক উত্তর: ${correct}. (AI সার্ভিস সাময়িকভাবে বন্ধ আছে।)`,
        language: data.language,
      };
    }
  });
