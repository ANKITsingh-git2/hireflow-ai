import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index(process.env.PINECONE_INDEX);

/**
 * Delete all vectors from Pinecone index
 * WARNING: This will delete ALL resume data!
 */
async function clearAllVectors() {
    try {
        console.log("🗑️  Clearing all vectors from Pinecone...");
        
        // Delete all vectors in the namespace (or entire index if no namespace)
        await index.namespace("").deleteAll();
        
        console.log("✅ All vectors deleted successfully!");
        console.log("You can now upload fresh resumes without old data contamination.");
    } catch (error) {
        console.error("❌ Error clearing vectors:", error);
    }
}

// Run the cleanup
clearAllVectors();
