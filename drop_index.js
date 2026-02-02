import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const dropLegacyIndex = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGOURI);
        console.log("Connected.");

        const collectionName = 'likes';
        const collection = mongoose.connection.collection(collectionName);
        const indexName = 'userId_1_productId_1';

        console.log(`\nAttempting to drop index: ${indexName}`);

        try {
            await collection.dropIndex(indexName);
            console.log("✅ SUCCESS: Legacy index dropped!");
        } catch (err) {
            if (err.code === 27) {
                console.log("ℹ️ Index not found (already dropped?).");
            } else {
                console.error("❌ Failed to drop index:", err.message);
            }
        }

        console.log(`\n--- Remaining Indexes ---`);
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

    } catch (err) {
        console.error("\n!!! CRITICAL ERROR !!!");
        console.error(err);
    } finally {
        await mongoose.connection.close();
        console.log("\nConnection closed.");
    }
};

dropLegacyIndex();
