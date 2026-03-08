import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("696d11240010dc8b6d8a");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Database configuration
// NOTE: You need to create these in the Appwrite Console:
// 1. Create a Database with ID: "farewell-db"
// 
// 2. Create a Collection with ID: "rsvp" with the following attributes:
//    - fullName (string, required, size: 255)
//    - section (string, required, size: 10)
//    - phone (string, required, size: 20)
//    - userId (string, optional, size: 255)
//    - isVerified (string, required, size: 10)
//    - createdAt (string, required, size: 50)
//
// 3. Create a Collection with ID: "memories" with the following attributes:
//    - authorName (string, required, size: 255)
//    - section (string, required, size: 10)
//    - message (string, required, size: 2000)
//    - taggedFriends (string, required, size: 1000) - JSON array as string
//    - pebbleColor (string, required, size: 50)
//    - positionX (integer, required) - X position on screen
//    - createdAt (string, required, size: 50)
//
// 4. Create a Collection with ID: "payments" with the following attributes:
//    - fullName (string, required, size: 255)
//    - phone (string, required, size: 20)
//    - section (string, required, size: 10)
//    - transactionId (string, required, size: 100)
//    - paidAmount (string, required, size: 20)
//    - expectedAmount (string, required, size: 20)
//    - upiId (string, optional, size: 255)
//    - senderName (string, optional, size: 255)
//    - screenshotFileId (string, optional, size: 100)
//    - status (string, required, size: 20) - "verified" | "pending" | "rejected" | "amount_mismatch"
//    - aiRawResponse (string, optional, size: 5000)
//    - verifiedBy (string, optional, size: 255)
//    - adminNotes (string, optional, size: 500)
//    - createdAt (string, required, size: 50)
//
// 5. Create a Storage Bucket with ID: "payment-screenshots"
//    - Max file size: 10MB, allowed extensions: jpg, jpeg, png, webp

export const DATABASE_ID = "farewell-db";
export const RSVP_COLLECTION_ID = "rsvp";
export const MEMORIES_COLLECTION_ID = "memories";
export const BROADCASTS_COLLECTION_ID = "broadcasts";
export const SONG_REQUESTS_COLLECTION_ID = "song_requests";
export const SONG_VOTES_COLLECTION_ID = "song_votes";
export const USER_REQUESTS_COLLECTION_ID = "user_requests";
export const FEATURE_FLAGS_COLLECTION_ID = "feature_flags";
export const PAYMENTS_COLLECTION_ID = "payments";
export const PAYMENT_SCREENSHOTS_BUCKET_ID = "payment-screenshots";

export { client, account, databases, storage, ID };

