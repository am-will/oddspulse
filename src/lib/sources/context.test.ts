import { afterEach, describe, expect, it, vi } from "vitest";
import { isNewsApiEnabled } from "./context";

describe("isNewsApiEnabled", () => {
  const oldEnv = process.env;

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = oldEnv;
  });

  it("disables NewsAPI when no key exists", () => {
    vi.stubEnv("NEWSAPI_KEY", "");
    expect(isNewsApiEnabled()).toBe(false);
  });

  it("keeps NewsAPI off in production unless explicitly enabled", () => {
    vi.stubEnv("NEWSAPI_KEY", "key");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_NEWSAPI_IN_PRODUCTION", "false");
    expect(isNewsApiEnabled()).toBe(false);
  });
});
