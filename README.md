# Citum Hub

A modern repository to quickly find, edit, and create citation styles. Developed in lockstep with the broader Citum ecosystem!

![Citation Style Editor Preview](resources/img/main.png)

### Code Quality

For formatting and linting.

- **Check & Lint**: `bun run lint`
- **Auto-Fix**: `bun run lint:fix`
- **Format**: `bun run format`

## Project Structure

- `client/`: SvelteKit 5 application. Contains both the frontend UI and the Bun-native API logic.
- `server/crates/wasm-bridge`: Rust core engine compiled to WASM, utilized by the Bun API.
- `docker-compose.yml`: Orchestrates the PostgreSQL database.

## Features

- **Style Discovery**: Find and browse existing citation styles.
- **Intent-Based Wizard**: Create new styles by answering simple questions about how you want your citations to look.
- **Personal Library**: Create an account to save and manage your custom styles.
- **Persistence**: Securely store your styles in a PostgreSQL database using `Bun.sql`.
- **GitHub Integration**: Unified OAuth sign-in handled by the Bun API.
- **Live Preview**: High-performance rendering powered by the Rust core engine via WASM.
- **Citum Export**: Download your finished style as a valid Citum JSON/YAML file.

## Technology Stack

- **Frontend**: Svelte 5 (Runes), SvelteKit, TypeScript, Tailwind CSS 4.
- **Backend API**: Bun, Hono, `Bun.sql`.
- **Core Engine**: Rust (`citum-engine`), integrated via WASM.
- **Database**: PostgreSQL.

## Setup & Development

### Prerequisites

- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Bun](https://bun.sh/) (Runtime & Package Manager)
- [Rust & wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (for building the core engine)

### Running the Project

1. **Start the Database**:
   ```bash
   docker-compose up -d
   ```

2. **Build the WASM Core**:
   ```bash
   cd server/crates/wasm-bridge
   wasm-pack build --target nodejs
   ```

3. **Run the Bun API (Backend)**:
   ```bash
   cd client
   bun run dev:api
   ```

4. **Run the SvelteKit App (Frontend)**:
   In a new terminal:
   ```bash
   cd client
   bun run dev
   ```

5. **Populate Styles**:
   In another terminal:
   ```bash
   cd client
   bun run sync-styles
   ```

   The app will be available at `http://localhost:3000`.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0-or-later) - see the [LICENSE](LICENSE) file for details.
