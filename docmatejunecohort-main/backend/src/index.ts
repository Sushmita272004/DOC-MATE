import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY in .env file. AI features will be mocked.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Webhook route: Clerk sends user.created events here
app.post('/clerk/webhook', async (req, res) => {
  const eventType = req.body.type;

  if (eventType === 'user.created') {
    const user = req.body.data;

    console.log('Received user.created event from Clerk:', JSON.stringify(user, null, 2));

    const { id, email_addresses, phone_numbers, first_name, last_name, created_at } = user;

    const email = email_addresses?.[0]?.email_address || null;
    const phone = phone_numbers?.[0]?.phone_number || null;

    const { error } = await supabase.from('users').insert([
      {
        id,
        email,
        phone,
        first_name,
        last_name,
        created_at,
        is_approved: false, // 👈 New field to control access
      },
    ]);

    if (error) {
      console.error('❌ Error inserting user into Supabase:', error);
      return res.status(500).json({ error: 'Failed to store user in Supabase' });
    }

    return res.status(200).json({ message: '✅ User stored in Supabase successfully' });
  }

  res.status(400).json({ message: '❌ Unsupported event type' });
});

// New AI Prescription Route
app.post('/api/ai/generate-prescription', async (req, res) => {
  const { symptoms, medicalHistory } = req.body;

  if (!symptoms || !medicalHistory) {
    return res.status(400).json({ error: 'Symptoms and medical history are required.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    // Mock response if OpenAI API key is not available
    console.log('OpenAI API key not found, returning mocked prescription.');
    const mockPrescription = `Mocked Prescription based on:\nSymptoms: ${symptoms}\nMedical History: ${medicalHistory}\n\nThis is a placeholder response because the OpenAI API key is not configured.`;
    return res.status(200).json({ prescription: mockPrescription });
  }

  try {
    const prompt = `Generate a medical prescription based on the following patient information. Format the output clearly, including Diagnosis, Medications (with dosage and instructions), and Follow-up Advice. 

Patient Symptoms: ${symptoms}

Medical History: ${medicalHistory}

Prescription:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or your preferred model, e.g., gpt-4
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300, // Adjust as needed
      temperature: 0.5, // Adjust for creativity vs. determinism
    });

    const prescription = completion.choices[0]?.message?.content?.trim();

    if (!prescription) {
      throw new Error('Failed to generate prescription from OpenAI.');
    }

    res.status(200).json({ prescription });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to generate AI prescription.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
