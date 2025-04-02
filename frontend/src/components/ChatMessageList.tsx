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
        bgcolor: 'white',
        backgroundImage: 'none',
        '&::-webkit-scrollbar': {
          width: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }
        }
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
          <Box
            sx={{
              height: 80,
              width: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f4ff',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              boxShadow: '0 2px 10px rgba(67, 97, 238, 0.1)',
              mb: 3
            }}
          >
            <SmartToyRounded 
              fontSize="large" 
              sx={{ 
                fontSize: 40, 
                color: '#4361ee'
              }} 
            />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#333', 
              fontWeight: 600,
              mb: 1
            }}
          >
            AI Chatbot
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666', 
              textAlign: 'center',
              maxWidth: '300px'
            }}
          >
            Send en melding for å starte samtalen
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
                mb: 2,
                alignItems: 'flex-start',
              }}
            >
              {!isUser && isFirstMessageOfGroup && (
                <Avatar 
                  sx={{ 
                    bgcolor: '#4361ee', 
                    mr: 1.5, 
                    width: 36, 
                    height: 36,
                    boxShadow: '0 2px 6px rgba(67, 97, 238, 0.2)'
                  }}
                >
                  <SmartToyRounded fontSize="small" sx={{ color: 'white' }} />
                </Avatar>
              )}
              
              {!isUser && !isFirstMessageOfGroup && <Box sx={{ width: 36, mr: 1.5 }} />}
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: { xs: '75%', sm: '65%' }
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    px: 2,
                    bgcolor: isUser ? '#4361ee' : '#f0f4ff',
                    color: isUser ? 'white' : '#333',
                    wordWrap: 'break-word',
                    borderRadius: isUser
                      ? isFirstMessageOfGroup 
                        ? '16px 16px 4px 16px'
                        : isLastMessageOfGroup
                        ? '16px 4px 16px 16px'
                        : '16px 4px 4px 16px'
                      : isFirstMessageOfGroup
                        ? '4px 16px 16px 16px'
                        : isLastMessageOfGroup
                        ? '16px 16px 16px 4px'
                        : '4px 16px 16px 4px',
                    boxShadow: isUser 
                      ? '0 2px 6px rgba(67, 97, 238, 0.2)' 
                      : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    border: isUser 
                      ? 'none'
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    borderTopRightRadius: isUser && !isFirstMessageOfGroup ? 4 : undefined,
                    borderTopLeftRadius: !isUser && !isFirstMessageOfGroup ? 4 : undefined,
                    borderBottomRightRadius: isUser && !isLastMessageOfGroup ? 4 : undefined,
                    borderBottomLeftRadius: !isUser && !isLastMessageOfGroup ? 4 : undefined
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      fontWeight: isUser ? 400 : 400,
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>
                
                {isLastMessageOfGroup && formattedTime && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#999', 
                      mt: 0.5, 
                      px: 0.5,
                      fontSize: '0.7rem'
                    }}
                  >
                    {formattedTime}
                  </Typography>
                )}
              </Box>
              
              {isUser && isFirstMessageOfGroup && (
                <Avatar 
                  sx={{ 
                    bgcolor: '#3a56d4', 
                    ml: 1.5, 
                    width: 36, 
                    height: 36,
                    boxShadow: '0 2px 6px rgba(67, 97, 238, 0.2)'
                  }}
                >
                  <PersonRounded fontSize="small" sx={{ color: 'white' }} />
                </Avatar>
              )}
              
              {isUser && !isFirstMessageOfGroup && <Box sx={{ width: 36, ml: 1.5 }} />}
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
              bgcolor: '#f8f9fa',
              p: 1.5,
              px: 2,
              borderRadius: '12px',
              width: 'fit-content',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            <CircularProgress size={16} thickness={5} sx={{ mr: 1.5, color: '#4361ee' }} />
            <Typography variant="body2" color="#666">Tenker...</Typography>
          </Box>
        </Fade>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessageList; 