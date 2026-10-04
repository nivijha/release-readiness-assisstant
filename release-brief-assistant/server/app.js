dotenv.config();
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import releaseRoutes from "./routes/releaseRoutes.js";

console.log("GEMINI KEY LOADED:", !!process.env.GEMINI_API_KEY);
console.log("MONGODB URI LOADED:", !!process.env.MONGODB_URI);

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection - only if URI is configured
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
    });
}

const db = mongoose.connection;
db.on("error", (err) =>
  console.error("MongoDB connection error:", err)
);

app.use("/api/releases", releaseRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Release Brief Assistant API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});