import { describe, expect, it } from "vitest";
import { extractKeywords, scoreContextMatch } from "./keywords";

describe("keywords", () => {
  it("extracts useful terms and scores title matches", () => {
    const keywords = extractKeywords("Will the Fed cut interest rates before June?");
    expect(keywords).toContain("fed");
    expect(keywords).toContain("interest");
    const match = scoreContextMatch("Fed officials debate interest rate path", keywords);
    expect(match.matchedKeywords).toEqual(expect.arrayContaining(["fed", "interest"]));
    expect(match.relevanceScore).toBeGreaterThan(0);
  });
});
