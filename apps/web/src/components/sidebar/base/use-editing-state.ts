import { useState } from 'react';

export interface EditingState {
  editingId: string | null;
  editingValue: string;
  isEditing: (id: number | string) => boolean;
  startEditing: (id: number | string, currentValue: string) => void;
  cancelEditing: () => void;
  commitEditing: (id: number | string, newValue: string) => Promise<boolean>;
  setEditingValue: (value: string) => void;
}

export function useEditingState<
  T extends { id: number | string; title?: string },
>(
  items: T[],
  onRename: (id: number | string, title: string) => Promise<void>
): EditingState {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const isEditing = (id: number | string) => editingId === String(id);

  const startEditing = (id: number | string, currentValue: string) => {
    setEditingId(String(id));
    setEditingValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const commitEditing = async (
    id: number | string,
    newValue: string
  ): Promise<boolean> => {
    const trimmedValue = newValue.trim();
    const currentItem = items.find((item) => String(item.id) === String(id));
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
