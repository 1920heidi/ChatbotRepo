# Chatbot Frontend

React + Vite frontend for the Public Service Assistant chat experience.

## Capabilities

1. Floating chatbot launcher and expandable chat window.
2. Branded header with online status indicator.
3. User and assistant message bubbles with timestamps.
4. Typing indicator to simulate assistant response activity.
5. File attachment picker with a 10 MB size limit and remove action.
6. Basic rule-based assistant replies for job, contact, and tender prompts.
7. Responsive mobile layout for small screens.

## Prerequisites

1. Node.js LTS release.
2. npm (comes with Node.js).

## Run Locally

1. Open a terminal in the project root.
2. Install dependencies.

	npm install

3. Start the development server.

	npm run dev

4. Open the URL printed in the terminal (normally http://localhost:5173).

## Build and Preview

1. Create a production build.

	npm run build

2. Preview the production build locally.

	npm run preview

## Available Scripts

1. npm run dev: Start Vite development server.
2. npm run build: Build optimized production assets.
3. npm run preview: Serve the production build locally.
4. npm run lint: Run ESLint checks.

## Troubleshooting

1. Port already in use:
Start dev server on another port.

	npm run dev -- --port 5174

2. Dependencies fail to install:
Delete node_modules and lockfile, then reinstall.

	rm -rf node_modules package-lock.json && npm install

3. Logo not loading:
Confirm public/psclogo.png exists and the path is /psclogo.png.

## Gold Highlight Styling

Gold accents are defined in [src/App.css](src/App.css).

1. Primary token: --psc-gold: #f2a900
2. Secondary token: --psc-gold-dark: #d98f00

Main usage areas:

1. Chatbot frame and header borders.
2. Subtitle and status accents.
3. User message bubble gradient and border.
4. Input focus and send button accents.
5. Footer and launcher highlights.
