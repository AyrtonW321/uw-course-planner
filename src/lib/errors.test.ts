import { describe, expect, it } from "vitest"
import { errorCode, errorMessage } from "./errors"

describe("errorMessage", () => {
  it("reads a message from an Error", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom")
  })
  it("falls back for non-error values", () => {
    expect(errorMessage(null, "fallback")).toBe("fallback")
    expect(errorMessage({}, "fallback")).toBe("fallback")
    expect(errorMessage("x", "fallback")).toBe("fallback")
  })
})

describe("errorCode", () => {
  it("reads a Firebase-style code", () => {
    expect(errorCode({ code: "auth/requires-recent-login" })).toBe("auth/requires-recent-login")
  })
  it("is undefined when absent", () => {
    expect(errorCode(new Error("x"))).toBeUndefined()
    expect(errorCode(null)).toBeUndefined()
  })
})
