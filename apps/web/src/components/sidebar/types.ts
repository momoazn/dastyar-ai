import type React from 'react';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export interface SidebarItemProps {
  title: string | undefined;
  to: string;
  onArchive?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ContentSidebarProps {
  activeItem: NavItem | undefined;
  onNew: () => void;
}
