import { describe, it, expect } from "vitest"
import { createSafeExecutor } from "@/lib/safe"

describe("createSafeExecutor", () => {

  describe("sync functions", () => {
    it("returns [null, data] on success", () => {
      const safe = createSafeExecutor((a: number, b: number) => a + b)
      expect(safe(1, 2)).toEqual([null, 3])
    })

    it("returns [error, null] on throw", () => {
      const safe = createSafeExecutor(() => {throw new Error("boom") }) // ts leak, the fn never reach it's end, type widened to unknown
      const [err, data] = safe()
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toBe("boom")
      expect(data).toBeNull()
    })

    it("returns [error, null] on non-Error throw", () => {
      const safe = createSafeExecutor(() => { throw "raw string" })
      const [err, data] = safe() // ts leak, the fn never reach it's end, type widened to unknown
      expect(err).toBeInstanceOf(Error)
      expect(data).toBeNull()
    })

    it("preserves return value shape", () => {
      const safe = createSafeExecutor((id: string) => ({ id, name: "test" }))
      const [err, data] = safe("abc")
      expect(err).toBeNull()
      expect(data).toEqual({ id: "abc", name: "test" })
    })

    it("forwards all arguments correctly", () => {
      const safe = createSafeExecutor((a: number, b: number, c: number) => a + b + c)
      expect(safe(1, 2, 3)).toEqual([null, 6])
    })
  })

  describe("async functions", () => {
    it("returns [null, data] on resolution", async () => {
      const safe = createSafeExecutor(async (x: number) => x * 2)
      const [err, data] = await safe(5)
      expect(err).toBeNull()
      expect(data).toBe(10)
    })

    it("returns [error, null] on rejection", async () => {
      const safe = createSafeExecutor(async () => { throw new Error("async boom") })
      const [err, data] = await safe()
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toBe("async boom")
      expect(data).toBeNull()
    })

    it("returns [error, null] on non-Error rejection", async () => {
      const safe = createSafeExecutor(async () => Promise.reject("raw rejection"))
      const [err, data] = await safe()
      expect(err).toBeInstanceOf(Error)
      expect(data).toBeNull()
    })

    it("preserves resolved value shape", async () => {
      const safe = createSafeExecutor(async (id: string) => ({ id, ok: true }))
      const [err, data] = await safe("xyz")
      expect(err).toBeNull()
      expect(data).toEqual({ id: "xyz", ok: true })
    })
  })

  describe("edge cases", () => {
    it("handles no-arg functions", () => {
      const safe = createSafeExecutor(() => 42)
      expect(safe()).toEqual([null, 42])
    })

    it("handles functions returning null", () => {
      const safe = createSafeExecutor(() => null)
      expect(safe()).toEqual([null, null])
    })

    it("handles functions returning undefined", () => {
      const safe = createSafeExecutor(() => undefined)
      expect(safe()).toEqual([null, undefined])
    })

    it("handles functions returning false", () => {
      const safe = createSafeExecutor(() => false)
      expect(safe()).toEqual([null, false])
    })
  })
})