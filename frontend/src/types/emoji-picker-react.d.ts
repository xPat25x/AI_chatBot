declare module 'emoji-picker-react' {
  export interface EmojiClickData {
    emoji: string;
    names: string[];
    unified: string;
    isCustom: boolean;
    imageUrl?: string;
  }

  export interface EmojiPickerProps {
    onEmojiClick: (emojiData: EmojiClickData, event: MouseEvent) => void;
    searchPlaceholder?: string;
    width?: string | number;
    height?: string | number;
    theme?: 'light' | 'dark' | 'auto';
    lazyLoadEmojis?: boolean;
    preload?: boolean;
    skinTonesDisabled?: boolean;
    searchDisabled?: boolean;
    autoFocusSearch?: boolean;
    emojiStyle?: 'native' | 'apple' | 'facebook' | 'google' | 'twitter';
    suggestedEmojisMode?: 'recent' | 'frequent';
    categories?: string[];
  }

  const EmojiPicker: React.FC<EmojiPickerProps>;
  export default EmojiPicker;
} 