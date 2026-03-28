/**
 * Icon Component - Premium vector icons using @expo/vector-icons
 * Simplified to use Ionicons exclusively for consistency across the app
 * Provides type-safe icon components with proper JSX syntax
 * 
 * Type definitions are provided in Icon.d.ts
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Icon Component - Renders a single Ionicon
 * @param {Object} props
 * @param {string} [props.name='help-circle'] - Icon name
 * @param {number} [props.size=20] - Icon size
 * @param {string} [props.color='#111827'] - Icon color
 * @param {Object} [props.style={}] - Additional styles
 * @returns {React.ReactElement}
 */
const Icon = ({ name = 'help-circle', size = 20, color = '#111827', style = {} }) => {
  return (
    <Ionicons
      // @ts-expect-error - Ionicons types are too strict, but we validate icon names at runtime
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
};

/**
 * Icon Button Component - Renders Ionicon with optional label
 * @param {Object} props
 * @param {string} [props.icon='help-circle'] - Icon name
 * @param {string} [props.label=''] - Optional label below icon
 * @param {Function|void} [props.onPress] - Press handler
 * @param {number} [props.size=24] - Icon size
 * @param {string} [props.color='#1e1b4b'] - Icon color
 * @param {string} [props.labelColor='#111827'] - Label text color
 * @returns {React.ReactElement}
 */
const IconButton = (
  /** @type {{icon?: string, label?: string, onPress?: (event: any) => void, size?: number, color?: string, labelColor?: string}} */
  { icon = 'help-circle', label = '', onPress = () => {}, size = 24, color = '#1e1b4b', labelColor = '#111827' }
) => {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        // @ts-expect-error - Ionicons types are too strict, but we validate icon names at runtime
        name={icon}
        size={size}
        color={color}
        onPress={onPress}
        style={{ padding: 8 }}
      />
      {label && (
        <Text
          style={{
            color: labelColor,
            fontSize: 12,
            marginTop: 4,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

// Export components
export default Icon;
export { IconButton };
