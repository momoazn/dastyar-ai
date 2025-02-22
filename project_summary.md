# Project Analysis: Persian AI Assistant

## Overview

This project is a web application designed to be a Persian AI assistant. It provides three main functionalities: a chat interface powered by a local large language model (Ollama), an image generation tool powered by Stable Diffusion, and a translation feature. Additionally, it includes a Whisper service for audio transcription. The application is built using React, TypeScript, Tailwind CSS and ShadcnUI for the frontend, and Go for the backend.

## Project Structure

The project is structured as follows:

-   **Frontend (React/TypeScript):**
    -   `src/`: Contains the main application code.
        -   `app.tsx`: The main application component, which sets up the layout and manages routing.
        -   `pages/`: Contains the main page components.
            -   `chat.tsx`: Page component for the chat interface.
            -   `image.tsx`: Page component for the image generation interface.
            -   `translation.tsx`: Page component for the translation feature.
        -   `components/`: Contains reusable UI components.
            -   `sidebar.tsx`: Component for the application's sidebar navigation.
            -   `header.tsx`: Component for the application's header.
            -   `message.tsx`: Component for displaying chat messages.
            -   `status.tsx`: Component for displaying connection statuses.
            -   `ui/`: Contains Radix UI components.
        -   `context/`: Contains context providers for managing application state.
            -   `ServiceContext.tsx`: Provides access to the various services.
        -   `hooks/`: Contains custom React hooks.
            -   `useAudioRecording.ts`: Hook for handling audio recording.
            -   `useChat.ts`: Hook for managing chat interactions.
            -   `useImageGeneration.ts`: Hook for managing image generation.
            -   `useModelSelection.ts`: Hook for selecting models.
            -   `usePersistentChat.ts`: Hook for persisting chat history.
        -   `lib/`: Contains utility functions.
            -   `utils.ts`: Utility functions.
        -   `services/`: Contains services for interacting with external APIs.
            -   `ollama.ts`: Service for interacting with the Ollama API.
            -   `stableDiffusion.ts`: Service for interacting with the Stable Diffusion API.
            -   `whisper.ts`: Service for interacting with the Whisper API.
    -   `index.html`: The main HTML file for the application.
    -   `package.json`: Contains project dependencies and scripts.
    -   `vite.config.ts`: Configuration file for Vite.
    -   `tsconfig.json`: Configuration file for TypeScript.
-   **Backend (Go):**
    -   `main.go`: The main Go file that serves the static files and opens the browser.

## Key Components

### Frontend

-   **Pages:** The application is now organized into distinct pages for each major feature (chat, image generation, and translation).
-   **React Components:** The application uses React components to build the user interface. Key components include `Sidebar`, `Header`, `Message`, and various feature-specific components.
-   **Context API:** The `ServiceContext` provides a way to access the various services throughout the application.
-   **Custom Hooks:** The application uses custom hooks to manage state and logic for audio recording, chat, image generation, model selection, and persistent chat.
-   **UI Library:** The application uses Radix UI components for building the user interface.
-   **Styling:** The application uses Tailwind CSS and ShadcnUI for styling, including a dark mode theme that can be toggled by users. The theme preference is persisted in localStorage.

### Backend

-   **Go Server:** The Go backend serves the static files from the `dist` directory and automatically opens the application in the browser.

### Services

-   **Ollama Service:** The `OllamaService` interacts with the Ollama API to provide chat functionality. It allows users to select a model and send chat messages.
-   **Stable Diffusion Service:** The `StableDiffusionService` interacts with the Stable Diffusion API to generate images from text prompts.
-   **Whisper Service:** The `WhisperService` interacts with the Whisper API to transcribe audio to text.

## Data Flow

1.  The user interacts with the frontend through the chat, image generation, or translation interfaces.
2.  The frontend sends requests to the appropriate service (Ollama, Stable Diffusion, or Whisper).
3.  The services interact with their respective APIs.
4.  The APIs return data to the services.
5.  The services return data to the frontend.
6.  The frontend updates the UI based on the data received.

## Intended Functionality

The application is intended to provide a local AI assistant that can:

-   Engage in chat conversations using a local large language model (Ollama).
-   Generate images from text prompts using Stable Diffusion.
-   Provide translation services.
-   Transcribe audio to text using Whisper.

## Technologies Used

-   **Frontend:** React, TypeScript, Tailwind CSS, ShadcnUI, Vite (with dark mode support)
-   **Backend:** Go
-   **Services:** Ollama, Stable Diffusion, Whisper

This analysis provides a comprehensive overview of the project's purpose, structure, key components, data flow, and intended functionality.
