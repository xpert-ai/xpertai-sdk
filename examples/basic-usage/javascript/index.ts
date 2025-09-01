import { Assistant, Client } from "@langchain/langgraph-sdk";
import "dotenv/config";
import chalk from "chalk";
import { ChatMessageEventTypeEnum, ChatMessageTypeEnum } from "./types.js";

const apiUrl = process.env.XPERTAI_API_URL;
const apiKey = process.env.XPERTAI_API_KEY;
const expertId = "1f041078-3f48-43db-b1ce-7c53270884a8"; // Replace with your expert ID

const client = new Client({
  apiUrl: apiUrl, // Your baseUrl of XpertAI server.
  apiKey: apiKey, // API Key of xpert
});

// List Experts
async function listExperts() {
  const xperts = await client.assistants.search({
    metadata: null,
    offset: 0,
    limit: 10,
  });
  return xperts;
}

// Threads

(async () => {
  const xpert = await client.assistants.get(expertId);
  const thread = await client.threads.create(); // Or input initialization parameters such as threadId and metadata
  const stream = client.runs.stream(thread.thread_id, xpert.assistant_id, {
    input: {
      input: "What are the development prospects of multi-agent systems?", // more parameters
    },
  });
  
  for await (const chunk of stream) {
    const data = <
      {
        type: ChatMessageTypeEnum;
        event: ChatMessageEventTypeEnum;
        data: string | { type: "text" | string; text?: string; data?: any };
      }
    >chunk.data;
    // Output text messages only
    if (data.type === ChatMessageTypeEnum.MESSAGE) {
      if (typeof data.data === "string") {
        process.stdout.write(data.data);
      } else if (data.data.type === "text") {
        process.stdout.write(data.data.text ?? "");
      } else {
        console.log(chalk.blueBright(`Type ${data.data.type} "${data.data.data.title ?? ""}": "${data.data.data.message ?? ""}"`));
      }
    } else if (data.type === ChatMessageTypeEnum.EVENT) {
      console.log(chalk.yellowBright(`Event:`, data.event));
    } else {
      throw new Error(chalk.red(`Types that should not exist: "${data.type}"`));
    }
  }
})();
