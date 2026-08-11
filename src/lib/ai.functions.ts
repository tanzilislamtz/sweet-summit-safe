import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { posts } from "./posts";

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  })),
  language: z.string().default("English"),
  context: z.string().optional()
});

export const getAiAssistantResponse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return { 
        content: "I'm currently in demo mode. Connect a Lovable API key to enable real AI responses.",
        role: "assistant"
      };
    }

    const lastMessage = data.messages[data.messages.length - 1]?.content || "";
    
    // Check for post mentions
    const isPostMention = lastMessage.includes('$');
    let suggestedPosts: typeof posts = [];
    if (isPostMention) {
      const query = lastMessage.replace('$', '').toLowerCase().trim();
      const keywords = query.split(/\s+/);
      suggestedPosts = posts.filter(post => 
        keywords.some(k => k.length > 2 && (
          post.title.toLowerCase().includes(k) || 
          post.body.toLowerCase().includes(k)
        ))
      ).slice(0, 5);
    }

    const systemPrompt = `You are a warm, encouraging study assistant for Learns Academy, a platform for Bangladeshi students. 
Your goal is to be friendly and supportive. You can engage in casual conversation (like greetings or "how are you"), but you should always look for opportunities to guide the student toward their studies or analyze their progress.

Current User Context: ${data.context || "Student at Learns Academy"}
Preferred Language: ${data.language}

Rules:
1. Always reply in ${data.language}.
2. If the user greets you, be friendly and ask how their studies are going.
3. If the user asks about a specific topic, explain it clearly and simply.
4. Encourage the user to learn something new or revisit a topic where they might have gaps.
5. If the user mentions a specific problem, offer a step-by-step breakdown.
6. Keep responses conversational and natural. Avoid overly formal or robotic language.
7. ${data.context?.includes("Explain Concept") ? "The student is currently in 'Explain Concept' mode. Focus on teaching new topics deeply with analogies." : ""}
8. ${data.context?.includes("Quiz Me") ? "The student is currently in 'Quiz Me' mode. Focus on asking short, challenging questions and grading their answers." : ""}
9. ${data.context?.includes("Homework Help") ? "The student is currently in 'Homework Help' mode. Guide them through solving their problem without just giving the answer." : ""}
10. ${data.context?.includes("Image Solve") ? "The student is currently in 'Image Solve' mode. Assume they have shared a visual problem or diagram to analyze." : ""}
${suggestedPosts.length > 0 ? `11. I found these related posts in the community: ${suggestedPosts.map(p => p.title).join(", ")}. Mention them if relevant.` : ""}
`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            ...data.messages
          ],
        }),
      });

      if (!res.ok) throw new Error("AI Gateway failed");

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      
      return { 
        content, 
        role: "assistant",
        suggestedPosts: suggestedPosts.length > 0 ? suggestedPosts : undefined
      };
    } catch (error) {
      return { 
        content: "I'm having trouble connecting to my brain right now. Please try again in a moment!",
        role: "assistant"
      };
    }
  });