<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d56b6ffc-5d9f-4e33-a95d-4b17f03a1d35

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
## Vercel authentication and MongoDB Atlas

The Vercel functions in `api/` provide the health check and buyer, vendor, and admin password-authentication endpoints. They store accounts in MongoDB Atlas, in the `accounts` collection of the database selected by `MONGODB_DB` (default: `webnexa_marketplace`).

Add these environment variables to the Vercel project before deploying:

- `MONGODB_URI`: the Atlas connection string for a database user with read/write access.
- `MONGODB_DB`: database name, for example `webnexa_marketplace`.
- `JWT_SECRET`: a private random value of at least 32 characters.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the first administrator account. The account is created in MongoDB the first time those credentials are used to sign in.
- `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`: the same Google OAuth client ID, for server-side verification and the browser sign-in button.

After deployment, `GET /api/health` reports whether the function can reach MongoDB Atlas. Keep the connection string and administrator password in Vercel's Environment Variables; do not commit them.

The `server.js` application uses MongoDB for account and product persistence and Socket.IO for live messaging. Configure `MONGODB_URI`, `MONGODB_DB`, and `JWT_SECRET` in the server environment before starting the application. Database-dependent routes return JSON service errors when MongoDB is unavailable.
