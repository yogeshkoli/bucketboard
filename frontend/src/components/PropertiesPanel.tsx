'use client';

import React, { useState, useEffect } from 'react';
import { FileItem } from './FileList';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { X, Tag, Plus, Save } from 'lucide-react';
import { formatBytes, getFileIcon } from '@/lib/utils';

interface PropertiesPanelProps {
  file: FileItem | null;
  onClose: () => void;
  onActionSuccess: () => void;
}

export function PropertiesPanel({ file, onClose, onActionSuccess }: PropertiesPanelProps) {
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (file) {
      const fetchTags = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/metadata?key=${encodeURIComponent(file.key)}`);
          if (!res.ok) throw new Error('Failed to fetch tags.');
          const data = await res.json();
          setTags(data || []);
        } catch (error) {
          console.error('Failed to fetch tags', error);
          setTags([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTags();
    } else {
      setTags([]);
    }
  }, [file]);

  const handleTagChange = (index: number, field: 'Key' | 'Value', value: string) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  const handleAddTag = () => {
    setTags([...tags, { Key: '', Value: '' }]);
  };

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  const handleSaveChanges = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/metadata`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: file.key, tags }),
        }
      );
      if (!res.ok) throw new Error('Failed to save changes.');
      onActionSuccess();
    } catch (error) {
      console.error('Failed to save changes', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) {
    return null;
  }

  return (
    <Card className="w-full md:w-80 flex-shrink-0 border-l bg-background rounded-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Properties</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center text-center p-4 space-y-2">
          <div className="h-16 w-16 flex items-center justify-center">
            {getFileIcon(file.name, { className: "h-10 w-10" })}
          </div>
          <p className="font-semibold break-all">{file.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Size:</span><span>{formatBytes(file.size)}</span></div>
            <div className="flex justify-between"><span>Modified:</span><span>{new Date(file.lastModified).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Storage Class:</span><span>{file.storageClass}</span></div>
            <div className="flex flex-col"><span className="mb-1">Full Path:</span><span className="text-muted-foreground break-all text-xs">{file.key}</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Metadata Tags
          </h3>
          <div className="space-y-2">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input placeholder="Key" value={tag.Key} onChange={(e) => handleTagChange(index, 'Key', e.target.value)} className="h-8" />
                <Input placeholder="Value" value={tag.Value} onChange={(e) => handleTagChange(index, 'Value', e.target.value)} className="h-8" />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveTag(index)} className="h-8 w-8 flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddTag} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Tag
            </Button>
          </div>
        </div>
        <Button onClick={handleSaveChanges} disabled={isLoading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
