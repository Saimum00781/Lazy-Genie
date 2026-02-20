
import { GoogleGenAI, Type } from "@google/genai";
import { BANGLA_SYSTEM_PROMPT, SHRINKER_SYSTEM_PROMPT, RESEARCH_SYSTEM_PROMPT, TONE_PROMPTS, CHAT_SYSTEM_PROMPT, SOCIAL_SYSTEM_PROMPT } from "../constants";
import { Source, SummaryData, ShrinkResult, ResearchResult, Tone, ChatMessage, SocialPosts, NarrativeData } from "../types";

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
    contents: buildContents(`Please analyze and summarize the following content. If it is a URL (like YouTube), you MUST use Google Search to retrieve and understand the video/page context: ${content}`, imageBase64),
    config: {
      // Structure: Tone first, then System Rules, then Strict JSON requirement
      systemInstruction: `${toneInstruction}\n${BANGLA_SYSTEM_PROMPT}\nProvide a structured summary in JSON. Include 3-5 related topics for further research. Also identify 3-5 potential downsides, risks, or negative aspects of the content.`,
      tools: [{ googleSearch: {} }], // Enable search for URL analysis
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bigIdeaEn: { type: Type.STRING, description: "Core message in English." },
          bigIdeaBn: { type: Type.STRING, description: "Core message in Bangla." },
          takeawaysEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key points in English." },
          takeawaysBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key points in Bangla." },
          negativePointsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential downsides, risks, or negative aspects in English." },
          negativePointsBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential downsides, risks, or negative aspects in Bangla." },
          actionItemsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action steps in English." },
          actionItemsBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action steps in Bangla." },
          relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 related topics or follow-up questions." }
        },
        required: ['bigIdeaEn', 'bigIdeaBn', 'takeawaysEn', 'takeawaysBn', 'negativePointsEn', 'negativePointsBn', 'actionItemsEn', 'actionItemsBn']
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
      systemInstruction: `${toneInstruction}\n${SHRINKER_SYSTEM_PROMPT}\nIdentify 3-5 negative points or risks. Return JSON.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tlDrEn: { type: Type.STRING, description: "One sentence TL;DR in English" },
          tlDrBn: { type: Type.STRING, description: "One sentence TL;DR in Bangla" },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral', 'Urgent', 'Salesy'] },
          keyDates: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyFigures: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyPeople: { type: Type.ARRAY, items: { type: Type.STRING } },
          textEn: { type: Type.STRING, description: "Executive summary in English" },
          textBn: { type: Type.STRING, description: "Executive summary in Bangla" },
          talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Smart things to say in a meeting" },
          negativePointsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential downsides, risks, or negative aspects in English." },
          negativePointsBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential downsides, risks, or negative aspects in Bangla." },
          actionItemsEn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable next steps in English" },
          actionItemsBn: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable next steps in Bangla" },
          counterArgument: { type: Type.STRING, description: "Devil's advocate perspective" },
          faq: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                 question: { type: Type.STRING },
                 answer: { type: Type.STRING }
              },
              required: ['question', 'answer']
            },
            description: "Anticipated Q&A"
          }
        },
        required: ['tlDrEn', 'tlDrBn', 'sentiment', 'textEn', 'textBn', 'talkingPoints', 'negativePointsEn', 'negativePointsBn', 'actionItemsEn', 'actionItemsBn', 'counterArgument', 'faq']
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
    // Fallback if parsing fails, though with schema mode this is rare
    console.error("Shrink Parse Error", e);
    return { 
        tlDrEn: "Analysis failed", 
        tlDrBn: "Analysis failed", 
        sentiment: "Neutral",
        keyDates: [], keyFigures: [], keyPeople: [],
        textEn: response.text || '', 
        textBn: '',
        talkingPoints: [],
        negativePointsEn: [],
        negativePointsBn: [],
        actionItemsEn: [],
        actionItemsBn: [],
        counterArgument: "",
        faq: []
    };
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
  
  // Parse Sections
  const parts1 = fullText.split('---BANGLA TRANSLATION---');
  let textEn = parts1[0] || '';
  let remainder = parts1[1] || '';

  const parts2 = remainder.split('---RELATED TOPICS---');
  let textBn = parts2[0] || 'Translation not generated.';
  let topicsRaw = parts2[1] || '';

  // cleanup text
  textEn = textEn.replace('PART 1: ENGLISH ANALYSIS', '').trim();
  textBn = textBn.replace('PART 2: BANGLA TRANSLATION', '').trim();

  // Parse Related Topics
  const relatedTopics = topicsRaw
    .replace('PART 3: RELATED TOPICS', '')
    .split('\n')
    .map(t => t.replace(/^-\s*/, '').trim())
    .filter(t => t.length > 0)
    .slice(0, 5);

  const sources: Source[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const supports = response.candidates?.[0]?.groundingMetadata?.groundingSupports;

  if (chunks) {
    // 1. Initialize sources from chunks
    chunks.forEach((chunk, index) => {
      if (chunk.web) {
        sources[index] = {
          title: chunk.web.title || 'Source',
          uri: chunk.web.uri || '#',
          usedContent: [] // Initialize array for snippets
        };
      }
    });

    // 2. Map generated segments (supports) to specific sources
    if (supports) {
      supports.forEach(support => {
        const segmentText = support.segment?.text;
        if (segmentText && support.groundingChunkIndices) {
          support.groundingChunkIndices.forEach(chunkIndex => {
            if (sources[chunkIndex]) {
              // Avoid exact duplicates if the model cites the same sentence multiple times
              if (!sources[chunkIndex].usedContent?.includes(segmentText.trim())) {
                 sources[chunkIndex].usedContent?.push(segmentText.trim());
              }
            }
          });
        }
      });
    }
  }

  // Filter out empty slots and flatten
  const validSources = sources.filter(s => s);

  return {
    textEn,
    textBn,
    sources: validSources,
    relatedTopics
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
          instagram: { type: Type.STRING },
          facebook: { type: Type.STRING }
        },
        required: ['linkedin', 'twitter', 'instagram', 'facebook']
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

export const generateNarrative = async (content: string, tone: Tone, imageBase64?: string): Promise<NarrativeData> => {
  const ai = getAI();
  const toneInstruction = TONE_PROMPTS[tone];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded to Pro for Search capabilities
    contents: buildContents(`Write a detailed, comprehensive narrative or transcript-style account of this content. If it is a URL (like YouTube), use Google Search to get the full context: ${content}`, imageBase64),
    config: {
      systemInstruction: `${toneInstruction}\n${BANGLA_SYSTEM_PROMPT}\nOutput as a JSON object with 'textEn' and 'textBn'. Format as a single coherent paragraph for each.`,
      tools: [{ googleSearch: {} }], // Enable search
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          textEn: { type: Type.STRING, description: "Detailed narrative/transcript in English" },
          textBn: { type: Type.STRING, description: "Detailed narrative/transcript in Bangla" }
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
    return JSON.parse(cleanText) as NarrativeData;
  } catch (e) {
    throw new Error("Failed to generate narrative.");
  }
};
