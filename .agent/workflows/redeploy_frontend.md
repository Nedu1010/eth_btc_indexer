---
description: How to redeploy frontend changes
---

Use this workflow after making changes to the frontend code (e.g., `App.tsx`, CSS files) to update the live application.

### Steps

1. **Rebuild the Frontend**
   Run this command to compile your changes for production:
   ```bash
   cd /data/btc_eth_indexer/frontend && npm run build
   ```

2. **Verify**
   - Refresh your ngrok URL in the browser.
   - You should see your changes immediately.

> **Note:** You do NOT need to restart the API server or ngrok. The backend automatically serves the latest files from the `dist` folder.
