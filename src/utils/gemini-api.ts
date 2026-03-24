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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          // Few-shot examples mapped as conversation history
          { role: "user", parts: [{ text: "The Prince is at Level 1 with 58 minutes left." }] },
          { role: "model", parts: [{ text: "You run well, little Prince. But S4T4N’s gravity will eventually crush your hope." }] },
          { role: "user", parts: [{ text: "The Prince is at Level 2 with 5 minutes left." }] },
          { role: "model", parts: [{ text: "Tick-tock, human. The Princess is already forgetting the scent of Earth’s air." }] },
          { role: "user", parts: [{ text: "The Prince is at Level 3 with 30 minutes left." }] },
          { role: "model", parts: [{ text: "You have reached my doorstep. Now, witness why your race is destined for extinction." }] },
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.8,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || fallbackMessage;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return fallbackMessage;
  }
};
