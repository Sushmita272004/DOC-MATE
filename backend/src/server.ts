import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { model } from "./gemini";

import {
  clerkMiddleware,
  requireAuth,
  getAuth,
} from "@clerk/express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

app.get("/api/protected-route", requireAuth(), (req, res) => {

  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  res.json({
    message: "Access granted",
    userId: auth.userId,
  });
});


// ================= AI ROUTE =================

app.post("/api/generate", async (req, res) => {

  try {

    const { prompt } = req.body;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({
      response,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "AI generation failed",
    });

  }

});

// ============================================


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});