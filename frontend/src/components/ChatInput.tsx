import React, { useState, useRef, useEffect } from 'react';
import { TextField, IconButton, Box, CircularProgress, Grow, Tooltip } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading }) => {
  const [input, setInput] = useState('');
  const [rows, setRows] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Adjust rows based on content
  useEffect(() => {
    const lineCount = (input.match(/\n/g) || []).length + 1;
    setRows(Math.min(Math.max(lineCount, 1), 4));
  }, [input]);

  const handleSendClick = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    setRows(1);
    // Focus back on input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        p: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0px -2px 10px rgba(0,0,0,0.03)',
        position: 'relative',
        zIndex: 1
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
        multiline
        rows={rows}
        inputRef={inputRef}
        InputProps={{
          sx: {
            borderRadius: '24px',
            pr: '12px',
            pl: '20px',
            py: '6px',
            bgcolor: theme => theme.palette.mode === 'light' 
              ? 'rgba(0, 0, 0, 0.02)' 
              : 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              bgcolor: theme => theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.08)',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: '1px',
            },
          }
        }}
        sx={{ 
          mr: 1,
          '& textarea': {
            transition: 'height 0.2s ease',
          }
        }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <Grow in={!loading} unmountOnExit>
          <Tooltip title="Send message">
            <span>
              <IconButton
                color="primary"
                onClick={handleSendClick}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                sx={{ 
                  p: '10px',
                  bgcolor: input.trim() ? 'primary.main' : 'transparent',
                  color: input.trim() ? 'white' : 'action.active',
                  '&:hover': {
                    bgcolor: input.trim() ? 'primary.dark' : 'action.hover',
                  },
                  transition: 'all 0.2s ease',
                  borderRadius: '50%',
                  height: 40,
                  width: 40,
                }}
              >
                <SendRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Grow>
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', pr: '10px', pl: '2px' }}>
            <CircularProgress size={24} color="primary" thickness={5} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatInput; 