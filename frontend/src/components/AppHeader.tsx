import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Avatar,
  Chip
} from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { CustomModel } from '../types';

interface AppHeaderProps {
  purposes: string[];
  purpose: string;
  onPurposeChange: (event: SelectChangeEvent<string>) => void;
  customModels: CustomModel[];
  selectedModelId: string | null;
  onModelSelect: (event: SelectChangeEvent<string>) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  purposes,
  purpose,
  onPurposeChange,
  customModels,
  selectedModelId,
  onModelSelect,
}) => {
  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        background: 'white',
        color: '#333'
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              background: '#4361ee',
              width: 38,
              height: 38,
              mr: 1.5,
              boxShadow: '0 2px 6px rgba(67, 97, 238, 0.2)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <SmartToyRoundedIcon sx={{ color: 'white', fontSize: '1.3rem' }} />
          </Avatar>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#333',
              letterSpacing: '0.3px'
            }}
          >
            AI Chatbot
          </Typography>
        </Box>
        
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: 220, 
            ml: 'auto',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: 'white',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(0, 0, 0, 0.15)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover': {
                bgcolor: '#f8f9fa',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              },
              '&.Mui-focused': {
                bgcolor: 'white',
                boxShadow: '0 0 0 2px rgba(67, 97, 238, 0.2)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4361ee',
                  borderWidth: '1px',
                },
              }
            },
            '& .MuiInputLabel-root': {
              color: '#666',
              '&.Mui-focused': {
                color: '#4361ee',
              }
            },
            '& .MuiSelect-select': {
              color: '#333',
            },
            '& .MuiSvgIcon-root': {
              color: '#666',
            }
          }}
        >
          <InputLabel id="chat-type-label">Chat Type</InputLabel>
          <Select
            labelId="chat-type-label"
            value={selectedModelId || purpose}
            label="Chat Type"
            onChange={(e) => {
              const value = e.target.value;
              if (customModels.some(model => model.id === value)) {
                onModelSelect(e);
              } else {
                onPurposeChange(e);
              }
            }}
            MenuProps={{
              PaperProps: {
                elevation: 2,
                sx: {
                  mt: 1,
                  borderRadius: 1.5,
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  '& .MuiMenuItem-root': {
                    color: '#333',
                    py: 1,
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#f0f4ff',
                      '&:hover': {
                        bgcolor: '#e6eeff',
                      }
                    }
                  },
                  maxHeight: 400,
                }
              }
            }}
            renderValue={(selected) => {
              const selectedModel = customModels.find(model => model.id === selected);
              if (selectedModel) {
                return (
                  <Chip
                    avatar={<SmartToyRoundedIcon fontSize="small" sx={{ color: 'white' }} />}
                    label={selectedModel.name}
                    size="small"
                    sx={{ 
                      height: 26, 
                      borderRadius: '6px',
                      background: '#4361ee',
                      color: 'white',
                      fontWeight: 500,
                      '& .MuiChip-avatar': {
                        color: 'white',
                      }
                    }}
                  />
                );
              }
              return <span style={{ color: '#333' }}>{selected}</span>;
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                px: 2, 
                py: 1, 
                color: '#666', 
                fontWeight: 600,
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              General Chat
            </Typography>
            {purposes.map((p) => (
              <MenuItem key={p} value={p} sx={{ py: 1 }}>
                {p}
              </MenuItem>
            ))}
            
            {customModels.length > 0 && (
              <>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    mt: 1, 
                    color: '#666', 
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                  }}
                >
                  My Custom Models
                </Typography>
                {customModels.map((model) => (
                  <MenuItem key={model.id} value={model.id} sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 22,
                          height: 22,
                          mr: 1,
                          background: '#4361ee',
                          fontSize: '0.75rem'
                        }}
                      >
                        <SmartToyRoundedIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                      </Avatar>
                      {model.name}
                    </Box>
                  </MenuItem>
                ))}
              </>
            )}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader; 