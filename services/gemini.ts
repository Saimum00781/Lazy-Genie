
import { GoogleGenAI, Type } from "@google/genai";
import { BANGLA_SYSTEM_PROMPT, SHRINKER_SYSTEM_PROMPT, RESEARCH_SYSTEM_PROMPT, TONE_PROMPTS, CHAT_SYSTEM_PROMPT, SOCIAL_SYSTEM_PROMPT } from "../constants";
import { Source, SummaryData, ShrinkResult, ResearchResult, Tone, ChatMessage, SocialPosts } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to construct contents with optional image
const buildContents = (text: string, imageBase64?: string) => {
  const parts: any[] = [{ text }];
  if (imageBase64) {
    // Remove data:image/...;base64, prefix if present
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from string
        data: cleanBase64
      }
    });
  }
  return [{ parts }];
};

export const generateSummary = async (content: string, tone: Tone, imageBase64?: string): Promise<SummaryData> => {
  const ai = getAI();
  const toneInstruction = TONE_PROMPTS[tone];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: buildContents(`Please analyze and summarize the following content: ${content}`, imageBase64),
    config: {
      // Structure: Tone first, then System Rules, then Strict JSON requirement
      systemInstruction: `${toneInstruction}\n${BANGLA_SYSTEM_PROMPT}\nProvide a structured summary in JSON.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bigIdeaEn: { type: Type.STRING, description: "Core message in English." },
          bigIdeaBn: { type: Type.STRING, description: "Core message in Bangla." },
          takeawaysEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key points in English." },
          takeawaysBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key points in Bangla." },
          actionItemsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action steps in English." },
          actionItemsBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action steps in Bangla." }
        },
        required: ['bigIdeaEn', 'bigIdeaBn', 'takeawaysEn', 'takeawaysBn', 'actionItemsEn', 'actionItemsBn']
      }
    }
  });

  if (!response.text) throw new Error("No text returned from Gemini API");

  try {
    let cleanText = response.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText) as SummaryData;
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("Analysis failed. Please try again.");
  }
};

export const shrinkContent = async (text: string, tone: Tone, imageBase64?: string): Promise<ShrinkResult> => {
  const ai = getAI();
  const toneInstruction = TONE_PROMPTS[tone];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: buildContents(`Content to compress: ${text}`, imageBase64),
    config: {
      systemInstruction: `${toneInstruction}\n${SHRINKER_SYSTEM_PROMPT}\nReturn JSON.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          textEn: { type: Type.STRING, description: "Summary in English" },
          textBn: { type: Type.STRING, description: "Summary in Bangla" }
        },
        required: ['textEn', 'textBn']
      }
    }
  });
  
  try {
    let cleanText = (response.text || '{}').trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText) as ShrinkResult;
  } catch (e) {
     return { textEn: response.text || '', textBn: '' };
  }
};

export const researchTopic = async (topic: string, tone: Tone, imageBase64?: string): Promise<ResearchResult> => {
  const ai = getAI();
  const toneInstruction = TONE_PROMPTS[tone];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: buildContents(`Find the most up-to-date and relevant info on: ${topic}`, imageBase64),
    config: {
      // Critical: Formatting rules come AFTER tone rules to ensure they override casual behavior
      systemInstruction: `${toneInstruction}\n\n${RESEARCH_SYSTEM_PROMPT}`,
      tools: [{ googleSearch: {} }]
    }
  });

  const fullText = response.text || '';
  const separator = '---BANGLA TRANSLATION---';
  const parts = fullText.split(separator);

  let textEn = parts[0] || '';
  let textBn = parts[1] || 'Translation not generated.';

  textEn = textEn.replace('PART 1: ENGLISH ANALYSIS', '').trim();
  textBn = textBn.replace('PART 2: BANGLA TRANSLATION', '').trim();

  const sources: Source[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || 'Source',
          uri: chunk.web.uri || '#'
        });
      }
    });
  }

  return {
    textEn,
    textBn,
    sources
  };
};

export const askGenie = async (history: ChatMessage[], newQuestion: string, context: string): Promise<string> => {
  const ai = getAI();
  
  const conversationString = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  const prompt = `
  CONTEXT OF ANALYSIS:
  ${context}

  CHAT HISTORY:
  ${conversationString}

  USER: ${newQuestion}
  MODEL:
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT
    }
  });

  return response.text || "I couldn't generate a response.";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("Failed to generate speech");
  return audioData;
};

export const generateSocials = async (context: string, tone: Tone): Promise<SocialPosts> => {
  const ai = getAI();
  const toneInstruction = TONE_PROMPTS[tone];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Generate social media posts based on this content:\n\n${context}` }] }],
    config: {
      systemInstruction: `${SOCIAL_SYSTEM_PROMPT}\n${toneInstruction}\nOutput valid JSON.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linkedin: { type: Type.STRING },
          twitter: { type: Type.STRING },
          instagram: { type: Type.STRING }
        },
        required: ['linkedin', 'twitter', 'instagram']
      }
    }
  });

  try {
    let cleanText = (response.text || '{}').trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText) as SocialPosts;
  } catch (e) {
    throw new Error("Failed to generate socials.");
  }
};
