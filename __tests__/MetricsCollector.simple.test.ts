import { describe, it, expect } from "vitest";
import MetricsCollector from "./MetricsCollector";

describe("MetricsCollector Import Test", () => {
  it("should import MetricsCollector successfully", () => {
    const collector = new MetricsCollector();
    expect(collector).toBeDefined();
    expect(collector).toBeInstanceOf(MetricsCollector);
  });
});
