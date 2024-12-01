import mongoose from "mongoose";

export const connectToDataBase = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};
