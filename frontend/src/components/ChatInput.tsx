import React, { useState, useRef, useEffect } from 'react';
import {
  Textarea,
  Button,
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Tooltip,
  HStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Text
} from '@chakra-ui/react';
import { FaPaperPlane, FaSmile, FaMicrophone, FaKeyboard, FaPaperclip } from 'react-icons/fa';
import VoiceInput from './VoiceInput';
import { SupportedLanguages, AccessibilitySettings } from '../types';
import IconWrapper from './IconWrapper';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  accessibilitySettings?: AccessibilitySettings;
  placeholder?: string;
  language?: SupportedLanguages;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onFileUpload,
  isLoading,
  accessibilitySettings = {
    highContrast: false,
    largeText: false,
    screenReaderCompatible: false,
    language: 'no',
    reducedMotion: false
  },
  placeholder = 'Skriv din melding her...',
  language = 'no'
}) => {
  const [message, setMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgColor = useColorModeValue('#f8f9fa', '#f8f9fa');
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.1)');

  useEffect(() => {
    if (!isVoiceMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVoiceMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message when Enter is pressed without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setMessage(text);
    // Switch back to text mode
    setIsVoiceMode(false);
  };

  const toggleInputMode = () => {
    setIsVoiceMode(!isVoiceMode);
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await onFileUpload(file);
      
      // Reset input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Language specific placeholders
  const getPlaceholderByLanguage = () => {
    const placeholders: Record<SupportedLanguages, string> = {
      'en': 'Type your message here...',
      'no': 'Skriv din melding her...',
      'sv': 'Skriv ditt meddelande här...',
      'da': 'Skriv din besked her...',
      'de': 'Schreiben Sie Ihre Nachricht hier...',
      'es': 'Escribe tu mensaje aquí...',
      'fr': 'Écrivez votre message ici...',
      'it': 'Scrivi il tuo messaggio qui...',
      'pt': 'Escreva sua mensagem aqui...',
      'nl': 'Typ je bericht hier...',
      'pl': 'Wpisz swoją wiadomość tutaj...',
      'ru': 'Напишите ваше сообщение здесь...',
      'ja': 'メッセージを入力してください...',
      'zh': '在这里输入您的消息...',
      'ko': '여기에 메시지를 입력하세요...',
      'ar': 'اكتب رسالتك هنا...'
    };

    return placeholders[language] || placeholder;
  };

  return (
    <Box 
      position="relative" 
      borderTop="1px" 
      borderColor={borderColor} 
      p={4} 
      bg={bgColor}
      borderBottomRadius="12px"
      backdropFilter="none"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.txt,.json,.csv,.md,.jpg,.jpeg,.png"
      />

      {isVoiceMode ? (
        <Flex justify="center" align="center" direction="column" py={4}>
          <VoiceInput onTranscript={handleVoiceTranscript} isDisabled={isLoading} />
          <Text fontSize="sm" mt={2} color="#666">Si hva du vil spørre om</Text>
          <Button 
            mt={4} 
            size="sm" 
            onClick={toggleInputMode}
            variant="outline"
            leftIcon={<IconWrapper icon={FaKeyboard} />}
            color="#4361ee"
            borderColor="rgba(67, 97, 238, 0.3)"
            _hover={{
              bg: "rgba(67, 97, 238, 0.05)",
              borderColor: "rgba(67, 97, 238, 0.5)"
            }}
            _active={{
              bg: "rgba(67, 97, 238, 0.1)",
            }}
          >
            Bytt til tekstmodus
          </Button>
        </Flex>
      ) : (
        <>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderByLanguage()}
            size="md"
            resize="none"
            rows={3}
            isDisabled={isLoading}
            aria-label="Meldingsinnhold"
            bg="white"
            borderRadius="8px"
            borderColor="rgba(0, 0, 0, 0.15)"
            color="#333"
            _placeholder={{ color: "#999" }}
            _hover={{
              borderColor: "rgba(67, 97, 238, 0.4)",
            }}
            _focus={{
              borderColor: "#4361ee",
              boxShadow: "0 0 0 1px rgba(67, 97, 238, 0.4)"
            }}
          />
          
          <HStack mt={2} justify="space-between">
            <HStack spacing={2}>
              <Tooltip label="Bytt til taleinput">
                <IconButton
                  aria-label="Bytt til taleinput"
                  icon={<IconWrapper icon={FaMicrophone} />}
                  size="md"
                  variant="ghost"
                  onClick={toggleInputMode}
                  isDisabled={isLoading}
                  color="#666"
                  _hover={{ bg: "rgba(0, 0, 0, 0.05)", color: "#4361ee" }}
                  _active={{ bg: "rgba(0, 0, 0, 0.1)" }}
                />
              </Tooltip>
              
              <Tooltip label="Last opp fil">
                <IconButton
                  aria-label="Last opp fil"
                  icon={<IconWrapper icon={FaPaperclip} />}
                  size="md"
                  variant="ghost"
                  onClick={handleFileButtonClick}
                  isDisabled={isLoading}
                  color="#666"
                  _hover={{ bg: "rgba(0, 0, 0, 0.05)", color: "#4361ee" }}
                  _active={{ bg: "rgba(0, 0, 0, 0.1)" }}
                />
              </Tooltip>
              
              <Popover placement="top-start">
                <PopoverTrigger>
                  <IconButton
                    aria-label="Legg til emoji"
                    icon={<IconWrapper icon={FaSmile} />}
                    size="md"
                    variant="ghost"
                    isDisabled={isLoading}
                    color="#666"
                    _hover={{ bg: "rgba(0, 0, 0, 0.05)", color: "#4361ee" }}
                    _active={{ bg: "rgba(0, 0, 0, 0.1)" }}
                  />
                </PopoverTrigger>
                <PopoverContent width="300px" borderColor="rgba(0, 0, 0, 0.1)" bg="white" shadow="lg">
                  <PopoverArrow bg="white" />
                  <PopoverBody>
                    <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height="350px" theme="light" />
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </HStack>
            
            <Tooltip label="Send melding">
              <IconButton
                colorScheme="blue"
                aria-label="Send melding"
                icon={<IconWrapper icon={FaPaperPlane} />}
                isLoading={isLoading}
                onClick={sendMessage}
                isDisabled={!message.trim() || isLoading}
                size="md"
                borderRadius="full"
                bg="#4361ee"
                _hover={{
                  bg: "#3a56d4",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 6px rgba(67, 97, 238, 0.3)"
                }}
                _active={{
                  bg: "#324bc0",
                  transform: "translateY(0)",
                }}
                transition="all 0.2s ease-in-out"
              />
            </Tooltip>
          </HStack>
        </>
      )}
    </Box>
  );
};

export default ChatInput; 