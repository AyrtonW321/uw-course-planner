/** What the advisor executor runs for a tool call. */
export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<Record<string, unknown>>

/** A message shown in the chat transcript. */
export type ChatMessage = { role: "user" | "model"; text: string }
