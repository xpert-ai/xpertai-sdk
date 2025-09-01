# Overview

## Using the LangGraph SDK to Interact with the XpertAI Platform

The XpertAI intelligent agent platform can be interacted with via the [LangGraph SDK](https://docs.langchain.com/langgraph-platform/sdk) (`@langchain/langgraph-sdk` (JS/TS SDK) / langgraph-sdk Python SDK).
This SDK encapsulates the core capabilities for communicating with the LangGraph REST API, facilitating easy management of core components such as assistants, threads, runs, persistent storage (store), and more.

### 1. Installation

Ensure you have a Node.js environment installed, then install the SDK in your project:

```bash
# Install using yarn
yarn add @langchain/langgraph-sdk
# Or use npm
npm install @langchain/langgraph-sdk
```

By default, the SDK connects to `http://localhost:8123` (if started locally using `langgraph-cli`); otherwise, you need to specify the API URL or `apiKey` during configuration ([npm][1]).

### 2. Initialize the Client

In JavaScript/TypeScript, you can create a `Client` instance like this:

```ts
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({
  apiUrl: "https://api.mtda.cloud/api/ai/", // Your baseUrl of the XpertAI server.
  apiKey: "your-api-key", // API Key for XpertAI
})
```

If not explicitly configured, the SDK will default to connecting to the local `http://localhost:8123` ([npm][2]).

### 3. Managing Digital Experts (Agents)

#### List Existing Digital Experts

```ts
import { Client, Assistant } from "@langchain/langgraph-sdk";

// List all xperts
const xperts: Assistant[] = await client.assistants.search({
  metadata: null,
  offset: 0,
  limit: 10,
})
console.log("Experts:", xperts);
```

Each digital expert is an assistant ([npm][2], [LangGraph][3]).

#### Get a Single Digital Expert

```ts
const xpert = await client.assistants.get(xpertId);
```

### 4. Creating and Managing Threads

#### Create a New Thread (Empty State)

```ts
const thread = await client.threads.create(); // Or pass initialization parameters like threadId, metadata, etc.
console.log("New Thread:", thread);
```

In the example, the returned object contains properties like `thread_id`, `status`, etc. ([LangGraph][4]).

#### Pre-populate State

```ts
const threadWithState = await client.threads.create({
  threadId: "xxxxxxx",
  ifExists: 'raise'
});
```

This allows injecting a thread ID directly upon creation ([LangGraph][4]).

#### Query Thread List & Get State

```ts
const list = await client.threads.search({ limit: 10, offset: 0 });
const singleThread = await client.threads.get(thread.thread_id);
const history = await client.threads.getHistory(thread.thread_id, { limit: 50 });
```

### 5. Starting Runs

You can initiate a run for a specific digital expert within a thread, including support for streaming responses.

#### Start a Run with Streaming Response

```ts
const stream = client.runs.stream(thread.thread_id, assistant.assistant_id, {
  input: { 
    input: "Tell me a joke.", // more parameters 
  },
});
for await (const chunk of streamResponse) {
  const data = (<{ type: 'message', data: string | {type: 'text' | string; text?: string; data?: any} }>chunk.data)
  // Output text messages only
  if (data.type === 'message') {
    if (typeof data.data === 'string') {
      process.stdout.write(data.data)
    } else if (data.data.type === 'text') {
      process.stdout.write(data.data.text ?? '')
    } else {
      // console.log(`Component:`, data.data);
    }
  }
}
```

This allows processing the response as it is generated, suitable for interactive scenarios ([npm][2]).

#### Other Run Operation Examples

```ts
const run = await client.runs.create(thread.thread_id, assistant.assistant_id, { input: { ... } });
const result = await client.runs.join(thread.thread_id, run.run_id);
await client.runs.cancel(thread.thread_id, run.run_id);
const runsList = await client.runs.list(thread.thread_id, { limit: 10 });
```

### 6. Using Store (Persistent Storage)

Store data that needs to be saved across requests within a session or task.

```ts
// Write
await client.store.putItem([xpert_id], "key1", { value: 42 });

// Read
const item = await client.store.getItem([xpert_id], "key1");

// List namespaces
const namespaces = await client.store.listNamespaces({
  prefix: [xpert_id],
  maxDepth: 2,
  limit: 10
});

// Search
const found = await client.store.searchItems({ namespacePrefix: "my", query: "42" });
```

Detailed interfaces are defined by `StoreClient` ([LangGraph][3]).

### 7. XpertAI Platform Integration Tips

* **Configure Default API URL and Key**: The API URL needs to be explicitly specified. The key can be uniformly configured using the environment variable `LANGGRAPH_API_KEY`.
* **Stream Output to Frontend**: Suitable for frontends like React; real-time chat interfaces can be built using the SDK's streaming capabilities.
* **Persistent Memory**: Enhance the agent's memory by saving crucial session data through the Store functionality.

[1]: https://www.npmjs.com/package/%40langchain/langgraph-sdk "@langchain/langgraph-sdk - npm"
[2]: https://www.npmjs.com/package/%40langchain/langgraph-sdk "@langchain/langgraph-sdk - npm"
[3]: https://langgraph.com.cn/cloud/reference/sdk/js_ts_sdk_ref/index.html "SDK (JS/TS) - LangChain Framework"
[4]: https://github.langchain.ac.cn/langgraph/cloud/how-tos/use_threads/ "Threads - LangChain Framework"
[5]: https://github.langchain.ac.cn/langgraph/cloud/reference/sdk/js_ts_sdk_ref/ "Js ts sdk ref - LangChain Framework"

## References

- [Agent Protocol](https://langchain-ai.github.io/agent-protocol/api.html)
- [Agent Protocol: Interoperability for LLM agents](https://blog.langchain.dev/agent-protocol-interoperability-for-llm-agents/)

## More Information

The SDK is continuously being improved. If you encounter any issues or have suggestions, please add our WeChat: xpertai to contact us for technical discussions.
