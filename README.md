
# Azkar App

A mobile-first web application for daily Islamic remembrances (Azkar), built with React, Vite, and Tailwind CSS.

## Features
*   **Daily Azkar:** Morning, Evening, Sleep, and more.
*   **Audio Playback:** High-quality AI Text-to-Speech (requires API Key).
*   **Offline First:** Works without internet after initial load.
*   **Utilities:** Tasbeeh Counter, Prayer Times, Qibla Compass, Hijri Calendar.
*   **Customization:** Themes, Fonts, Dark Mode.

## Development

This project uses **Vite** for a fast development experience.

### Prerequisites
*   Node.js (v18+)
*   npm

### Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Open `http://localhost:3000` (or the port shown in your terminal).

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Project Structure
*   `components/`: React UI components.
*   `context/`: Global state management.
*   `data/`: Static content and storage logic.
*   `services/`: Logic for Audio, Haptics, Notifications, etc.
