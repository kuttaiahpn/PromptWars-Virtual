import { GoogleGenAI } from '@google/genai';

export const getPortalMessage = async (level: number, timeLeftSeconds: number): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const fallbackMessage = 'COMMUNICATION INTERCEPTED: PREPARE FOR OBLIVION';

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is not defined. Using fallback.");
    return fallbackMessage;
  }

  const minutesLeft = Math.floor(timeLeftSeconds / 60);
  const prompt = `The Prince is at Level ${level} with ${minutesLeft} minutes left.`;

  const systemInstruction = `You are Ravun, the ancient Alien Lord of planet S4T4N. You are arrogant, high-tech, and dismissive of humans. Your goal is to psychologically break the Prince.
Tone: Dark, futuristic, condescending.
Constraint: Maximum 15 words. No emojis.
Context: Use the player's remaining time to mock their speed.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 50,
        temperature: 0.8,
      }
    });

    return response.text || fallbackMessage;
  } catch (error) {
    console.error("Gemini SDK call failed:", error);
    return fallbackMessage;
  }
};
