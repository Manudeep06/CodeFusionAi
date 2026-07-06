import genAI from "../config/gemini.js";

export const generateResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    const response = result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate AI response");
  }
};