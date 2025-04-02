import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { Message, CustomModel } from './types';
import { API_BASE_URL, purposes } from './constants';
import ChatMessageList from './components/ChatMessageList';
import ChatInput from './components/ChatInput';
import AppHeader from './components/AppHeader';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [purpose, setPurpose] = useState('General Knowledge');
  const [loading, setLoading] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [newModelInstructions, setNewModelInstructions] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Increase retry count and delay for slow-starting backends
  const MAX_RETRIES = 10;  // Increased from 5
  const RETRY_DELAY = 5000; // Increased from 3000 (5 seconds between attempts)

  useEffect(() => {
    let retryCount = 0;
    let connectionTimer: NodeJS.Timeout;
    
    const checkBackendWithRetry = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/health`);
        showSnackbar('Backend server connected', 'success');
        // If successful, fetch models
        fetchCustomModels();
      } catch (error: any) {
        console.log(`Backend connection attempt ${retryCount + 1}/${MAX_RETRIES} failed - trying to connect to ${API_BASE_URL}/api/health`);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          // Schedule next retry
          connectionTimer = setTimeout(checkBackendWithRetry, RETRY_DELAY);
          if (retryCount === 1) {
            // Only show this message on the first retry attempt
            showSnackbar(`Connecting to backend server at ${API_BASE_URL}...`, 'info');
          }
        } else {
          // Max retries reached
          showSnackbar(`Backend server not available at ${API_BASE_URL}. Please check if backend is running on port 8000.`, 'warning');
        }
      }
    };
    
    // Start the connection check process
    checkBackendWithRetry();
    
    // Cleanup timer on component unmount
    return () => {
      clearTimeout(connectionTimer);
    };
  }, []);
  
  const fetchCustomModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/custom_models`);
      setCustomModels(response.data);
    } catch (error: any) {
      console.error('Error fetching custom models:', error);
      // Don't show an error snackbar here since we don't want to disrupt the user
      // Just initialize with empty array which is already the default state
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSend = useCallback(async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;
      const messagesToSend = [...messages, userMessage];
      response = await axios.post(`${API_BASE_URL}/api/chat`, {
        messages: messagesToSend,
        purpose,
        model_id: selectedModelId,
      });

      console.log('Server response:', response.data);
      const responseMessage = response.data.message || "No response received";
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      let errorMessage: Message;
      
      // Check if it's a connection error
      if (error?.message && typeof error.message === 'string' && error.message.includes('Network Error')) {
        errorMessage = {
          role: 'assistant',
          content: `I couldn't connect to the backend server at ${API_BASE_URL}. Please make sure the backend is running on port 8000 and try again.`,
          timestamp: new Date(),
        };
        
        // Try to auto-reconnect
        setTimeout(() => {
          axios.get(`${API_BASE_URL}/api/health`)
            .then(() => {
              showSnackbar('Backend server connected!', 'success');
              fetchCustomModels();
            })
            .catch(() => {
              // Silent catch - we don't need to show another error
            });
        }, 3000);
      } else {
        errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        };
      }
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, purpose, selectedModelId]);
  
  const handleCreateModel = async () => {
    try {
      let response;
      const modelPayload = {
        name: newModelName,
        description: newModelDesc,
        model_type: selectedModelId === 'gpt' ? 'gpt' : 'assistant',
        instructions: newModelInstructions,
      };

      response = await axios.post(`${API_BASE_URL}/api/custom_models`, modelPayload);
      
      setCustomModels([...customModels, response.data]);
      setModelDialogOpen(false);
      resetModelForm();
      showSnackbar('Custom model created successfully', 'success');
      setSelectedModelId(response.data.id);

    } catch (error: any) {
      console.error('Error creating model:', error);
      showSnackbar('Failed to create custom model', 'error');
    }
  };
  
  const handlePurposeChange = (event: SelectChangeEvent<string>) => {
    setPurpose(event.target.value);
    setSelectedModelId(null);
  };

  const handleModelSelect = (event: SelectChangeEvent<string>) => {
    setSelectedModelId(event.target.value);
  };
  
  const resetModelForm = () => {
    setNewModelName('');
    setNewModelDesc('');
    setNewModelInstructions('');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_id', selectedModelId || '');
      
      const response = await axios.post(`${API_BASE_URL}/api/upload_file`, formData);
      showSnackbar(`File uploaded successfully: ${response.data.filename}`, 'success');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showSnackbar('Failed to upload file', 'error');
    }
  }, [selectedModelId]);

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        p: { xs: 0 },
        overflow: 'hidden',
        bgcolor: '#f8f9fa',
        backgroundImage: 'none',
        color: '#343a40'
      }}
    >
      <AppHeader
        purposes={purposes}
        purpose={purpose}
        onPurposeChange={handlePurposeChange}
        customModels={customModels}
        selectedModelId={selectedModelId}
        onModelSelect={handleModelSelect}
      />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'none',
        padding: '16px'
      }}>
        <Paper 
          elevation={1} 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px',
            bgcolor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
          }}
        >
          <ChatMessageList 
            messages={messages}
            loading={loading}
            messagesEndRef={messagesEndRef} 
          />
          <ChatInput 
            onSendMessage={handleSend} 
            isLoading={loading}
            onFileUpload={handleFileUpload}
            accessibilitySettings={{
              highContrast: false,
              largeText: false,
              screenReaderCompatible: false,
              language: 'no',
              reducedMotion: false
            }}
          />
        </Paper>
        
        <Fab 
          color="primary" 
          aria-label="add custom model"
          onClick={() => setModelDialogOpen(true)}
          sx={{ 
            position: 'absolute', 
            bottom: 24, 
            right: 24,
            background: '#4361ee',
            boxShadow: '0 3px 8px rgba(67, 97, 238, 0.3)',
            '&:hover': {
              background: '#3a56d4',
              boxShadow: '0 4px 10px rgba(67, 97, 238, 0.4)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      <Dialog 
        open={modelDialogOpen} 
        onClose={() => setModelDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 3,
            py: 2
          }}
        >
          <Typography variant="h6" fontWeight={600}>Create a Custom Model</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            placeholder="My Custom Assistant"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 1.5 }
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            value={newModelDesc}
            onChange={(e) => setNewModelDesc(e.target.value)}
            placeholder="A brief description of what this model does"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 1.5 }
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Instructions"
            value={newModelInstructions}
            onChange={(e) => setNewModelInstructions(e.target.value)}
            multiline
            rows={4}
            placeholder="How should this model behave? What knowledge does it have?"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 1.5 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setModelDialogOpen(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateModel} 
            variant="contained"
            disabled={!newModelName.trim() || !newModelInstructions.trim()}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              boxShadow: '0 2px 8px rgba(26, 115, 232, 0.25)',
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          variant="filled"
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App; 