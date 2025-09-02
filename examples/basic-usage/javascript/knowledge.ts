import axios from "axios";
import "dotenv/config";
import FormData from "form-data";
import fs from "fs";

const apiUrl = process.env.XPERTAI_API_URL;
const apiKey = process.env.XPERTAI_API_KEY;

const workspaceId = "23f2b2ff-9318-43b6-a986-928fcf70d4ea"; // Replace with your workspace ID
const copilotId = "9ff28c7c-3e63-4ced-b855-2782d79a21b3"; // Replace with your copilot id
// const integrationId = '' // Replace with your integration ID if it is external knowledge base
let knowledgebaseId = "13e453d4-32df-40b7-a0e6-0e317bf0fb96"; // Will be set after creating a knowledge base

const baseHeaders = {
  Authorization: `Bearer ${apiKey}`,
};

async function createKnowledgebase() {
  const knowledgebase = {
    workspaceId,
    name: "Customer service knowledgebase 7",
    description: "string",
    permission: "organization",
    type: "standard",
    recall: {
      topK: 10,
      score: 0.5,
    },
    copilotModel: {
      copilotId,
      modelType: "text-embedding",
      model: "text-embedding-v4",
    },
    // integrationId,
    // extKnowledgebaseId: "string",
  };
  try {
    const response = await axios.post<{ id: string }>(
      apiUrl + "v1/kb",
      knowledgebase,
      {
        headers: baseHeaders,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to create knowledge base:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function uploadFile(filePath: string) {
  const formData = new FormData();

  // Add file to formData, 'file' is the parameter name required by the interface
  formData.append("file", fs.createReadStream(filePath));

  // Set request headers, note: FormData will automatically set the appropriate Content-Type and boundary
  const headers = {
    ...formData.getHeaders(),
    ...baseHeaders,
  };

  // Send POST request
  const response = await axios.post<{ id: string }>(
    apiUrl + "v1/file",
    formData,
    {
      headers,
    }
  );
  return response.data;
}

async function createDocument(knowledgebaseId: string, storageFileId: string) {
  const document = {
    knowledgebaseId,
    storageFileId,
    sourceType: "file",
  };
  try {
    const response = await axios.post<{ id: string; status: string; progress: number }[]>(
      apiUrl + `v1/kb/${knowledgebaseId}/bulk`,
      [document],
      {
        headers: baseHeaders,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to create document:",
      error.response?.data || error.message
    );
  }
  return null
}

async function startEmbedding(knowledgebaseId: string, documentId: string) {
  try {
    const response = await axios.post<{ id: string; status: string; progress: number }[]>(
      apiUrl + `v1/kb/${knowledgebaseId}/process`,
      [documentId],
      {
        headers: baseHeaders,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to process document:",
      error.response?.data || error.message
    );
  }

  return null;
}

async function checkDocumentStatus(
  knowledgebaseId: string,
  documentId: string
) {
  try {
    const response = await axios.get<{ id: string; status: string; progress: number }[]>(
      apiUrl + `v1/kb/${knowledgebaseId}/status`,
      { params: { ids: [documentId].join(",") }, headers: baseHeaders }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Failed to process document:",
      error.response?.data || error.message
    );
  }

  return null;
}

(async () => {
  // Step 1: Create a knowledge base
  const knowledgebase = await createKnowledgebase();
  if (!knowledgebase) return;
  knowledgebaseId = knowledgebase.id;

  // Step 2: Upload a file
  const storageFile = await uploadFile("./data/file.txt");

  // Step 3: Create a document
  let docs = await createDocument(knowledgebaseId, storageFile.id);
  if (!docs) return;
  let document = docs[0]
  if (!document) return;

  // Step 4: Start embedding
  docs = await startEmbedding(knowledgebaseId, document.id);
  if (!docs) return;
  document = docs[0]

  // Step 5: Check document status
  let status = document.status;
  while (status === "running") {
    process.stdout.write(`/${document.progress}`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking again
    docs = await checkDocumentStatus(knowledgebaseId, document.id);
    if (!docs) {
        throw new Error("Failed to get document status");
    }
    document = docs[0]
    if (!document) {
        throw new Error("Document not found");
    }
    status = document.status ?? "failed";
  }

  console.log(`\nDocument processed with status: ${status}`);
  console.log(document);
})();
