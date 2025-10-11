import { Client, ValuesStreamEvent } from "@langchain/langgraph-sdk";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { ChatMessageTypeEnum, printStreamMessages } from "./types.js";

const apiUrl = process.env.XPERTAI_API_URL;
const apiKey = process.env.XPERTAI_API_KEY;
const expertId = "9361949b-776f-4b2d-a211-82a3d9592297"; // Replace with your expert ID

const client = new Client({
  apiUrl: apiUrl, // Your baseUrl of XpertAI server.
  apiKey: apiKey, // API Key of xpert
});

// Threads
(async () => {
  // Upload a file
  const filePath = path.resolve(process.cwd(), "data/draft-of-the-indictment.docx");
  const fileBuffer = fs.readFileSync(filePath);
  const file = new File([fileBuffer], "draft-of-the-indictment.docx");
  const fileData = await uploadFile(file);

  const xpert = await client.assistants.get(expertId);
  const thread = await client.threads.create(); // Or input initialization parameters such as threadId and metadata
  const stream = client.runs.stream(thread.thread_id, xpert.assistant_id, {
    input: {
      input: "Interpreting the file contents", // more parameters
      files: [fileData],
    },
  });

  await printStreamMessages(stream as AsyncGenerator<ValuesStreamEvent<{type: ChatMessageTypeEnum}>>);
})();

/**
 * Upload file to XpertAI server
 * 
 * @param file 
 * @returns 
 */
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}v1/file`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey || "",
    },
    body: formData,
  });
  const data = await response.json();
  if (response.ok) {
    console.log("File uploaded successfully:", data);
    return data; // Return the response data
  } else {
    console.error("Error uploading file:", data);
    throw new Error("Error uploading file"); // Throw an error for further handling if needed
  }
}
