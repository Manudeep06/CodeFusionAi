import { describe, expect, it, vi } from "vitest";

// The AI client talks to the backend; stub it so the module loads without network or Firebase.
vi.mock("../../services/aiService", () => ({ sendMessage: vi.fn() }));
const { buildPrompt } = await import("./useChatStore");

describe("buildPrompt", () => {
  it("sends the question as-is when there is no history", () => {
    expect(buildPrompt([], "What is a closure?")).toBe("What is a closure?");
  });

  it("includes recent turns and asks for fenced code", () => {
    const prompt = buildPrompt(
      [{ role: "user", text: "Explain hooks" }, { role: "assistant", text: "Hooks let you…" }],
      "And useMemo?",
    );
    expect(prompt).toContain("User: Explain hooks");
    expect(prompt).toContain("Assistant: Hooks let you…");
    expect(prompt).toContain("User: And useMemo?");
    expect(prompt).toMatch(/fenced blocks/);
  });

  it("drops failed replies and keeps only the last 6 turns", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: `turn ${i}` }));
    history.push({ role: "assistant", error: true, text: "network down" });
    const prompt = buildPrompt(history, "next");
    expect(prompt).not.toContain("network down");
    expect(prompt).not.toContain("turn 3");
    expect(prompt).toContain("turn 4");
    expect(prompt).toContain("turn 9");
  });
});
