# Chicken Fattening Web App

This project is a web application for managing the fattening of chickens, built with the MERN stack (MySQL, Express, React, Node.js).

## Project Structure

- `/client`: Contains the React frontend application.
- `/server`: Contains the Express backend application.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm
- MySQL

### Installation and Setup

1.  **Clone the repository:**

    ```sh
    git clone <repository-url>
    cd app_web_pollos_de_engorde
    ```

2.  **Set up the backend:**
    - Navigate to the `server` directory:
      ```sh
      cd server
      ```
    - Install dependencies:
      ```sh
      npm install
      ```
    - Create a `.env` file and add your MySQL database credentials:
      ```
      DB_HOST=localhost
      DB_USER=your_username
      DB_PASSWORD=your_password
      DB_NAME=your_database_name
      ```
    - Start the backend server:
      ```sh
      npm run dev
      ```
      The server will be running on `http://localhost:3001`.

3.  **Set up the frontend:**
    - Open a new terminal and navigate to the `client` directory:
      ```sh
      cd client
      ```
    - Install dependencies:
      ```sh
      npm install
      ```
    - Start the frontend development server:
      ```sh
      npm start
      ```
      The React app will open in your browser at `http://localhost:3000`.

## Available Scripts

### Inicio Rapido En Windows (PowerShell)

- Iniciar frontend y backend en limpio (libera 3000/3001, arranca ambos y guarda logs):
  ```powershell
  .\scripts\dev-start.ps1
  ```
- Detener servicios (usa PID guardados y libera 3000/3001):
  ```powershell
  .\scripts\dev-stop.ps1
  ```
- Logs de arranque:
  - `.runtime/backend.log`
  - `.runtime/frontend.log`

### Server

- `npm start`: Starts the server in production mode.
- `npm run dev`: Starts the server in development mode with `nodemon`.

### Client

- `npm start`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm test`: Runs the test suite.
- `npm run eject`: Ejects the app from `create-react-app`.

## Production Deployment

This repository is ready for hosting, but you must set production environment variables.

### 1. Environment Variables

Use these templates:

- `server/.env.example`
- `client/.env.example`

Minimum required in production:

- Backend (`server/.env`):
  - `NODE_ENV=production`
  - `PORT`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN`
- Frontend (`client/.env.production`):
  - `REACT_APP_API_URL`

### 2. Backend Healthcheck

The API exposes:

- `GET /health`

Use it in hosting health checks.

### 3. Recommended Hosting Split

- Backend: Render/Railway/Fly.io/VPS as a Node service.
- Frontend: Netlify/Vercel/Render Static Site serving `client/build`.

If backend and frontend are deployed under different domains, `REACT_APP_API_URL` and `CLIENT_ORIGIN` are mandatory.

### 4. One-Click Render Blueprint (Recommended)

This repo includes `render.yaml` in the root. You can deploy both services from Render using Blueprint:

1. In Render, select **New +** -> **Blueprint**.
1. Connect this repository.
1. Render will read `render.yaml` and propose:
  - `pollos-backend` (Node Web Service)
  - `pollos-frontend` (Static Site)
1. Set secret env vars (`DB_*`, `JWT_SECRET`, `CLIENT_ORIGIN`, `REACT_APP_API_URL`).
1. Deploy.

### 5. Build and Run Commands

- Backend install: `npm --prefix server install`
- Backend start: `npm --prefix server start`
- Frontend install: `npm --prefix client install`
- Frontend build: `npm --prefix client run build`

### 6. Render Example (Manual)

1. Create a **Web Service** from this repo for backend.
1. Set root directory to `server`.
1. Build command: `npm install`
1. Start command: `npm start`
1. Add backend env vars from `server/.env.example`.
1. Create a **Static Site** from this repo for frontend.
1. Set root directory to `client`.
1. Build command: `npm run build`
1. Publish directory: `build`
1. Add `REACT_APP_API_URL` with backend public URL.
1. Set backend `CLIENT_ORIGIN` to frontend public URL.

### 7. Final Pre-Go-Live Checklist

- `JWT_SECRET` is strong and private.
- Database user has only required permissions.
- CORS is restricted to frontend domain.
- Backend starts on hosting `PORT` without alternate ports in production.
- Frontend can login and call backend without mixed-content errors.
- `GET /health` returns `200`.
