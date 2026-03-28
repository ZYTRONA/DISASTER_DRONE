import React from 'react';

export interface IconProps {
  name?: string | any;
  size?: number;
  color?: string;
  style?: any;
}

export interface IconButtonProps {
  icon?: string | any;
  label?: string;
  onPress?: (() => void) | null;
  size?: number;
  color?: string;
  labelColor?: string;
}

declare const Icon: React.FC<IconProps>;
declare const IconButton: React.FC<IconButtonProps>;

export { IconButton };
export default Icon;

