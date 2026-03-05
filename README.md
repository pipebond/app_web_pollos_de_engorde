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
