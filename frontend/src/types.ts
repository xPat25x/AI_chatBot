export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface CustomModel {
  id: string;
  name: string;
  description: string;
  model_type: 'gpt' | 'assistant' | 'fine-tuned';
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReaderCompatible: boolean;
  language: string;
  reducedMotion: boolean;
}

export interface FeedbackData {
  conversationId: string;
  rating: number;
  comments?: string;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
}

export interface ChatSuggestion {
  text: string;
  topic: string;
}

export interface VoiceOptions {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export type SupportedLanguages = 
  'en' | 'no' | 'sv' | 'da' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'ja' | 'zh' | 'ko' | 'ar';

export const LANGUAGES: Record<SupportedLanguages, string> = {
  'en': 'English',
  'no': 'Norsk',
  'sv': 'Svenska',
  'da': 'Dansk',
  'de': 'Deutsch', 
  'es': 'Español',
  'fr': 'Français',
  'it': 'Italiano',
  'pt': 'Português',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'ru': 'Русский',
  'ja': '日本語',
  'zh': '中文',
  'ko': '한국어',
  'ar': 'العربية'
}; 