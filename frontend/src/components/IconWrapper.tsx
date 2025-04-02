import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface IconWrapperProps extends Omit<IconProps, 'as'> {
  icon: IconType;
}

/**
 * Component that wraps react-icons to work correctly with Chakra UI
 * Solves TypeScript compatibility issues between react-icons and Chakra UI
 */
const IconWrapper: React.FC<IconWrapperProps> = ({ icon, ...props }) => {
  // Typecasting icon as any to avoid TypeScript errors with Chakra UI's Icon component
  return <Icon as={icon as any} {...props} />;
};

export default IconWrapper; 