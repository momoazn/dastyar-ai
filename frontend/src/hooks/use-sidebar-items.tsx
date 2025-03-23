import { ApiResponse, PaginatedApiResponse } from "@/lib/api";
import {
  Conversation,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
} from "@/lib/api/chat";
import {
  TranslationProject,
  useCreateTranslationProject,
  useDeleteTranslationProject,
  useTranslationProjects,
  useUpdateTranslationProject,
} from "@/lib/api/translate";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UseMutateFunction } from "@tanstack/react-query";

interface SidebarItems {
  items:
    | PaginatedApiResponse<Conversation>
    | PaginatedApiResponse<TranslationProject>;
  itemsIsLoading: boolean;
  refetchItems: () => void;

  createItemMutation: UseMutateFunction<
    ApiResponse<Conversation> | ApiResponse<TranslationProject>,
    Error,
    { title: string }
  >;
  createItemLoading: boolean;

  updateItemMutation: UseMutateFunction<
    ApiResponse<Conversation> | ApiResponse<TranslationProject>,
    Error,
    { id: number; title: string }
  >;
  updateItemLoading: boolean;

  deleteItemMutation: UseMutateFunction<
    ApiResponse<Conversation> | ApiResponse<TranslationProject>,
    Error,
    { id: number }
  >;
  deleteItemLoading: boolean;

  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;

  openDeleteDialog: (itemId: number) => void;
  deleteItem: () => void;

  currentMode: "chat" | "translation" | "image" | "home";
}

export function useSidebarItems(): SidebarItems {
  const location = useLocation();

  const getCurrentMode = () => {
    if (location.pathname.includes("/chat")) {
      return "chat";
    }
    if (location.pathname.includes("/translate")) {
      return "translation";
    }
    if (location.pathname.includes("/image")) {
      return "image";
    }
    return "home";
  };

  const currentMode = getCurrentMode();

  const {
    conversations,
    isConversationsLoading,
    refetchConversations,
    createConversationMutation,
    isCreatingConversation,
    updateConversationMutation,
    isUpdatingConversation,
    deleteConversationMutation,
    isDeletingConversation,
    isDeleteDialogOpen: isDeleteDialogOpenConversations,
    setIsDeleteDialogOpen: setIsDeleteDialogOpenConversations,
    openDeleteDialog,
    deleteConversation,
  } = useConversationsItems(currentMode === "chat");
  const {
    projects,
    isProjectsLoading,
    refetchProjects,
    createProjectMutation,
    isCreatingProject,
    updateProjectMutation,
    isUpdatingProject,
    deleteProjectMutation,
    isDeletingProject,
    isDeleteDialogOpen: isDeleteDialogOpenProjects,
    setIsDeleteDialogOpen: setIsDeleteDialogOpenProjects,
    deleteProject,
  } = useTranslationItems(currentMode === "translation");

  if (currentMode === "chat") {
    return {
      items: conversations!,
      itemsIsLoading: isConversationsLoading,
      refetchItems: refetchConversations,
      createItemMutation: createConversationMutation,
      createItemLoading: isCreatingConversation,
      updateItemMutation: updateConversationMutation,
      updateItemLoading: isUpdatingConversation,
      deleteItemMutation: deleteConversationMutation,
      deleteItemLoading: isDeletingConversation,
      isDeleteDialogOpen: isDeleteDialogOpenConversations,
      setIsDeleteDialogOpen: setIsDeleteDialogOpenConversations,
      openDeleteDialog,
      deleteItem: deleteConversation,
      currentMode,
    };
  }

  return {
    items: projects!,
    itemsIsLoading: isProjectsLoading,
    refetchItems: refetchProjects,
    createItemMutation: createProjectMutation,
    createItemLoading: isCreatingProject,
    updateItemMutation: updateProjectMutation,
    updateItemLoading: isUpdatingProject,
    deleteItemMutation: deleteProjectMutation,
    deleteItemLoading: isDeletingProject,
    isDeleteDialogOpen: isDeleteDialogOpenProjects,
    setIsDeleteDialogOpen: setIsDeleteDialogOpenProjects,
    openDeleteDialog,
    deleteItem: deleteProject,
    currentMode,
  };
}

export function useConversationsItems(enabled: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationIdToDelete, setConversationIdToDelete] = useState<
    number | null
  >(null);

  const {
    data: conversations,
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useConversations({ enabled });

  const {
    mutate: createConversationMutation,
    isPending: isCreatingConversation,
  } = useCreateConversation({
    onSuccess({ data: conversation }) {
      navigate(`/conversations/${conversation.id}`);
      refetchConversations();
    },
  });

  const {
    mutate: updateConversationMutation,
    isPending: isUpdatingConversation,
  } = useUpdateConversation({
    onSuccess({ data: conversation }) {
      navigate(`/conversations/${conversation.id}`);
      refetchConversations();
    },
  });

  const {
    mutate: deleteConversationMutation,
    isPending: isDeletingConversation,
  } = useDeleteConversation({
    onSuccess() {
      const deletedConversationId = conversationIdToDelete;
      refetchConversations();
      setIsDeleteDialogOpen(false);
      setConversationIdToDelete(null);
      if (location.pathname === `/conversations/${deletedConversationId}`) {
        navigate("/");
      }
    },
  });

  const openDeleteDialog = (conversationId: number) => {
    setConversationIdToDelete(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const deleteConversation = () => {
    if (!conversationIdToDelete) return;
    deleteConversationMutation({ id: conversationIdToDelete });
  };

  return {
    conversations,
    isConversationsLoading,
    refetchConversations,

    createConversationMutation,
    isCreatingConversation,

    updateConversationMutation,
    isUpdatingConversation,

    deleteConversationMutation,
    isDeletingConversation,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    openDeleteDialog,
    deleteConversation,
  };
}

export function useTranslationItems(enabled: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState<number | null>(
    null,
  );

  const {
    data: projects,
    isLoading: isProjectsLoading,
    refetch: refetchProjects,
  } = useTranslationProjects({ enabled });

  const { mutate: createProjectMutation, isPending: isCreatingProject } =
    useCreateTranslationProject({
      onSuccess({ data: project }) {
        navigate(`/translate-projects/${project.id}`);
        refetchProjects();
      },
    });

  const { mutate: updateProjectMutation, isPending: isUpdatingProject } =
    useUpdateTranslationProject({
      onSuccess({ data: project }) {
        navigate(`/translate-projects/${project.id}`);
        refetchProjects();
      },
    });

  const { mutate: deleteProjectMutation, isPending: isDeletingProject } =
    useDeleteTranslationProject({
      onSuccess() {
        const deletedProjectId = projectIdToDelete;
        refetchProjects();
        setIsDeleteDialogOpen(false);
        setProjectIdToDelete(null);
        if (location.pathname === `/translate-projects/${deletedProjectId}`) {
          navigate("/");
        }
      },
    });

  const openDeleteDialog = (projectId: number) => {
    setProjectIdToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  const deleteProject = () => {
    if (!projectIdToDelete) return;
    deleteProjectMutation({ id: projectIdToDelete });
  };

  return {
    projects,
    isProjectsLoading,
    refetchProjects,

    createProjectMutation,
    isCreatingProject,

    updateProjectMutation,
    isUpdatingProject,

    deleteProjectMutation,
    isDeletingProject,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    openDeleteDialog,
    deleteProject,
  };
}
