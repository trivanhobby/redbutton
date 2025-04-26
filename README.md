# RedButton

A minimalist assistant application designed to help users consciously react to their inner states by nudging them toward actions aligned with their personal goals. RedButton aims to reduce procrastination, overcome anxiety and uncertainty, and promote mindful action using a simple two-button interface: Red (stuck) and Green (resourceful).

## Features

- **Red Button Flow**: For when you're feeling anxious, overwhelmed, stressed, or exhausted
  - Select your current negative emotion
  - Specify available time
  - Receive AI-generated action suggestions based on your goals and journal context
  - Choose an action and track your progress

- **Green Button Flow**: For when you're feeling motivated, happy, grateful, or inspired
  - Select your current positive emotion
  - Log moments of motivation or inspiration
  - Set next steps to leverage your positive state

- **Journal**: Keep track of your emotional states and reflections
  - Daily journal entries tied to your emotions and actions
  - Review past entries to track patterns

- **Calendar & Stats**: Visualize your emotional patterns
  - Calendar view with color-coded emotional states
  - Statistics on emotion frequency and distribution

- **Goals**: Set and track personal goals
  - Goals provide context for AI suggestions
  - Mark goals as complete as you achieve them

- **Settings**: Customize your experience
  - Add custom emotions with emojis
  - Enable/disable AI suggestions
  - Set your OpenAI API key for personalized suggestions

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key (optional, for AI suggestions)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/redbutton.git
   cd redbutton
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run electron:dev
   ```

4. To build the application:
   ```
   npm run electron:build
   ```

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **UI Framework**: Custom components
- **AI Integration**: OpenAI API
- **Desktop Application**: Electron
- **Data Storage**: Local storage (JSON)
- **Animations**: Framer Motion
- **Charting**: Chart.js

## Project Structure

- `/src`: Main source code directory
  - `/components`: React components
  - `/context`: State management
  - `/pages`: Application pages
  - `/utils`: Utility functions
- `/electron`: Electron-specific code
- `/public`: Static assets

## Acknowledgments

- This project was inspired by the need for mindful productivity tools
- Special thanks to the research on emotional intelligence and its impact on decision-making

## License

This project is licensed under the ISC License 
