import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import type { IconSet } from '../../constants/achievements';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface AchievementIconProps {
  icon: string;
  iconSet: IconSet;
  size: number;
  color: string;
}

export function AchievementIcon({ icon, iconSet, size, color }: AchievementIconProps) {
  if (iconSet === 'mci') {
    return <MaterialCommunityIcons name={icon as MCIName} size={size} color={color} />;
  }
  return <Ionicons name={icon as IoniconsName} size={size} color={color} />;
}
