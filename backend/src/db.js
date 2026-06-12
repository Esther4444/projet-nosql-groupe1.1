import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/biblio_uob";
  await mongoose.connect(uri);
  console.log("Connecte a MongoDB :", uri);
}
