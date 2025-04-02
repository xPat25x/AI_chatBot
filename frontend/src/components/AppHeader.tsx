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
  useTheme,
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
  const theme = useTheme();
  
  return (
    <AppBar 
      position="static" 
      elevation={0} 
      sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.95))',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              mr: 1.5,
              boxShadow: '0 2px 8px rgba(26, 115, 232, 0.25)',
            }}
          >
            <SmartToyRoundedIcon />
          </Avatar>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              background: 'linear-gradient(45deg, #1a73e8 30%, #6c5ce7 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
              borderRadius: '28px',
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
              '&.Mui-focused': {
                bgcolor: 'white',
                boxShadow: '0 0 0 2px rgba(26, 115, 232, 0.2)',
              }
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
                elevation: 3,
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  maxHeight: 400,
                }
              }
            }}
            renderValue={(selected) => {
              const selectedModel = customModels.find(model => model.id === selected);
              if (selectedModel) {
                return (
                  <Chip
                    avatar={<SmartToyRoundedIcon fontSize="small" />}
                    label={selectedModel.name}
                    size="small"
                    sx={{ 
                      height: 24, 
                      borderRadius: '12px',
                      bgcolor: theme.palette.primary.light,
                      color: 'white',
                      fontWeight: 500,
                      '& .MuiChip-avatar': {
                        color: 'white',
                      }
                    }}
                  />
                );
              }
              return selected;
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
              General Chat
            </Typography>
            {purposes.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
            
            {customModels.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, mt: 1, color: 'text.secondary', fontWeight: 600 }}>
                  My Custom Models
                </Typography>
                {customModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
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