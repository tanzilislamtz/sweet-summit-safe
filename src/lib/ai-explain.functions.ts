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
  /** Language the explanation must be written in. English by default. */
  language: z.string().default("English"),
});

export const explainAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const correct = data.options[data.correctIndex] ?? "";
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return {
        explanation: `Correct answer: ${correct}. (AI explanation is unavailable right now.)`,
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

    const correctLetter = String.fromCharCode(65 + data.correctIndex);
    const chosenLetter = answered ? String.fromCharCode(65 + data.userIndex) : null;

    // Three distinct tutor behaviours — correct / wrong / skipped. The model decides
    // the actual wording and reasoning from the question itself.
    const guidance = isCorrect
      ? `Start by warmly congratulating the student for choosing ${chosenLetter}. Confirm it is right, then explain in your own words the reasoning or rule that makes it right. End with one encouraging line.`
      : answered
        ? `Gently tell the student that their choice ${chosenLetter} ("${chosen}") is not right. Explain, in your own words, exactly where that thinking goes wrong. Then say the correct answer is ${correctLetter} ("${correct}") and explain clearly why it is right. End with one short memory tip.`
        : `The student left this question blank. Kindly say they should have attempted it — even a reasoned guess helps — and encourage them to answer next time. Then explain the correct answer ${correctLetter} ("${correct}") in your own words, step by step, so they remember it.`;

    const prompt = `You are a warm, encouraging tutor for Bangladeshi SSC students.
${situation}

${guidance}

Reason from the actual question and options below — do not use generic filler, and do not repeat these instructions back. Write 3-5 natural sentences in ${data.language}, conversational and friendly, plain text only (no markdown, no bullet points, no headings).

Subject: ${data.subject ?? "general"}
Topic: ${data.topic ?? "general"}
Question: ${data.question}
Options: ${data.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(" | ")}
Correct answer: ${correctLetter}. ${correct}`;


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
          explanation: "Too many requests — please try again in a moment.",
          language: data.language,
        };
      }
      if (res.status === 402) {
        return {
          explanation: "AI credits have run out. Please add credits to your workspace.",
          language: data.language,
        };
      }
      if (!res.ok) {
        return {
          explanation: `Could not load the explanation (status ${res.status}). Correct answer: ${correct}.`,
          language: data.language,
        };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      return { explanation: text || `Correct answer: ${correct}.`, language: data.language };
    } catch {
      return {
        explanation: `Correct answer: ${correct}. (The AI service is temporarily unavailable.)`,
        language: data.language,
      };
    }
  });
