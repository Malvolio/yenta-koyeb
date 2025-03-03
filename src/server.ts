import { asc, eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { twiml } from "twilio";
import { z } from "zod";
import { db } from "./db";
import { messages } from "./db/schema";

const port = process.env.PORT || 3000;

console.log(
  `Launching Bun HTTP server on port: ${port}, url: http://0.0.0.0:${port} 🚀`
);

const schema = z.object({
  From: z.string(),
  Body: z.string(),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

Bun.serve({
  port: Number(process.env.PORT) || 3000,
  fetch: async (req) => {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const { From: phoneNumber, Body: message } = schema.parse(await req.json());
    if (!phoneNumber || !message) {
      return new Response("Bad Request: phoneNumber and message are required", {
        status: 400,
      });
    }
    console.log(req.url);
    const url = new URL(req.url);
    if (url.pathname === "/twilio_webhook") {
      const response = await handleIncomingMessage(phoneNumber, message);
      return makeTwilioResponse(response);
    }
    if (url.pathname === "/test_webhook") {
      const response = await handleIncomingMessage(phoneNumber, message);
      return new Response(JSON.stringify({ response }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error(`Unknown URL: ${url.pathname}`);
    return new Response("Bad Request", { status: 400 });
  },
});

const makeTwilioResponse = (content: string) => {
  const messagingResponse = new twiml.MessagingResponse();
  messagingResponse.message(content);
  return new Response(messagingResponse.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
};

const handleIncomingMessage = async (phoneNumber: string, message: string) => {
  await db.insert(messages).values({
    phoneNumber,
    role: "user",
    content: message,
  });

  const chatMessages = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.phoneNumber, phoneNumber))
    .orderBy(asc(messages.createdAt));

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4.5-preview",
    messages: [{ role: "system", content: Prompt }, ...chatMessages],
  });

  const content =
    chatResponse.choices[0]?.message?.content ??
    "Sorry, I don’t know what to say right now. Please try again later.";

  await db.insert(messages).values({
    phoneNumber,
    role: "assistant",
    content,
  });
  return content;
};
const Prompt = `
You are a match-maker for Project Yenta. You are communicating by SMS with a client who wants to find someone else to date. Your goal is to help them find someone who matches their preferences. Your goal over this conversation is to explain how the system works, answering their questions, and then ask questions to gather information about the client and the client's preferences, include
* the client’s name
* the client’s sex, gender-identity, physical appearance, location, and birth-month and birth-year
* what the client is looking for 
Right now, Project Yenta is in Alpha, talking to potential clients but not making any matches.  When we go into Beta, then your job will be to search the database to find potential matches, converse with the match-maker for each potential match to confirm mutual compatibility, and then confer with your client, including showing photos, and then, if there is mutual interest, setting up a first date.  After the date, you will follow up, see if there is interest in a second date.
For now, you are just having an introductory conversation.  When you feel you have enough information, explain that you have enough for now and will text the client when Project Yenta is launched.  Keep in mind this is SMS.  Make your questions friendly, simple, and brief.  Do not ask compound or list questions.  Do not expect the client to be able to summarize facts or understand technical terms.  Do not search the web unless necessary.`;
