# AI Storyteller

This project aims to create an AI-powered storyteller application. It features a frontend built with Next.js and a backend for handling data and AI integrations, such as text-to-speech generation.

## Features:

*   **Story Display:** Presents stories from various epics (e.g., Panchatantra).
*   **On-Demand Audio Generation:** Integrates with text-to-speech services (currently ElevenLabs) to generate audio for stories on user request.
*   **Modular Architecture:** Separated frontend and backend components for better maintainability and scalability.

## Getting Started:

### Prerequisites:

*   Node.js (LTS version recommended)
*   npm or Yarn
*   Git

### Installation:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bharadwaj-mahablesh/ai-storyteller.git
    cd ai-storyteller
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    # Create a .env file with your ElevenLabs API key:
    # ELEVENLABS_API_KEY="YOUR_API_KEY_HERE"
    npm start
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

## Usage:

*   Once both the backend and frontend servers are running, open your browser and navigate to `http://localhost:3000` (or the port your frontend is running on).
*   Browse through the stories. Click on a story to view its full text and then use the "Generate Audio" button to listen to the story.

## Project Structure:

*   `backend/`: Contains the Node.js backend application.
*   `frontend/`: Contains the Next.js frontend application.
*   `audio.mp3`: Placeholder for generated audio files.
*   `Book 1_Mitra-bheda_The Separation of Friends.txt`: Example story content.

