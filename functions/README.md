# AI Advisor backend

A single Cloud Function (`advisor`) that securely proxies the app's chat to the
Gemini API. It holds the Gemini API key (never sent to the browser), verifies
the caller is signed in, and forwards one `generateContent` turn. **All tool /
function execution happens client-side** against the app's own tested logic —
this function only talks to Gemini.

## One-time setup

1. **Enable billing** — Cloud Functions require the Firebase **Blaze** plan
   (generous free tier; Gemini Flash calls are pennies).

2. **Get a Gemini API key** at <https://aistudio.google.com/app/apikey>.

3. **Install deps**

   ```bash
   cd functions
   npm install
   ```

4. **Store the key as a secret** (not committed anywhere):

   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   # paste the key when prompted
   ```

5. **Deploy**

   ```bash
   firebase deploy --only functions
   ```

## Notes

- Model defaults to `gemini-2.5-flash`; the client may request
  `gemini-2.5-pro` for harder planning.
- The function is an `onCall` callable, so the Firebase SDK sends the user's
  auth automatically and the function rejects unauthenticated requests.
- To iterate locally: `npm run serve` (Firebase emulator).
