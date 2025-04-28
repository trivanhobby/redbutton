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
  - AI-assisted journaling with templates and polishing
  - Auto-save as you type
  - Smooth animations for a modern user experience

- **Calendar & Stats**: Visualize your emotional patterns
  - Calendar view with color-coded emotional states
  - Statistics on emotion frequency and distribution
  - Interactive charts and visualizations

- **Goals & Initiatives**: Set and track personal goals
  - Organized with predefined "Work" and "Life" categories
  - Create custom goals with descriptions
  - Add initiatives (sub-tasks) to each goal
  - Track progress with check-ins
  - Mark goals and initiatives as complete
  - Sleek, animated UI for adding and managing goals

- **Settings**: Customize your experience
  - Add custom emotions with emojis
  - Toggle between light and dark themes
  - Enable/disable AI suggestions
  - Set your OpenAI API key for personalized suggestions

## AI-Powered Journaling

RedButton comes with two AI-powered features to enhance your journaling experience:

1. **Propose**: Generates a personalized journal template with guided prompts based on:
   - Your recorded emotions for the day
   - Previous journal entries for context
   - Customized questions to help you reflect meaningfully

2. **Polish**: Helps improve your journal entries by:
   - Enhancing readability and flow
   - Fixing grammar and spelling
   - Maintaining your unique voice and insights
   - Preserving all your personal thoughts and feelings

These features are designed to make journaling more accessible and rewarding, especially when you're not sure where to start or want to improve your writing.

## User Interface

- **Modern Dark Theme**: Easy on the eyes with a dark interface
- **Responsive Design**: Works on various screen sizes
- **Smooth Animations**: Polished interactions and transitions using Framer Motion
- **Tailwind CSS**: Clean, consistent styling throughout the application
- **Electron Integration**: System tray menu for quick access to emotion tracking

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

3. Set up environment variables (optional):
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     REACT_APP_OPENAI_API_KEY=your_api_key_here
     ```
   - The application will automatically use this API key if you haven't set one in the Settings page

4. Start the development server:
   ```
   npm run electron:dev
   ```

5. To build the application:
   ```
   npm run electron:build
   ```

## Setting Up the OpenAI API Key

You have three options for setting up your OpenAI API key:

1. **Using Environment Variables (recommended for development)**:
   - Create a `.env.local` file in the project root
   - Add your API key: `REACT_APP_OPENAI_API_KEY=your_api_key_here`
   - This method keeps your key out of the code and git history

2. **Through the Settings Page**:
   - Navigate to the Settings page in the app
   - Enable AI Assistant if it's not already enabled
   - Paste your OpenAI API key in the input field and click Save
   - Your key will be stored securely in the browser's local storage

3. **During Build Time (for production)**:
   - Add the environment variable to your build environment
   - This method is suitable for CI/CD pipelines

Note: For security, API keys are never sent to any server and are only stored locally on your device.

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **UI Framework**: Custom components with Framer Motion animations
- **AI Integration**: OpenAI API (GPT-3.5 Turbo and GPT-4o mini models)
- **Desktop Application**: Electron with menu bar integration
- **Data Storage**: Local storage (JSON)
- **Animations**: Framer Motion with shared animation variants
- **Charting**: Chart.js

## Acknowledgments

- This project was inspired by the need for mindful productivity tools
- Special thanks to the research on emotional intelligence and its impact on decision-making

## License

This project is licensed under the ISC License 
