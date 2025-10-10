import { useState } from 'react';

export interface EditingState {
  editingId: string | null;
  editingValue: string;
  isEditing: (id: string) => boolean;
  startEditing: (id: string, currentValue: string) => void;
  cancelEditing: () => void;
  commitEditing: (id: string, newValue: string) => Promise<boolean>;
  setEditingValue: (value: string) => void;
}

export function useEditingState<T extends { id: string; title?: string }>(
  items: T[],
  onRename: (id: string, title: string) => Promise<void>
): EditingState {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const isEditing = (id: string) => editingId === id;

  const startEditing = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditingValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const commitEditing = async (
    id: string,
    newValue: string
  ): Promise<boolean> => {
    const trimmedValue = newValue.trim();
    const currentItem = items.find((item) => item.id === id);
    const currentTitle = currentItem?.title || '';

    if (!trimmedValue || trimmedValue === currentTitle) {
      cancelEditing();
      return false;
    }

    try {
      await onRename(id, trimmedValue);
      cancelEditing();
      return true;
    } catch (error) {
      console.error('Failed to rename item:', error);
      return false;
    }
  };

  return {
    editingId,
    editingValue,
    isEditing,
    startEditing,
    cancelEditing,
    commitEditing,
    setEditingValue,
  };
}
