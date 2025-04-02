import React from 'react';
import { Box, Paper, Typography, CircularProgress, Avatar, Fade } from '@mui/material';
import { PersonRounded, SmartToyRounded } from '@mui/icons-material';
import { Message } from '../types'; // Import the Message type
import { format } from 'date-fns'; // Import date formatting library

interface ChatMessageListProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, loading, messagesEndRef }) => {
  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: { xs: 2, sm: 3 }, 
        bgcolor: 'background.default',
        backgroundImage: 'radial-gradient(#e1e5f0 0.5px, transparent 0.5px)',
        backgroundSize: '15px 15px',
      }}
    >
      {messages.length === 0 && (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          opacity: 0.8
        }}>
          <SmartToyRounded fontSize="large" color="primary" sx={{ mb: 2, fontSize: 60, opacity: 0.7 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            AI Chatbot
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Send a message to start a conversation
          </Typography>
        </Box>
      )}

      {messages.map((msg, index) => {
        const formattedTime = msg.timestamp 
          ? format(new Date(msg.timestamp), 'p') // Format to time like '1:30 PM'
          : '';
          
        const isUser = msg.role === 'user';
        const isFirstMessageOfGroup = index === 0 || messages[index - 1].role !== msg.role;
        const isLastMessageOfGroup = index === messages.length - 1 || messages[index + 1].role !== msg.role;
        
        return (
          <Fade 
            key={index} 
            in={true} 
            timeout={300} 
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <Box 
              sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 1.5,
                alignItems: 'flex-start',
              }}
            >
              {!isUser && isFirstMessageOfGroup && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'secondary.main', 
                    mr: 1, 
                    width: 36, 
                    height: 36,
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <SmartToyRounded fontSize="small" />
                </Avatar>
              )}
              
              {!isUser && !isFirstMessageOfGroup && <Box sx={{ width: 36, mr: 1 }} />}
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '75%'
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    px: 2,
                    bgcolor: isUser ? 'primary.main' : 'white',
                    color: isUser ? 'primary.contrastText' : 'text.primary',
                    wordWrap: 'break-word',
                    borderRadius: isUser
                      ? isFirstMessageOfGroup 
                        ? '18px 18px 4px 18px'
                        : isLastMessageOfGroup
                        ? '18px 4px 18px 18px'
                        : '18px 4px 4px 18px'
                      : isFirstMessageOfGroup
                        ? '4px 18px 18px 18px'
                        : isLastMessageOfGroup
                        ? '18px 18px 18px 4px'
                        : '4px 18px 18px 4px',
                    boxShadow: isUser 
                      ? '0px 2px 4px rgba(26, 115, 232, 0.2)' 
                      : '0px 2px 4px rgba(0,0,0,0.05)',
                    borderTopRightRadius: isUser && !isFirstMessageOfGroup ? 4 : undefined,
                    borderTopLeftRadius: !isUser && !isFirstMessageOfGroup ? 4 : undefined,
                    borderBottomRightRadius: isUser && !isLastMessageOfGroup ? 4 : undefined,
                    borderBottomLeftRadius: !isUser && !isLastMessageOfGroup ? 4 : undefined,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Paper>
                
                {isLastMessageOfGroup && formattedTime && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary', 
                      mt: 0.5, 
                      px: 0.5,
                      fontSize: '0.7rem',
                      opacity: 0.8
                    }}
                  >
                    {formattedTime}
                  </Typography>
                )}
              </Box>
              
              {isUser && isFirstMessageOfGroup && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    ml: 1, 
                    width: 36, 
                    height: 36,
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <PersonRounded fontSize="small" />
                </Avatar>
              )}
              
              {isUser && !isFirstMessageOfGroup && <Box sx={{ width: 36, ml: 1 }} />}
            </Box>
          </Fade>
        );
      })}

      {loading && (
        <Fade in={loading} timeout={200}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 2, 
              mb: 2,
              bgcolor: 'background.paper',
              p: 1.5,
              px: 2,
              borderRadius: '18px',
              width: 'fit-content',
              boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <CircularProgress size={16} thickness={6} sx={{ mr: 1.5 }} />
            <Typography variant="body2" color="text.secondary">Thinking...</Typography>
          </Box>
        </Fade>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessageList; 