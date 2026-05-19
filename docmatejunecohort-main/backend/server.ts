// backend/src/server.ts
import express from "express";
import cors from "cors";
import { requireAuth } from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Secure route protected by Clerk middleware
app.get("/api/protected-route", requireAuth, (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ message: "Access granted", userId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
