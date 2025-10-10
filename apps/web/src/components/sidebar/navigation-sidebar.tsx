import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui';
import { AppSidebarHeader, NavigationMenu } from './navigation';

export function NavigationSidebar() {
  return (
    <Sidebar
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-e"
      collapsible="none"
    >
      <AppSidebarHeader variant="icon" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <NavigationMenu variant="icon" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
