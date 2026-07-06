/** Minimal mirror of the Gemini content format used across the advisor. */

export type FunctionCall = { name: string; args?: Record<string, unknown> }
export type FunctionResponse = { name: string; response: Record<string, unknown> }

export type Part = {
  text?: string
  functionCall?: FunctionCall
  functionResponse?: FunctionResponse
}

export type Content = { role: "user" | "model"; parts: Part[] }

/** A Gemini function declaration (JSON-schema-ish parameters). */
export type ToolDeclaration = {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

/** What the advisor executor runs for a tool call. */
export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<Record<string, unknown>>

/** A message shown in the chat transcript. */
export type ChatMessage = { role: "user" | "model"; text: string }
