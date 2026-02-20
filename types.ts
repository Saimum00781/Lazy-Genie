
export enum ToolType {
  YOUTUBE = 'youtube',
  SHRINKER = 'shrinker',
  RESEARCH = 'research'
}

export type Tone = 'professional' | 'casual' | 'concise';
export type AppTheme = 'light' | 'dark' | 'paper' | 'midnight' | 'forest' | 'lavender';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SummaryData {
  bigIdeaEn: string;
  bigIdeaBn: string;
  takeawaysEn: string[];
  takeawaysBn: string[];
  negativePointsEn: string[];
  negativePointsBn: string[];
  actionItemsEn: string[];
  actionItemsBn: string[];
  relatedTopics?: string[];
}

export interface Source {
  title: string;
  uri: string;
  usedContent?: string[];
}

export interface ResearchResult {
  textEn: string;
  textBn: string;
  sources: Source[];
  relatedTopics?: string[];
}

export interface ShrinkResult {
  tlDrEn: string;
  tlDrBn: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Urgent' | 'Salesy';
  keyDates: string[];
  keyFigures: string[];
  keyPeople: string[];
  textEn: string;
  textBn: string;
  talkingPoints: string[];
  negativePointsEn: string[];
  negativePointsBn: string[];
  actionItemsEn: string[];
  actionItemsBn: string[];
  counterArgument: string;
  faq: { question: string; answer: string }[];
}

export interface SocialPosts {
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
}

export interface NarrativeData {
  textEn: string;
  textBn: string;
}
