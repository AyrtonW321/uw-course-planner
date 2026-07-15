import {
  getGenerativeModel,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "firebase/ai"
import { ai } from "../firebase"
import { SYSTEM_INSTRUCTION } from "./systemPrompt"
import type { ToolExecutor } from "./types"

const MAX_TOOL_ROUNDS = 6

type TurnArgs = {
  /** Prior conversation history (Gemini Content[]), empty on the first turn. */
  history: Content[]
  userText: string
  declarations: FunctionDeclaration[]
  execute: ToolExecutor
  model?: string
}

type TurnResult = { text: string; history: Content[] }

/**
 * Run one user turn against Gemini (via Firebase AI Logic). Executes any tool
 * calls locally against the app's own logic, feeds results back, and loops
 * until the model returns text. Returns the reply plus updated history.
 */
export async function runAdvisorTurn({
  history,
  userText,
  declarations,
  execute,
  model,
}: TurnArgs): Promise<TurnResult> {
  const genModel = getGenerativeModel(ai, {
    model: model ?? "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: declarations }],
  })

  const chat = genModel.startChat({ history })
  let result = await chat.sendMessage(userText)

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = result.response.functionCalls() ?? []
    if (calls.length === 0) {
      return { text: result.response.text() || "…", history: await chat.getHistory() }
    }

    const parts: Part[] = []
    for (const call of calls) {
      let response: Record<string, unknown>
      try {
        response = await execute(call.name, (call.args ?? {}) as Record<string, unknown>)
      } catch (err) {
        response = { error: err instanceof Error ? err.message : "Tool failed." }
      }
      parts.push({ functionResponse: { name: call.name, response } })
    }

    result = await chat.sendMessage(parts)
  }

  return {
    text: "I did a lot of digging but couldn't wrap that up — try narrowing the question.",
    history: await chat.getHistory(),
  }
}
