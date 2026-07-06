import { callAdvisor } from "./client"
import { SYSTEM_INSTRUCTION } from "./systemPrompt"
import type { Content, Part, ToolDeclaration, ToolExecutor } from "./types"

const MAX_TOOL_ROUNDS = 6

type TurnArgs = {
  /** Full prior conversation (raw Gemini contents, incl. tool turns). */
  priorContents: Content[]
  userText: string
  declarations: ToolDeclaration[]
  execute: ToolExecutor
  model?: string
}

type TurnResult = { text: string; contents: Content[] }

/**
 * Run one user turn: send to Gemini, execute any tool calls locally against the
 * app's own logic, feed results back, and loop until Gemini returns text.
 */
export async function runAdvisorTurn({
  priorContents,
  userText,
  declarations,
  execute,
  model,
}: TurnArgs): Promise<TurnResult> {
  const contents: Content[] = [
    ...priorContents,
    { role: "user", parts: [{ text: userText }] },
  ]
  const tools = [{ functionDeclarations: declarations }]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const content = await callAdvisor({
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools,
      model,
    })
    if (!content) throw new Error("The advisor returned no response.")

    contents.push(content)

    const calls = (content.parts ?? []).filter((p) => p.functionCall)
    if (calls.length === 0) {
      const text = (content.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim()
      return { text: text || "…", contents }
    }

    // Execute each requested tool locally and return the results.
    const responseParts: Part[] = []
    for (const p of calls) {
      const fc = p.functionCall!
      let response: Record<string, unknown>
      try {
        response = await execute(fc.name, fc.args ?? {})
      } catch (err) {
        response = { error: err instanceof Error ? err.message : "Tool failed." }
      }
      responseParts.push({ functionResponse: { name: fc.name, response } })
    }
    contents.push({ role: "user", parts: responseParts })
  }

  return {
    text: "I did a lot of digging but couldn't wrap that up — try narrowing the question.",
    contents,
  }
}
