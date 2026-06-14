import express, {
  Request,
  Response,
} from "express";

import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import {
  createClient,
} from "@supabase/supabase-js";

// ================= LOAD ENV =================

dotenv.config();

// ================= EXPRESS =================

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// ================= ENV =================

const SUPABASE_URL =
  process.env.SUPABASE_URL!;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY!;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL missing");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY missing"
  );
}

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY missing"
  );
}

// ================= SUPABASE =================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// ================= CLERK WEBHOOK =================

app.post(
  "/clerk/webhook",
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const eventType =
        req.body.type;

      if (
        eventType !== "user.created"
      ) {

        return res.status(400).json({
          message:
            "Unsupported event type",
        });

      }

      const user = req.body.data;

      const {
        id,
        email_addresses,
        phone_numbers,
        first_name,
        last_name,
        created_at,
      } = user;

      const email =
        email_addresses?.[0]
          ?.email_address || null;

      const phone =
        phone_numbers?.[0]
          ?.phone_number || null;

      const { error } =
        await supabase
          .from("users")
          .insert([
            {
              id,
              email,
              phone,
              first_name,
              last_name,
              created_at,
              is_approved: false,
            },
          ]);

      if (error) {

        console.error(error);

        return res.status(500).json({
          error:
            "Failed to store user",
        });

      }

      return res.status(200).json({
        message:
          "User stored successfully",
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        error: "Webhook failed",
      });

    }

  }
);

// ================= AI ROUTE =================

app.post(
  "/api/ai/generate-prescription",

  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        symptoms,
        medicalHistory,
      } = req.body;

      if (
        !symptoms ||
        !medicalHistory
      ) {

        return res.status(400).json({
          error:
            "Symptoms and medical history are required",
        });

      }

      // ================= PROMPT =================

const prompt = `
You are a professional medical AI assistant.

Generate a detailed but clean prescription based on the patient's condition.

IMPORTANT RULES:
- Write professionally
- Keep sections readable
- Use proper spacing
- No markdown
- No code blocks
- No asterisks
- No long paragraphs
- Maximum 2-3 lines per section

STRICT FORMAT:

1. Diagnosis:
Explain likely diagnosis briefly.

2. Test/Surgery Suggested:
Mention required tests only if necessary.

3. Medications:
Mention medicine names and purpose briefly.

4. Dosage and Instructions:
Mention dosage clearly.

5. Follow-up advice:
Mention follow-up steps briefly.

6. Notes/Observations:
Mention important observations.

Patient Symptoms:
${symptoms}

Medical History:
${medicalHistory}
`;
      // ================= GEMINI API =================

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Gemini Response:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      // ================= EXTRACT =================

      const prescription =
        data?.candidates?.[0]
          ?.content?.parts?.[0]?.text;

      if (!prescription) {

        return res.status(500).json({
          error:
            data?.error?.message ||
            "No response from Gemini",
        });

      }

      

      return res.status(200).json({
  prescription,
});

    } catch (error) {

      console.error(
        "Gemini Error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to generate prescription",
      });

    }

  }
);

// ================= START =================

app.listen(PORT, () => {

  console.log(
    `🚀 Server listening on port ${PORT}`
  );

});