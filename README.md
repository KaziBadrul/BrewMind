<img width="211" height="60" alt="image" src="https://github.com/user-attachments/assets/72328c17-cc6a-44a6-b9bf-52e46985d52c" />

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

  <img width="1918" height="963" alt="image" src="https://github.com/user-attachments/assets/8a2b309f-fe8b-4056-8aec-8372b2e54ce8" /> <br/>
  <img width="1919" height="961" alt="image" src="https://github.com/user-attachments/assets/078f9c2d-df44-4c95-bff8-3fa69295a9bb" />



### Projects / Brews

- Create new Brews from the sidebar
- Open an existing Brew and view its chats
- Start project-specific chats
- Keep work organized without needing a remote backend

  <img width="1919" height="962" alt="image" src="https://github.com/user-attachments/assets/78dae84e-a311-47a3-9b9e-afd760019294" />


### Appearance

- Light theme
- Dark theme
- Contrast theme with a near-black UI
- Sidebar font selector with multiple font choices
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/9e1f8a40-59fa-4e25-adc8-e5c3dda66e30" /> <br/>

<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/abb1a2f1-eb12-4c6c-8250-8166a5dccb15" /> <br/>
<img width="287" height="241" alt="image" src="https://github.com/user-attachments/assets/8c6e8db6-1db5-47c3-bb83-60603619a7a5" />


### Benchmark

- Run a client-side benchmark from the workspace
- Compare the current machine against the app’s recommended model guidance

  <img width="1919" height="958" alt="image" src="https://github.com/user-attachments/assets/0fba64cd-160e-486c-b472-25a9fa18d4ac" />


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
