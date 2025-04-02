import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Paper
} from '@mui/material';
import { 
  CloudUploadOutlined, 
  InsertDriveFileOutlined,
  CloseRounded,
  CheckCircleOutline,
  ErrorOutline
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  uploadedFiles, 
  onRemoveFile 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await onFilesSelected(filesArray);
      // Reset the input value so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '1px dashed',
          borderColor: dragActive ? '#4361ee' : 'rgba(0, 0, 0, 0.15)',
          borderRadius: '10px',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          backgroundColor: dragActive ? 'rgba(67, 97, 238, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          '&:hover': {
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.05)',
          },
          mb: 2
        }}
        onClick={handleButtonClick}
      >
        <CloudUploadOutlined 
          sx={{ 
            fontSize: 40, 
            color: dragActive ? '#4361ee' : '#666',
            mb: 1
          }} 
        />
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: dragActive ? '#4361ee' : '#666',
            fontWeight: 500, 
            mb: 1 
          }}
        >
          Dra filer hit eller klikk for å laste opp
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            color: '#999'
          }}
        >
          Støtter de fleste filformater (PDF, DOC, TXT, osv.)
        </Typography>
      </Box>

      {uploadedFiles.length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: '10px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            mb: 2,
            maxHeight: '200px',
            overflow: 'auto'
          }}
        >
          <List dense>
            {uploadedFiles.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => onRemoveFile(file.id)}
                    size="small"
                    sx={{
                      color: '#666',
                      '&:hover': {
                        color: '#f44336'
                      }
                    }}
                  >
                    <CloseRounded fontSize="small" />
                  </IconButton>
                }
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {file.status === 'success' ? (
                    <CheckCircleOutline sx={{ color: '#4caf50' }} fontSize="small" />
                  ) : file.status === 'error' ? (
                    <ErrorOutline sx={{ color: '#f44336' }} fontSize="small" />
                  ) : (
                    <InsertDriveFileOutlined sx={{ color: '#4361ee' }} fontSize="small" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: file.status === 'error' ? '#f44336' : '#333',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      {file.name}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                      {file.status === 'error' && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#f44336',
                            mb: 0.5
                          }}
                        >
                          {file.error || 'Kunne ikke laste opp filen'}
                        </Typography>
                      )}
                      
                      {file.status === 'uploading' && (
                        <LinearProgress 
                          variant="determinate" 
                          value={file.progress} 
                          sx={{ 
                            height: 4, 
                            borderRadius: 2, 
                            mb: 0.5,
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4361ee'
                            }
                          }} 
                        />
                      )}
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#999',
                          fontSize: '0.75rem'
                        }}
                      >
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload; 