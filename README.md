# 🍕 Pizza Town

A full-stack pizza ordering application built with React, Express, Prisma, and PostgreSQL.

## 🚀 Quick Start (Docker)

To run the entire application (frontend, backend, and database) with a single command:

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd Pizza-Town
    ```

2.  **Set up environment variables**:
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    *(Note: On Windows PowerShell, use `copy .env.example .env`)*

3.  **Start the services**:
    ```bash
    docker compose up -d
    ```

4.  **Access the app**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:5000/api/status](http://localhost:5000/api/status)

## 🛠️ Management Commands

- **Stop the app**: `docker compose down`
- **View logs**: `docker compose logs -f`
- **Rebuild after changes**: `docker compose up --build -d`
- **Inspect database**: `docker compose exec backend npx prisma studio` (then open [http://localhost:5555](http://localhost:5555))

## 🤝 Sharing with Friends

Since the project is containerized, your friends can run it exactly as you do!

1.  **Push your changes**:
    ```bash
    git add .
    git commit -m "Setup Docker Compose"
    git push
    ```
    *(Note: `.env` is gitignored, so they will need to create their own from `.env.example`)*

2.  **Their setup**: They just need to follow the **Quick Start** instructions above.

