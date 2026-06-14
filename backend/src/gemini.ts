import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export const generatePrescription = async (
  symptoms: string,
  medicalHistory: string
) => {

  const prompt = `
You are an expert medical assistant.

Generate a medical prescription in STRICT JSON format.

Return ONLY valid JSON.

{
  "diagnosis": "",
  "tests": "",
  "medications": "",
  "dosage": "",
  "followUp": "",
  "notes": ""
}

Patient Symptoms:
${symptoms}

Medical History:
${medicalHistory}
`;

  const result = await model.generateContent(prompt);

  return result.response.text();
};