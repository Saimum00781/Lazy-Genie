
export enum ToolType {
  YOUTUBE = 'youtube',
  SHRINKER = 'shrinker',
  RESEARCH = 'research'
}

export type Tone = 'professional' | 'casual';
export type AppTheme = 'light' | 'dark' | 'paper';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SummaryData {
  bigIdeaEn: string;
  bigIdeaBn: string;
  takeawaysEn: string[];
  takeawaysBn: string[];
  actionItemsEn: string[];
  actionItemsBn: string[];
}

export interface Source {
  title: string;
  uri: string;
}

export interface ResearchResult {
  textEn: string;
  textBn: string;
  sources: Source[];
}

export interface ShrinkResult {
  textEn: string;
  textBn: string;
}

export interface SocialPosts {
  linkedin: string;
  twitter: string;
  instagram: string;
}
