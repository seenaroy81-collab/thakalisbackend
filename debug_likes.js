import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const checkIndexesAndDebug = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGOURI);
        console.log("Connected.");

        // Define Schema exactly as in code (Singular 'Like')
        // We want to see what indexes currently exist on the COLLECTION
        const collectionName = 'likes'; // This is the default pluralization of 'Like'
        const collection = mongoose.connection.collection(collectionName);

        console.log(`\n--- Indexes on '${collectionName}' collection ---`);
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        // Define Model to test insertion
        const likeSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, required: true },
            foodId: { type: mongoose.Schema.Types.ObjectId, required: true },
            likedAt: { type: Date, default: Date.now },
        });
        // Explicitly use the 'Like' model to match our change
        const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);

        // DUMMY DATA (Replace with actual IDs from your DB if known, or valid ObjectIds)
        // We'll generate random valid IDs to test generic insertion
        const dummyUserId = new mongoose.Types.ObjectId();
        const dummyFoodId = new mongoose.Types.ObjectId();

        console.log(`\n--- Attempting to insert Like ---`);
        console.log(`User: ${dummyUserId}, Food: ${dummyFoodId}`);

        const newLike = await Like.create({ userId: dummyUserId, foodId: dummyFoodId });
        console.log("Success! Created like:", newLike._id);

        console.log(`\n--- Attempting Duplicate Insert (Same User/Food) ---`);
        try {
            await Like.create({ userId: dummyUserId, foodId: dummyFoodId });
            console.log("Success? (Duplicate allowed)");
        } catch (err) {
            console.log("Duplicate Insert Failed as expected/unexpected:");
            console.log(`Error Code: ${err.code}`);
            console.log(`Error Name: ${err.name}`);
            console.log(`Error Message: ${err.message}`);
        }

    } catch (err) {
        console.error("\n!!! CRITICAL ERROR !!!");
        console.error(err);
    } finally {
        await mongoose.connection.close();
        console.log("\nConnection closed.");
    }
};

checkIndexesAndDebug();
