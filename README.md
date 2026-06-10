# BrewMind

BrewMind is a local-first Next.js app for chatting with Ollama models, organizing work into projects called **Brews**, and comparing model suitability with a built-in hardware benchmark flow.

It is designed to feel like a cozy desktop workspace, but it still stays practical:

- Chat with local Ollama models
- Organize chats into Brews/projects
- Switch between light, dark, and high-contrast themes
- Change the app font from the sidebar
- Persist sessions and projects locally in IndexedDB
- Run a browser-side benchmark to help choose a model

## Features

### Chat

- Stream responses from a local Ollama instance
- Support for markdown and LaTeX math
- Image and document attachment support
- Auto-saved chat sessions

### Projects / Brews

- Create new Brews from the sidebar
- Open an existing Brew and view its chats
- Start project-specific chats
- Keep work organized without needing a remote backend

### Appearance

- Light theme
- Dark theme
- Contrast theme with a near-black UI
- Sidebar font selector with multiple font choices

### Benchmark

- Run a client-side benchmark from the workspace
- Compare the current machine against the app’s recommended model guidance

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- IndexedDB via `idb`
- KaTeX for math rendering
- `marked` for markdown rendering
- `lucide-react` for icons

## Prerequisites

- Node.js 18+ recommended
- npm
- Ollama installed and running locally if you want live model chat

If Ollama is not running, BrewMind will still load, but model chat will be unavailable and the app will show the offline state.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build for Production

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

## Ollama Setup

BrewMind talks to Ollama through local API routes. Make sure Ollama is running on the default port:

```text
http://localhost:11434
```

The app checks:

- `GET /api/models` to list available models
- `POST /api/chat` to stream responses from the selected model

If Ollama is installed but no models are available, the app will push you toward the benchmark view.

## Data Storage

BrewMind stores its local data in the browser using IndexedDB:

- Brews / projects
- Chat sessions
- Session-to-brew relationships

That means the app is local-first and does not require a separate database service.

## Project Structure

- `src/app` - App Router layout, global styles, and API routes
- `src/components` - Workspace shell, sidebar, and chat UI
- `src/context` - Theme and appearance state
- `src/utils` - IndexedDB helpers, file parsing, and benchmark logic
- `src/types` - Shared data models

## How The App Works

1. The sidebar lists your recent chats and Brews.
2. You can create a new Brew from the `Your Brews` section.
3. Opening a Brew shows its project view and related chats.
4. Starting a chat sends the session to the local Ollama API route.
5. Responses stream into the chat UI and are persisted locally.

## Notes

- Math expressions are rendered with KaTeX.
- Markdown rendering is handled in the chat component.
- Themes are persisted in local storage and applied at the document root.
- Font selection is also persisted locally and applied globally.

## Development Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## License

No license has been specified yet. Add one if you want to share or redistribute the project.
