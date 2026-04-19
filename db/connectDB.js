import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URI || `your_mongodb_connection_string`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ✅ Exported collections
let vaccineCenterCollection;
let appointmentCollection;
let usersCollection;
let vaccineCollection;

export async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("vaccineSystem");
    vaccineCenterCollection = db.collection("vaccine_centers");
    appointmentCollection = db.collection("appointments");
    usersCollection = db.collection("users");
    vaccineCollection = db.collection("vaccine");

    return {
      db,
      vaccineCenterCollection,
      appointmentCollection,
      usersCollection,
      vaccineCollection,
    };
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Export collections directly
export {
  vaccineCenterCollection,
  appointmentCollection,
  usersCollection,
  vaccineCollection,
};
