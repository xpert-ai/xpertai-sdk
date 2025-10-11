import { Assistant, Client, ValuesStreamEvent } from "@langchain/langgraph-sdk";
import "dotenv/config";
import { ChatMessageTypeEnum, printStreamMessages } from "./types.js";

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
  
  await printStreamMessages(stream as AsyncGenerator<ValuesStreamEvent<{type: ChatMessageTypeEnum}>>);
})();
