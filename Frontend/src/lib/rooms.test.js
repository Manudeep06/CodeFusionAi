import { describe, expect, it, vi, afterEach } from "vitest";
import { timeAgo, templateColor, TEMPLATES } from "./rooms";

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers());
  const at = (ms) => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-19T12:00:00Z")); return new Date(Date.now() - ms); };

  it("formats recent and older times compactly", () => {
    expect(timeAgo(at(10_000))).toBe("just now");
    expect(timeAgo(at(5 * 60_000))).toBe("5m ago");
    expect(timeAgo(at(3 * 3_600_000))).toBe("3h ago");
    expect(timeAgo(at(2 * 86_400_000))).toBe("2d ago");
    expect(timeAgo(at(15 * 86_400_000))).toBe("2w ago");
    expect(timeAgo(at(60 * 86_400_000))).toBe("1mo ago");
    expect(timeAgo(at(400 * 86_400_000))).toBe("1y ago");
  });

  it("handles missing dates", () => {
    expect(timeAgo(undefined)).toBe("—");
  });
});

describe("templates", () => {
  it("every template has an id, colour and icon", () => {
    for (const t of TEMPLATES) {
      expect(t.id).toMatch(/^[a-z]+$/);
      expect(t.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.icon).toBeTruthy();
    }
  });

  it("looks up colours by id", () => {
    expect(templateColor("react")).toBe("#0ea5e9");
    expect(templateColor("unknown")).toBeUndefined();
  });
});
