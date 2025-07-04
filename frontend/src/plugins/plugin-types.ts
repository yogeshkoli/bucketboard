import React from 'react';
import { FileItem } from '@/components/FileList';

// The props that will be passed to a plugin's component
export interface PluginComponentProps {
  file: FileItem;
}

export interface Plugin {
  name: string;
  version: string;
  // Defines where the plugin adds features
  contributions: {
    fileActions?: React.ComponentType<PluginComponentProps>[];
  };
}