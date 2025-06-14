import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard, generateShareText } from "../shareUtils";

// Mock document.execCommand for fallback testing
Object.defineProperty(document, "execCommand", {
  value: vi.fn(() => true),
  writable: true,
});

describe("shareUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("copies text to clipboard using modern API", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
    });

    const result = await copyToClipboard("test");

    expect(mockWriteText).toHaveBeenCalledWith("test");
    expect(result).toBe(true);
  });

  it("falls back to execCommand when clipboard API unavailable", async () => {
    // Remove clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
    });

    const mockExecCommand = vi.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;

    const result = await copyToClipboard("test");

    expect(mockExecCommand).toHaveBeenCalledWith("copy");
    expect(result).toBe(true);
  });

  it("generates share text with market data", () => {
    const market = {
      name: "Test Market",
      address: "0x123",
      totalParticipants: 10,
      activeParticipants: 5,
      kuriAmount: "1000",
      intervalType: 1,
      state: 1,
      createdAt: "0",
      metadata: {},
      creator: "0xabc",
      nextDepositTime: "0",
      nextRaffleTime: "0",
      nextDraw: "0",
      launchPeriod: "0",
      raffleWinners: [],
      members: [],
      startTime: "0",
      endTime: "0",
    };
    const text = generateShareText(market);
    expect(text).toContain("Test Market");
    expect(text).toContain("members joined");
  });
});
