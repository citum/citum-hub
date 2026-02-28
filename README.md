# Citum Hub

A modern repository to quickly find, edit, and create citation styles. Developed in lockstep with the broader Citum ecosystem!

![Citation Style Editor Preview](resources/img/main.png)

## Project Structure

- `client/`: SvelteKit 5 application. Contains both the frontend UI and the backend API logic.
- `docker-compose.yml`: Orchestrates the database and the Citum preview engine.

## Features

- **Style Discovery**: Find and browse existing citation styles.
- **Intent-Based Wizard**: Create new styles by answering simple questions about how you want your citations to look.
- **Personal Library**: Create an account to save and manage your custom styles.
- **Persistence**: Securely store your styles in a PostgreSQL database.
- **GitHub Integration**: Sign in with your GitHub account.
- **Live Preview**: Real-time rendering of citations and bibliographies powered by `citum-server`.
- **Citum Export**: Download your finished style as a valid Citum JSON/YAML file.

## Design Philosophy

The editor prioritizes **Visual Discovery**. Most users are looking to tweak an existing style. The Landing Page focuses on search and trending styles, with the **Creation Wizard** serving as a "Start from Scratch" option for advanced needs.

The interface uses a clean, premium "Paper" aesthetic for previews, providing an academic context for the design decisions.

## Technology Stack

- **Fullstack**: Svelte 5, SvelteKit, TypeScript, Tailwind CSS 4.
- **Engine**: Citum-Server (Rust), integrated as a sidecar.
- **Database**: PostgreSQL for persistent storage.
- **Authentication**: GitHub OAuth with JWT.

## Setup & Development

### Prerequisites

- [Docker](https://www.docker.com/)
- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/)

### Environment Configuration

Create a `.env` file in the `client/` directory with the following:

```bash
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
JWT_SECRET=your_random_secret
DATABASE_URL=postgresql://postgres:password@localhost:5432/stylehub
REDIRECT_URL=http://localhost:5173/api/auth/github/callback
CITUM_URL=http://localhost:3001
```

### Running the Project

1. **Start the Services**:
   From the root directory, start the database and the preview engine:
   ```bash
   docker-compose up -d
   ```

2. **Run the Application**:
   ```bash
   cd client
   bun install
   bun dev
   ```

   The app will be available at `http://localhost:5173`.
