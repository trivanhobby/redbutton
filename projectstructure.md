# RedButton Project Structure

This document outlines the structure and organization of the RedButton application, a minimalist assistant designed to help users react to their inner states and promote mindful action.

## Technology Stack

- **Frontend Framework**: React.js with TypeScript
- **CSS Framework**: TailwindCSS
- **Desktop Application Framework**: Electron
- **State Management**: React Context API
- **Data Storage**: LocalStorage (JSON)
- **Animations**: Framer Motion with reusable animation variants
- **Charts & Visualization**: Chart.js
- **AI Integration**: OpenAI API (GPT-3.5 Turbo and GPT-4o mini)
- **Theming**: Dark mode with Tailwind

## Directory Structure

### Root Level

- `package.json`: NPM package configuration
- `package-lock.json`: NPM dependency lock file
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.js`: TailwindCSS configuration with custom colors for dark theme
- `postcss.config.js`: PostCSS configuration for processing CSS
- `requirements.md`: Project requirements and specifications
- `README.md`: Project documentation
- `projectstructure.md`: This file, documenting the project structure
- `.gitignore`: Git ignore configuration
- `LICENSE`: Project license file

### Electron Directory

- `electron/main.ts`: Main Electron process file that creates the application window and menu bar widget
- `electron/preload.ts`: Preload script for exposing IPC methods to the renderer using contextBridge
- `electron/tsconfig.json`: TypeScript configuration specific for Electron

### Public Directory

- `public/index.html`: HTML template for the application
- `public/manifest.json`: Web app manifest (for PWA support)
- `public/favicon.ico`: Application favicon (placeholder)
- `public/logo192.png`: 192x192 application logo (placeholder)
- `public/logo512.png`: 512x512 application logo (placeholder)
- `public/menubar-icon.png`: Menu bar icon for the system tray
- `public/assets/menubar-icon.svg`: SVG source for the menu bar icon

### Source Directory (src/)

#### Main Application Files

- `src/index.tsx`: Entry point for the React application
- `src/App.tsx`: Main App component with routing and SuggestionDialog integration
- `src/index.css`: Global CSS with TailwindCSS imports and dark theme setup

#### Types

- `src/types/electron.d.ts`: TypeScript definitions for Electron APIs

#### Context

- `src/context/DataContext.tsx`: Context provider for application data, including emotions, journal entries, goals, initiatives, and check-ins

#### Utils

- `src/utils/ai.ts`: Utility functions for OpenAI API integration and suggestion generation
- `src/utils/animations.ts`: Shared animation variants for Framer Motion used across components

#### Components

- `src/components/layouts/MainLayout.tsx`: Main layout component with navigation and footer
- `src/components/widgets/MenuBarWidget.tsx`: Menu bar widget component - handles main red/green button flow
- `src/components/widgets/ActionSuggestions.tsx`: Widget for displaying action suggestions
- `src/components/SuggestionDialog.tsx`: Modal component that listens for emotion-selected events and displays suggestions
- `src/components/common/EmotionPicker.tsx`: Reusable component for selecting emotions
- `src/components/common/TimeSelector.tsx`: Reusable component for selecting time

#### Pages

- `src/pages/JournalPage.tsx`: Journal page for viewing and editing journal entries with smooth animations
- `src/pages/CalendarPage.tsx`: Calendar and statistics page with emotion visualization
- `src/pages/GoalsPage.tsx`: Goals management page with Work and Life categories, initiatives, and check-ins
- `src/pages/SettingsPage.tsx`: Settings and customization page with theme toggle
- `src/pages/WidgetPage.tsx`: Widget page for the menu bar popup

#### Styles

- `src/styles/MenuBarWidget.css`: Styles for the menu bar widget

## Complete File List

```
./electron/main.ts
./electron/preload.ts
./electron/tsconfig.json
./package.json
./package-lock.json
./postcss.config.js
./projectstructure.md
./public/favicon.ico
./public/index.html
./public/logo192.png
./public/logo512.png
./public/manifest.json
./public/menubar-icon.png
./public/assets/menubar-icon.svg
./README.md
./requirements.md
./src/App.tsx
./src/components/common/EmotionPicker.tsx
./src/components/common/TimeSelector.tsx
./src/components/layouts/MainLayout.tsx
./src/components/SuggestionDialog.tsx
./src/components/widgets/ActionSuggestions.tsx
./src/components/widgets/MenuBarWidget.tsx
./src/context/DataContext.tsx
./src/index.css
./src/index.tsx
./src/pages/CalendarPage.tsx
./src/pages/GoalsPage.tsx
./src/pages/JournalPage.tsx
./src/pages/SettingsPage.tsx
./src/pages/WidgetPage.tsx
./src/styles/MenuBarWidget.css
./src/types/electron.d.ts
./src/utils/ai.ts
./src/utils/animations.ts
./tailwind.config.js
./tsconfig.json
```

## Data Flow

1. **State Management**: The application uses React Context API to manage global state through `DataContext`
2. **Persistence**: Data is stored in the browser's LocalStorage and loaded on application start
3. **User Interactions**: 
   - Red Button Flow: Captures negative emotions and generates suggestions
   - Green Button Flow: Captures positive emotions and next actions
   - Journal: Records daily reflections
   - Goals: Manages personal goals, initiatives, and check-ins that provide context for suggestions
4. **AI Integration**: When enabled, the application uses OpenAI to generate contextual suggestions based on the user's emotional state, goals, and journal entries

## Goals System Structure

The application uses a hierarchical structure for goal management:

1. **Goals**: Top-level objectives (including reserved "Work" and "Life" categories)
   - Properties: text, description, completion status, fixed status
   
2. **Initiatives**: Sub-tasks associated with a specific goal
   - Properties: text, completion status, associated goal
   
3. **Check-ins**: Progress notes that can be attached to either goals or initiatives
   - Properties: content, timestamp, associated entity (goal or initiative)

This structure provides flexibility for users to organize their objectives at different levels of granularity.

## Animation System

The application uses a shared animation system based on Framer Motion:

1. **Animation Variants**: Reusable animation configurations defined in `utils/animations.ts`
   - fadeInVariants: Simple fade in animations
   - listItemVariants: Staggered animations for list items
   - accordionVariants: Expand/collapse animations for accordions
   - containerVariants: Parent containers with staggered children
   
2. **Implementation**: Components use these variants consistently throughout the app
   - Pages fade in when navigating
   - Lists items animate with staggered entrances
   - Accordions smoothly expand and collapse
   - Buttons provide tactile feedback with scale animations

This approach ensures consistent animations across the application while keeping the code DRY.

## Application Communication Flow

1. **Menu Bar Widget**:
   - User selects an emotion and time from the system tray menu widget
   - Widget calls `window.electron.selectEmotion()` to send data to the main process
   - Main process forwards the event to the main window via `emotion-selected` event

2. **Main Application**:
   - The `SuggestionDialog` component listens for `emotion-selected` events using `window.electron?.onEmotionSelected()`
   - When an event is received, it displays a modal with AI-generated suggestions
   - The user can choose a suggestion, request more, navigate to the journal, or open the main app

3. **Navigation**:
   - Clicking "Open App" in the widget or suggestion dialog calls `window.electron.showMainWindow()`
   - The main process brings the main window to the front
   - Navigation within the app is handled by React Router

## Build Process

1. **Development**: `npm run electron:dev` runs the React application and Electron in development mode
2. **Production Build**: `npm run electron:build` builds the React application and packages it with Electron
3. **TypeScript Compilation**: React components are compiled during the build process, and Electron TypeScript files are compiled separately
