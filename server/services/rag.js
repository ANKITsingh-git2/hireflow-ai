import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import  dotenv  from "dotenv";

dotenv.config();

// translator
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "text-embedding-004",
});

//  pinecone cient
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
})

const index = pinecone.Index(process.env.PINECONE_INDEX);

/**
 * Store text (Resume) into Pinecone
 * @param {string} text - The resume content
 * @param {string} candidateId - Unique ID for the candidate
 */
export async function addResumeToVectorDB(text, candidateId) {
    try {
    // 1. Safety Check: Is text empty?
    if (!text || text.length < 10) {
       throw new Error("Text is too short or empty. Cannot process.");
    }

    console.log(`Processing text length: ${text.length} characters...`);

    // 2. Add to Pinecone
    await PineconeStore.fromTexts(
      [text], 
      [{ candidateId: candidateId }],
      embeddings,
      {
        pineconeIndex: index,
        maxConcurrency: 5,
      }
    );
    console.log(`✅ Resume for ${candidateId} added to memory.`);
    return true;
  } catch (error) {
    console.error("❌ Error adding to Pinecone:", error);
    throw error;
  }
}

/**
 * Retrieve relevant context for a query
 * @param {string} query - The question (e.g., "Does he know React?")
 * @param {string} candidateId - Optional candidate ID to filter results
 */

export async function queryVectorDB(query, candidateId = null) {
    try {
        const vectorStore = await PineconeStore.fromExistingIndex(
            embeddings, { pineconeIndex: index }
        );

        // Build filter object if candidateId is provided
        const filter = candidateId ? { candidateId: candidateId } : undefined;

        // Search 2 most relevant results, filtered by candidateId if provided
        const results = await vectorStore.similaritySearch(query, 2, filter);
        
        if (!results.length) {
            return "No specific resume context found for this topic. Ask general technical questions.";
        }
        
        // combine in single string
        return results.map(doc => doc.pageContent).join("\n\n");
    } catch (error) {
        console.error("❌ Error querying Pinecone:", error);
        return "";
    }
}

