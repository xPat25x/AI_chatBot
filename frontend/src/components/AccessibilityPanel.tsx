import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  Switch, 
  Select, 
  Button, 
  Heading, 
  Drawer, 
  DrawerBody, 
  DrawerHeader, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton,
  useColorMode,
  VStack,
  HStack,
  Text,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { FaUniversalAccess, FaInfoCircle } from 'react-icons/fa';
import { AccessibilitySettings, LANGUAGES, SupportedLanguages } from '../types';
import IconWrapper from './IconWrapper';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
  };

  const applySettings = () => {
    onSettingsChange(localSettings);
    
    // Apply high contrast by toggling dark mode if needed
    if (localSettings.highContrast && colorMode === 'light') {
      toggleColorMode();
    } else if (!localSettings.highContrast && colorMode === 'dark') {
      toggleColorMode();
    }
    
    // Apply large text
    if (localSettings.largeText) {
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
    
    // Apply reduced motion
    if (localSettings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton aria-label="Close accessibility panel" />
        <DrawerHeader>
          <HStack spacing={2}>
            <IconWrapper icon={FaUniversalAccess} />
            <Heading size="md">Tilgjengelighetsinnstillinger</Heading>
          </HStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            <Text>
              Juster disse innstillingene for å tilpasse brukeropplevelsen til dine behov.
            </Text>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="high-contrast" mb="0" flex="1">
                <HStack>
                  <Text>Høy kontrast</Text>
                  <Tooltip label="Aktiverer mørk modus med høyere kontrast for bedre lesbarhet">
                    <Box as="span" display="inline-block"><IconWrapper icon={FaInfoCircle} /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Switch 
                id="high-contrast" 
                isChecked={localSettings.highContrast}
                onChange={(e) => handleChange('highContrast', e.target.checked)}
                aria-label="Aktiver høy kontrast"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="large-text" mb="0" flex="1">
                <HStack>
                  <Text>Større tekst</Text>
                  <Tooltip label="Øker tekststørrelsen i hele applikasjonen">
                    <Box as="span" display="inline-block"><IconWrapper icon={FaInfoCircle} /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Switch 
                id="large-text" 
                isChecked={localSettings.largeText}
                onChange={(e) => handleChange('largeText', e.target.checked)}
                aria-label="Aktiver større tekst"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="screen-reader" mb="0" flex="1">
                <HStack>
                  <Text>Skjermleservennlig</Text>
                  <Tooltip label="Optimaliserer svar fra AI for skjermlesere">
                    <Box as="span" display="inline-block"><IconWrapper icon={FaInfoCircle} /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Switch 
                id="screen-reader" 
                isChecked={localSettings.screenReaderCompatible}
                onChange={(e) => handleChange('screenReaderCompatible', e.target.checked)}
                aria-label="Aktiver skjermleserkompatibilitet"
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="reduced-motion" mb="0" flex="1">
                <HStack>
                  <Text>Redusert bevegelse</Text>
                  <Tooltip label="Reduserer eller fjerner animasjoner">
                    <Box as="span" display="inline-block"><IconWrapper icon={FaInfoCircle} /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Switch 
                id="reduced-motion" 
                isChecked={localSettings.reducedMotion}
                onChange={(e) => handleChange('reducedMotion', e.target.checked)}
                aria-label="Aktiver redusert bevegelse"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="language">
                <HStack>
                  <Text>Språk</Text>
                  <Tooltip label="Velg språket AI-en skal kommunisere på">
                    <Box as="span" display="inline-block"><IconWrapper icon={FaInfoCircle} /></Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <Select 
                id="language"
                value={localSettings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                aria-label="Velg språk"
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </Select>
            </FormControl>

            <Box pt={4}>
              <Button colorScheme="blue" onClick={applySettings} width="100%">
                Bruk innstillinger
              </Button>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default AccessibilityPanel; 