---
description: How to deploy the application using ngrok
---

This workflow guides you through exposing your local blockchain explorer to the internet using ngrok.

### Prerequisites
- Ensure `ngrok` is installed and authenticated.
- Ensure your API (port 3000) and Frontend (port 5173) are running locally.

### Step 1: Expose the API
1. Open a new terminal.
2. Run the following command to expose your backend API:
   ```bash
   ngrok http 3000
   ```
3. Copy the **Forwarding URL** that looks like `https://<random-id>.ngrok-free.app`.

### Step 2: Configure Frontend to use Public API
1. Open `frontend/.env`.
2. Update `VITE_API_URL` with the copied ngrok URL:
   ```env
   VITE_API_URL=https://<your-api-url>.ngrok-free.app
   ```
3. **Restart your frontend server** to apply the changes (Ctrl+C and run `npm run dev` again).

### Step 3: Expose the Frontend
1. Open another new terminal.
2. Run the following command to expose your frontend:
   ```bash
   ngrok http 5173
   ```
3. Copy the **Forwarding URL** (e.g., `https://<random-id>.ngrok-free.app`).

### Step 4: Share and Test
- Share the **Frontend URL** with anyone.
- They can now access your blockchain explorer, which connects to your local backend via the API tunnel.

> **Note:** If you restart the API ngrok tunnel, the URL will change, and you will need to update `.env` and restart the frontend again.
