# Instagram Clone

This is a full-stack Instagram clone application with a React frontend and a Node.js (Express) backend, utilizing PostgreSQL as its database.

## Table of Contents
- [Project Setup](#project-setup)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Architecture](#architecture)
- [Functional Flow](#functional-flow)
- [How to Use](#how-to-use)
  - [Register and Login](#register-and-login)
  - [Key Features](#key-features)
- [Improvements](#improvements)
- [Team Members](#team-members)

## Project Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.18.1 or later)
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

## Architecture

The application follows a client-server architecture:

-   **Frontend (Client):** Developed with React, it provides the user interface and interacts with the backend API to fetch and send data.
-   **Backend (Server):** Built with Node.js and Express.js, it handles API requests, user authentication, data management, and serves static files (e.g., uploaded media).
-   **Database:** PostgreSQL is used as the relational database to store user information, posts, comments, likes, and follow relationships.

Communication between the frontend and backend occurs via RESTful API calls.

## Functional Flow

### Authentication
-   Users register with a unique username/email and password.
-   Upon successful login, a JSON Web Token (JWT) is issued and stored on the client-side.
-   This JWT is sent with subsequent requests to authenticate the user and authorize access to protected routes.

### Posting Content
-   Authenticated users can create new posts, including multiple images/videos and a caption.
-   Media files are uploaded to the server and stored on the filesystem, with their paths saved in the database.
-   Posts from users the current user follows (and the user's own posts) appear on their timeline.

### Following Users
-   **Public Profiles:** Following a public profile automatically establishes a "followed" relationship.
-   **Private Profiles:** Following a private profile sends a follow request. The owner of the private profile must explicitly accept the request for the follow relationship to be established. Users can manage their follow requests from a dedicated page.

### Interactions (Likes & Comments)
-   Users can like posts and add comments.
-   These actions are recorded in the database.
-   Users can edit or delete their own comments.

### Profile Management
-   Users can view their own profile and edit details like name, bio, and profile picture.
-   They can also view other users' profiles, with visibility of posts and follower/following lists depending on the profile's privacy setting and their follow status.

## How to Use

### Register and Login
1.  **Register:** Navigate to `http://localhost:3000/register` and create a new account by providing a username, email, password, and full name.
2.  **Login:** Navigate to `http://localhost:3000/login` and use your registered credentials (username/email and password).

### Key Features
Once logged in, you can:
-   **Timeline View:** See a chronological feed of posts from users you follow, including your own posts.
-   **Create Posts:** Upload up to 20 images/videos per post with a caption.
-   **Edit/Delete Posts & Comments:** Manage your own content, including updating post captions, removing media from posts, deleting entire posts, and editing/deleting your comments.
-   **Follow/Unfollow:** Connect with other users. For private profiles, follow requests must be accepted.
-   **Search Users:** Find other users by their name or username.
-   **Block/Unblock:** Control who can interact with your profile and content.
-   **Profile Management:** View and edit your profile details, including your profile picture.
-   **Follow Request Management:** Accept or reject follow requests if you have a private profile.
