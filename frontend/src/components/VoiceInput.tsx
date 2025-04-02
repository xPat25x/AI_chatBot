import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  IconButton, 
  Text,
  Spinner,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { API_BASE_URL } from '../constants';
import IconWrapper from './IconWrapper';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
}

// Definer enkel pulserende animasjon
const pulseKeyframes = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(67, 97, 238, 0.4); }
  70% { transform: scale(1.03); box-shadow: 0 0 0 6px rgba(67, 97, 238, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(67, 97, 238, 0); }
`;

// Definer enkelt bølge-animasjon
const audioWaveKeyframes = keyframes`
  0% { height: 4px; }
  50% { height: 12px; }
  100% { height: 4px; }
`;

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript,
  isDisabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  const pulseAnimation = `${pulseKeyframes} 2s infinite`;
  const audioWaveAnimation = (delay: number) => `${audioWaveKeyframes} 1.2s ease-in-out ${delay}s infinite`;

  useEffect(() => {
    return () => {
      // Clean up recording when component unmounts
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          // Convert audio chunks to audio file
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: 'Feil ved behandling av lydopptak',
            description: 'Kunne ikke behandle stemmeopptaket ditt. Vennligst prøv igjen.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top',
            variant: 'solid',
          });
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Opptak startet',
        description: 'Si det du vil spørre om',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
        variant: 'solid',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Kunne ikke starte opptak',
        description: 'Vennligst gi nettleseren tilgang til mikrofonen din.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'solid',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.text) {
        onTranscript(data.text);
        
        toast({
          title: 'Transkripsjon fullført',
          description: 'Din stemme har blitt konvertert til tekst.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
          variant: 'solid',
        });
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: 'Transkripsjonsfeil',
        description: 'Kunne ikke konvertere stemmen din til tekst. Vennligst prøv igjen.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'solid',
      });
    }
  };

  return (
    <Box>
      {isRecording && (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          mb={4}
          gap={1}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              width="3px"
              height="4px"
              backgroundColor="#4361ee"
              borderRadius="full"
              animation={audioWaveAnimation(i * 0.1)}
              mx="1px"
            />
          ))}
        </Box>
      )}
      
      <Tooltip label={isRecording ? "Stopp opptak" : "Start talegjenkjenning"}>
        <IconButton
          aria-label={isRecording ? "Stopp opptak" : "Start talegjenkjenning"}
          icon={isProcessing ? <Spinner size="sm" color="#333" /> : (
            isRecording ? <IconWrapper icon={FaStop} /> : <IconWrapper icon={FaMicrophone} />
          )}
          onClick={isRecording ? stopRecording : startRecording}
          colorScheme={isRecording ? "red" : "blue"}
          isRound
          size="lg"
          isDisabled={isDisabled || isProcessing}
          animation={isRecording ? pulseAnimation : undefined}
          boxShadow={isRecording ? "0 0 8px rgba(220, 38, 38, 0.4)" : "0 2px 6px rgba(67, 97, 238, 0.2)"}
          bg={isRecording ? "#dc2626" : "#4361ee"}
          _hover={{
            bg: isRecording ? "#b91c1c" : "#3a56d4",
            transform: "translateY(-1px)",
            boxShadow: isRecording ? "0 0 10px rgba(220, 38, 38, 0.5)" : "0 3px 8px rgba(67, 97, 238, 0.3)"
          }}
          _active={{
            transform: "translateY(0)",
          }}
          transition="all 0.2s ease-in-out"
        />
      </Tooltip>
      {isRecording && (
        <Text 
          fontSize="sm" 
          color="#666" 
          mt={3}
          textAlign="center"
          fontWeight="normal"
        >
          Opptak pågår...
        </Text>
      )}
    </Box>
  );
};

export default VoiceInput; 