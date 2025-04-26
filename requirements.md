# RedButton Project — Requirements & Implementation Status

---

## Overview

**RedButton** is a minimalist assistant application designed to help users consciously react to their inner states by nudging them toward actions aligned with their personal goals.  
The goal is to reduce procrastination, overcome anxiety and uncertainty, and promote mindful action using a simple two-button interface: Red (stuck) and Green (resourceful).

---

## UX Flows

### 1. Red Button Flow
**Trigger:** User feels anxious, overwhelmed, stressed, or exhausted.  
**Flow:**
- User clicks the "Red" button
- Selects an emotion (editable list)
- Specifies available time
- Receives 1–3 AI-generated action suggestions (based on goals and journaling context)
- Can either pick an action, ask for another suggestion, or log the result

**Status: ✅ Implemented**
- MenuBarWidget component handles emotion selection and time input
- SuggestionDialog receives emotion data and displays AI-generated suggestions
- User can request more suggestions, navigate to journal, or open the main app

### 2. Green Button Flow
**Trigger:** User feels motivated, happy, grateful, or inspired.  
**Flow:**
- User clicks the "Green" button
- Selects a positive emotion (editable list)
- Optionally logs a moment of motivation or initiates a next step
- Positive emotion and actions are recorded

**Status: ✅ Implemented**
- MenuBarWidget component handles positive emotion selection
- User can select from three action types: celebrate, journal, or plan
- SuggestionDialog receives the emotion data and provides appropriate suggestions

### 3. Calendar & Journal Flow
**Flow:**
- Calendar view shows dots or highlights for each day based on logged emotions
- Clicking a day opens the journal entries
- Each entry links back to actions/emotions captured via Red or Green button
- Statistics and trends are displayed (monthly breakdowns)

**Status: ✅ Implemented**
- CalendarPage component displays a calendar with emotion indicators
- JournalPage allows viewing and editing entries
- Emotions and actions are linked to journal entries

---

## Screens & Components

### WIDGET: System Tray Menu (MenuBarWidget)

#### Feature: Red Button
**Feature Description:**  
Displays a set of selectable negative emotions and available time input, then triggers action suggestions.
*Linked to*: Red Button Flow

**Status: ✅ Implemented**
- MenuBarWidget component handles the Red button flow
- TimePicker component allows selecting available time
- IPC communication sends selected emotion to main window

#### Feature: Green Button
**Feature Description:**  
Displays a set of positive emotions for logging or celebrating progress.
*Linked to*: Green Button Flow

**Status: ✅ Implemented**
- MenuBarWidget component handles the Green button flow
- Action selection for positive emotions
- IPC communication sends selected emotion to main window

#### Feature: Action Suggestions (SuggestionDialog)
**Feature Description:**  
Modal component that displays AI-generated suggestions based on selected emotions.
*Linked to*: Red/Green Button Flows

**Status: ✅ Implemented**
- SuggestionDialog listens for emotion-selected events
- ActionSuggestions component displays the suggestions
- Buttons for requesting more suggestions, opening the main app, or journaling

---

### Screen: Journal

#### Feature: Daily Journal Entry
**Feature Description:**  
Allows editing today's journal entry; previous days are read-only.
*Linked to*: Journal Flow

**Status: ✅ Implemented**
- JournalPage component handles viewing and editing entries
- Today's entry is editable, past entries are read-only
- Emotions are displayed with the journal entry

#### Feature: Emotion Logging
**Feature Description:**  
Displays a timeline of emotions and related actions for each day.
*Linked to*: Red/Green Button Flows

**Status: ✅ Implemented**
- Emotions are displayed with each journal entry
- Journal entries can be created from the SuggestionDialog

---

### Screen: Calendar & Stats

#### Feature: Calendar View
**Feature Description:**  
Shows an interactive calendar where each day is marked with Red/Green dots based on emotions logged.
Hovering or clicking reveals the day's summary.
Journal entries are marked as blue dots.
Use some minimalistic calendar component. 
*Linked to*: Journal Flow, Stats

**Status: ✅ Implemented**
- CalendarPage component displays dates with emotion indicators
- Click on a date to view the corresponding journal entry

#### Feature: Stats Panel
**Feature Description:**  
Displays charts (bar graphs, line trends) summarizing emotions, actions, and usage frequency.
*Linked to*: Emotion Logging

**Status: ✅ Implemented**
- Chart.js integration for visualization
- Statistics on emotion frequency

---

### Screen: Goals

#### Feature: Editable Goals
**Feature Description:**  
Markdown-based editable personal goals list.  
Goals are injected into LLM prompts to create context-aware suggestions.
*Linked to*: LLM Advice Logic

**Status: ✅ Implemented**
- GoalsPage component for managing goals
- Goals are used in AI suggestion generation
- Active and completed goals are tracked

---

### Screen: Settings

#### Feature: Emotion Editor
**Feature Description:**  
Allows customizing the list of emotions for both Red and Green buttons.
*Linked to*: Red/Green Button Flows

**Status: ✅ Implemented**
- SettingsPage allows adding/removing emotions
- Custom emotions appear in the Red/Green button flows
- Toggle for enabling/disabling custom emotions

#### Feature: AI Settings
**Feature Description:**  
Configuration for the AI integration, including API key.
*Linked to*: LLM Advice Logic

**Status: ✅ Implemented**
- OpenAI API key configuration
- Toggle for enabling/disabling AI suggestions

---

## Tech Implementation

- **Frontend Stack**: ReactJS + TypeScript + TailwindCSS
- **Desktop Application**: Electron with system tray integration
- **State Management**: React Context API (DataContext)
- **Data Storage**: LocalStorage with JSON serialization
- **Communication**: IPC between renderer and main process
- **AI Integration**: OpenAI API for generating contextual suggestions
- **UI Components**: Custom components with Framer Motion for animations

## Communication Flow

1. **Menu Bar Widget → Main App**:
   - User selects emotion and time in the system tray menu
   - Data is sent via IPC from renderer to main process
   - Main process forwards to main window

2. **Main App → Suggestion Dialog**:
   - SuggestionDialog listens for emotion-selected events
   - Displays suggestions based on selected emotion and context
   - User can navigate to journal, request more suggestions, or open main app

3. **Data Persistence**:
   - All data is stored in localStorage through DataContext
   - Emotions, journal entries, goals, and settings are persisted
   - Data is loaded on application start
