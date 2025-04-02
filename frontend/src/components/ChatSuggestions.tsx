import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Heading, 
  HStack, 
  VStack,
  Wrap,
  WrapItem,
  Text,
  useColorModeValue,
  Spinner,
  Icon,
  Fade
} from '@chakra-ui/react';
import { FaLightbulb } from 'react-icons/fa';
import { API_BASE_URL } from '../constants';
import IconWrapper from './IconWrapper';

interface ChatSuggestionsProps {
  onSuggestionClick: (text: string) => void;
}

const TOPICS = [
  'kunstig intelligens',
  'klimaendringer',
  'teknologi',
  'vitenskap',
  'historie',
  'reise',
  'helse',
  'utdanning'
];

const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSuggestionClick }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const hoverColor = useColorModeValue('blue.50', 'blue.900');
  const buttonColorScheme = useColorModeValue('blue', 'teal');
  
  useEffect(() => {
    if (selectedTopic) {
      fetchSuggestions(selectedTopic);
    }
  }, [selectedTopic]);
  
  const fetchSuggestions = async (topic: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/suggestions/${encodeURIComponent(topic)}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Kunne ikke hente forslag. Vennligst prøv igjen senere.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
  };
  
  const resetSelection = () => {
    setSelectedTopic(null);
    setSuggestions([]);
  };
  
  return (
    <Box p={4} bg={bgColor} borderRadius="md" w="100%" mb={4}>
      <VStack spacing={4} align="stretch">
        <HStack>
          <IconWrapper icon={FaLightbulb} color="yellow.500" />
          <Heading size="sm">Ikke sikker på hva du skal spørre om?</Heading>
        </HStack>
        
        {!selectedTopic ? (
          <>
            <Text fontSize="sm">Velg et tema for å få forslag til spørsmål:</Text>
            <Wrap spacing={2}>
              {TOPICS.map(topic => (
                <WrapItem key={topic}>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    colorScheme={buttonColorScheme}
                    onClick={() => handleTopicClick(topic)}
                  >
                    {topic}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </>
        ) : (
          <Fade in={true}>
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="medium">Forslag om {selectedTopic}:</Text>
                <Button size="xs" variant="link" onClick={resetSelection}>
                  Velg annet tema
                </Button>
              </HStack>
              
              {isLoading ? (
                <Box textAlign="center" py={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" mt={1}>Laster forslag...</Text>
                </Box>
              ) : error ? (
                <Text color="red.500" fontSize="sm">{error}</Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="ghost"
                      justifyContent="flex-start"
                      textAlign="left"
                      _hover={{ bg: hoverColor }}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </VStack>
              )}
            </Box>
          </Fade>
        )}
      </VStack>
    </Box>
  );
};

export default ChatSuggestions; 