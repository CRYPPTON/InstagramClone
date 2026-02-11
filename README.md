# Instagram Clone

This is a full-stack Instagram clone application with a React frontend and a Node.js (Express) backend.

## Table of Contents
- [Project Setup](#project-setup)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [How to Use](#how-to-use)
  - [Register and Login](#register-and-login)
  - [Features](#features)

## Project Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- [PostgreSQL](https://www.postgresql.org/)

### Database Setup
1.  **Start your PostgreSQL server.**
2.  **Create a new database:**
    ```sql
    CREATE DATABASE instagram_clone_db;
    ```
3.  **Configure connection:** The backend connects to the database using the following credentials (from `backend/init-db.js`):
    -   **User:** `user`
    -   **Password:** `password`
    -   **Host:** `localhost`
    -   **Port:** `5432`
    -   **Database:** `instagram_clone_db`
    Ensure you have a PostgreSQL user with these credentials or update the connection string in `backend/init-db.js` and `backend/routes/*.js` files.
4.  **Initialize the database schema:**
    Navigate to the `backend` directory and run:
    ```bash
    node init-db.js
    ```
    This will create all the necessary tables.

### Backend Setup
1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the backend server:**
    ```bash
    node index.js
    ```
    The server will run on `http://localhost:3001`.

### Frontend Setup
1.  **Open a new terminal.**
2.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The application will be accessible at `http://localhost:3000`.

## How to Use

### Register and Login
1.  **Register:** Navigate to `http://localhost:3000/register` and create a new account.
2.  **Login:** Navigate to `http://localhost:3000/login` and use your registered credentials.

### Features
Once logged in, you can:
- View a timeline of posts from users you follow.
- Create new posts with images/videos and captions.
- Edit and delete your own posts and comments.
- Follow and unfollow other users.
- Search for users.
- Block and unblock users.
- View user profiles, including their posts, followers, and following counts (posts are hidden for private profiles you don't follow).
- Manage follow requests if your profile is private.
- Edit your profile details, including your name, bio, and profile picture.
