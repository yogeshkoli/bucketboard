'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { registerPlugin } from './plugin-registry';
import type { Plugin, PluginComponentProps } from './plugin-types';
import { toast } from 'sonner';
import { FileJson } from 'lucide-react';

// This is the component our plugin will render in the menu
function LogFileAction({ file }: PluginComponentProps) {
  const handleClick = () => {
    console.log('Logging file from plugin:', file);
    toast.info(`Logged ${file.name} to the console.`);
  };

  return (
    <DropdownMenuItem onClick={handleClick}>
      <FileJson className="mr-2 h-4 w-4" />
      <span>Log to Console</span>
    </DropdownMenuItem>
  );
}

// Define and register the plugin
const LoggerPlugin: Plugin = {
  name: 'Console Logger',
  version: '1.0.0',
  contributions: {
    fileActions: [LogFileAction],
  },
};

registerPlugin(LoggerPlugin);