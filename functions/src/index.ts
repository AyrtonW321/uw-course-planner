import { onCall, HttpsError } from "firebase-functions/v2/https"
import { defineSecret } from "firebase-functions/params"
import { GoogleGenAI } from "@google/genai"

/**
 * AI advisor backend.
 * -------------------
 * A thin, secure proxy to the Gemini API. It holds the API key (never sent to
 * the client), verifies the caller is a signed-in user, and forwards a single
 * generateContent turn. All tool/function execution happens client-side against
 * the app's own tested logic — this function only talks to Gemini.
 */

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY")

// Minimal shapes mirrored from the Gemini content format.
type Part = Record<string, unknown>
type Content = { role: "user" | "model"; parts: Part[] }

type RequestData = {
  contents: Content[]
  systemInstruction?: string
  // Gemini tool config: [{ functionDeclarations: [...] }]
  tools?: unknown[]
  model?: string
}

const DEFAULT_MODEL = "gemini-2.5-flash"
const ALLOWED_MODELS = new Set(["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"])

export const advisor = onCall(
  { secrets: [GEMINI_API_KEY], region: "us-central1", cors: true, maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to use the advisor.")
    }

    const data = request.data as RequestData
    if (!Array.isArray(data?.contents) || data.contents.length === 0) {
      throw new HttpsError("invalid-argument", "Missing conversation contents.")
    }

    const model = data.model && ALLOWED_MODELS.has(data.model) ? data.model : DEFAULT_MODEL
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

    try {
      const response = await ai.models.generateContent({
        model,
        contents: data.contents,
        config: {
          systemInstruction: data.systemInstruction,
          tools: data.tools,
          temperature: 0.4,
        },
      })

      const content = response.candidates?.[0]?.content ?? null
      return { content }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Advisor request failed."
      throw new HttpsError("internal", message)
    }
  }
)
