import { httpsCallable } from "firebase/functions"
import { functions } from "../firebase"
import type { Content, ToolDeclaration } from "./types"

type AdvisorRequest = {
  contents: Content[]
  systemInstruction?: string
  tools?: { functionDeclarations: ToolDeclaration[] }[]
  model?: string
}

type AdvisorResponse = { content: Content | null }

const advisorFn = httpsCallable<AdvisorRequest, AdvisorResponse>(functions, "advisor")

/** One Gemini turn via the secure Cloud Function proxy. */
export async function callAdvisor(req: AdvisorRequest): Promise<Content | null> {
  const res = await advisorFn(req)
  return res.data.content
}
