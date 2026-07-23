const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    // Set up connection event listeners for robustness and auto-reconnection logging
    mongoose.connection.on("connected", () => {
      console.log("🟢 Mongoose connected to MongoDB Atlas");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`🔴 Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🟡 Mongoose connection disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🟢 Mongoose reconnected to MongoDB Atlas");
    });

    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected successfully");
  } catch (err) {
    console.error(`❌ Database connection failed: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
