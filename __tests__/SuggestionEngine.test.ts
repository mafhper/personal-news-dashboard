/**
 * SuggestionEngine.test.ts
 *
 * Testes para o sistema de geração de sugestões
 * Verifica geração de sugestões contextuais, quick fixes e debugging steps
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SuggestionEngine } from "./SuggestionEngine";
import { ErrorContext } from "./ErrorAnalyzer";
import { TestError, ErrorCategory } from "./types/testOrchestrator";

describe("SuggestionEngine", () => {
  let engine: SuggestionEngine;

  beforeEach(() => {
    engine = new SuggestionEngine();
  });

  describe("Suggestion Generation", () => {
    it("should generate comprehensive suggestions for timeout errors", () => {
      const error: TestError = {
        message: "Test timed out after 5000ms",
        category: ErrorCategory.TIMEOUT,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "slow operation test",
        suiteName: "Performance Suite",
        filePath: "__tests__/performance.test.ts",
        category: "performance",
        duration: 5000,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.TIMEOUT
      );

      expect(suggestions.immediate.length).toBeGreaterThan(0);
      expect(suggestions.quickFixes).toContain(
        expect.stringContaining("Aumentar timeout para")
      );
      expect(suggestions.debuggingSteps).toContain(
        expect.stringContaining(
          "Adicionar logs para identificar onde o teste trava"
        )
      );
    });

    it("should generate network-specific suggestions", () => {
      const error: TestError = {
        message: "fetch failed: network error",
        category: ErrorCategory.NETWORK_ERROR,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "api call test",
        suiteName: "Integration Suite",
        filePath: "__tests__/api.test.ts",
        category: "integration",
        duration: 2000,
        retryCount: 1,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.NETWORK_ERROR
      );

      expect(suggestions.quickFixes).toContain(
        "Configurar mock para requisições de rede"
      );
      expect(suggestions.prevention.length).toBeGreaterThan(0);
      expect(suggestions.debuggingSteps).toContain(
        expect.stringContaining("Verificar conectividade de rede")
      );
    });

    it("should generate assertion failure suggestions with specific fixes", () => {
      const error: TestError = {
        message: "expected 'hello' to equal 'world'",
        expected: "world",
        actual: "hello",
        category: ErrorCategory.ASSERTION_FAILURE,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "string comparison test",
        suiteName: "Unit Suite",
        filePath: "__tests__/unit.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.ASSERTION_FAILURE
      );

      expect(suggestions.quickFixes).toContain(
        expect.stringContaining(
          "Atualizar valor esperado de 'world' para 'hello'"
        )
      );
      expect(suggestions.debuggingSteps).toContain(
        expect.stringContaining("Comparar valores esperados vs recebidos")
      );
    });

    it("should generate mock failure suggestions", () => {
      const error: TestError = {
        message: "jest.fn() mock was called with unexpected arguments",
        category: ErrorCategory.MOCK_FAILURE,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "mock test",
        suiteName: "Mock Suite",
        filePath: "__tests__/mock.test.ts",
        category: "unit",
        duration: 50,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.MOCK_FAILURE
      );

      expect(suggestions.quickFixes).toContain(
        "Limpar todos os mocks: vi.clearAllMocks()"
      );
      expect(suggestions.prevention).toContain(
        expect.objectContaining({
          suggestion: expect.stringContaining("factory de mocks"),
        })
      );
    });

    it("should generate configuration error suggestions", () => {
      const error: TestError = {
        message: "Environment variable API_KEY is not defined",
        category: ErrorCategory.CONFIGURATION_ERROR,
        severity: "critical",
      };

      const context: ErrorContext = {
        testName: "config test",
        suiteName: "Config Suite",
        filePath: "__tests__/config.test.ts",
        category: "integration",
        duration: 10,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.CONFIGURATION_ERROR
      );

      expect(suggestions.quickFixes).toContain(
        expect.stringContaining("Verificar arquivo .env")
      );
      expect(suggestions.prevention).toContain(
        expect.objectContaining({
          suggestion: expect.stringContaining("validação de configuração"),
        })
      );
    });
  });

  describe("Knowledge Base Integration", () => {
    it("should find solutions in knowledge base", () => {
      const error: TestError = {
        message: "Test timed out after 10000ms",
        category: ErrorCategory.TIMEOUT,
        severity: "medium",
      };

      const solutions = engine.findKnowledgeBaseSolutions(
        error,
        ErrorCategory.TIMEOUT
      );

      expect(solutions.length).toBeGreaterThan(0);
      expect(solutions[0]).toHaveProperty("solutions");
      expect(solutions[0]).toHaveProperty("commonCauses");
      expect(solutions[0]).toHaveProperty("difficulty");
    });

    it("should find related solutions for similar errors", () => {
      const error: TestError = {
        message: "fetch request failed with timeout",
        category: ErrorCategory.NETWORK_ERROR,
        severity: "medium",
      };

      const solutions = engine.findKnowledgeBaseSolutions(
        error,
        ErrorCategory.NETWORK_ERROR
      );

      expect(solutions.length).toBeGreaterThan(0);
      expect(
        solutions.some((s) => s.category === ErrorCategory.NETWORK_ERROR)
      ).toBe(true);
    });
  });

  describe("Pattern-Based Suggestions", () => {
    it("should generate suggestions for undefined property access", () => {
      const error: TestError = {
        message: "Cannot read property 'name' of undefined",
        category: ErrorCategory.ASSERTION_FAILURE,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "property access test",
        suiteName: "Unit Suite",
        filePath: "__tests__/unit.test.ts",
        category: "unit",
        duration: 50,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generatePatternBasedSuggestions(
        error,
        context
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].suggestion).toContain("null/undefined");
      expect(suggestions[0].confidence).toBeGreaterThan(0.5);
    });

    it("should generate suggestions for assertion mismatches", () => {
      const error: TestError = {
        message: "expected 42 to equal 24 but received 42",
        category: ErrorCategory.ASSERTION_FAILURE,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "number comparison test",
        suiteName: "Unit Suite",
        filePath: "__tests__/unit.test.ts",
        category: "unit",
        duration: 25,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generatePatternBasedSuggestions(
        error,
        context
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(
        suggestions.some((s) => s.suggestion.includes("valores esperados"))
      ).toBe(true);
    });
  });

  describe("Contextual Suggestions", () => {
    it("should generate integration-specific suggestions", () => {
      const error: TestError = {
        message: "Service unavailable",
        category: ErrorCategory.INTEGRATION_FAILURE,
        severity: "high",
      };

      const context: ErrorContext = {
        testName: "service integration test",
        suiteName: "Integration Suite",
        filePath: "__tests__/integration.test.ts",
        category: "integration",
        duration: 3000,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateContextualSuggestions(
        error,
        context,
        ErrorCategory.INTEGRATION_FAILURE
      );

      expect(
        suggestions.some((s) => s.suggestion.includes("serviços dependentes"))
      ).toBe(true);
      expect(suggestions.some((s) => s.category === "prevention")).toBe(true);
    });

    it("should generate performance-specific suggestions", () => {
      const error: TestError = {
        message: "Test execution too slow",
        category: ErrorCategory.PERFORMANCE_DEGRADATION,
        severity: "low",
      };

      const context: ErrorContext = {
        testName: "performance test",
        suiteName: "Performance Suite",
        filePath: "__tests__/performance.test.ts",
        category: "performance",
        duration: 35000,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateContextualSuggestions(
        error,
        context,
        ErrorCategory.PERFORMANCE_DEGRADATION
      );

      expect(suggestions.some((s) => s.suggestion.includes("profiling"))).toBe(
        true
      );
      expect(
        suggestions.some((s) =>
          s.suggestion.includes("Otimizar operações lentas")
        )
      ).toBe(true);
    });

    it("should generate retry-based suggestions for flaky tests", () => {
      const error: TestError = {
        message: "Random failure",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "flaky test",
        suiteName: "Flaky Suite",
        filePath: "__tests__/flaky.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 3,
        relatedErrors: [],
      };

      const suggestions = engine.generateContextualSuggestions(
        error,
        context,
        ErrorCategory.UNKNOWN
      );

      expect(
        suggestions.some((s) => s.suggestion.includes("condições de corrida"))
      ).toBe(true);
      expect(suggestions.some((s) => s.category === "investigation")).toBe(
        true
      );
    });
  });

  describe("Quick Fixes", () => {
    it("should generate specific quick fixes for timeout errors", () => {
      const error: TestError = {
        message: "Test timed out",
        category: ErrorCategory.TIMEOUT,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "timeout test",
        suiteName: "Timeout Suite",
        filePath: "__tests__/timeout.test.ts",
        category: "unit",
        duration: 5000,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.TIMEOUT
      );

      expect(suggestions.quickFixes).toContain(
        expect.stringContaining("Aumentar timeout para 10000ms")
      );
      expect(suggestions.quickFixes).toContain(
        expect.stringContaining("await")
      );
    });

    it("should generate quick fixes with code examples for assertions", () => {
      const error: TestError = {
        message: "expected 'foo' to equal 'bar'",
        expected: "bar",
        actual: "foo",
        category: ErrorCategory.ASSERTION_FAILURE,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "assertion test",
        suiteName: "Unit Suite",
        filePath: "__tests__/unit.test.ts",
        category: "unit",
        duration: 50,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.ASSERTION_FAILURE
      );

      expect(suggestions.quickFixes).toContain(
        "Atualizar valor esperado de 'bar' para 'foo'"
      );
    });
  });

  describe("Debugging Steps", () => {
    it("should generate structured debugging steps", () => {
      const error: TestError = {
        message: "Unexpected error",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "unknown error test",
        suiteName: "Debug Suite",
        filePath: "__tests__/debug.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.UNKNOWN
      );

      expect(suggestions.debuggingSteps.length).toBeGreaterThan(3);
      expect(suggestions.debuggingSteps[0]).toContain("1.");
      expect(
        suggestions.debuggingSteps.some((step) =>
          step.includes("Reproduzir o erro")
        )
      ).toBe(true);
      expect(
        suggestions.debuggingSteps.some((step) => step.includes("documentação"))
      ).toBe(true);
    });

    it("should generate category-specific debugging steps", () => {
      const error: TestError = {
        message: "Network timeout",
        category: ErrorCategory.NETWORK_ERROR,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "network test",
        suiteName: "Network Suite",
        filePath: "__tests__/network.test.ts",
        category: "integration",
        duration: 10000,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.NETWORK_ERROR
      );

      expect(
        suggestions.debuggingSteps.some((step) =>
          step.includes("conectividade")
        )
      ).toBe(true);
      expect(
        suggestions.debuggingSteps.some((step) => step.includes("endpoints"))
      ).toBe(true);
    });
  });

  describe("Suggestion Quality", () => {
    it("should provide confidence scores for suggestions", () => {
      const error: TestError = {
        message: "Test failed",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "test",
        suiteName: "Suite",
        filePath: "__tests__/test.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.UNKNOWN
      );
      const allSuggestions = [
        ...suggestions.immediate,
        ...suggestions.investigation,
        ...suggestions.prevention,
      ];

      allSuggestions.forEach((suggestion) => {
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it("should categorize suggestions appropriately", () => {
      const error: TestError = {
        message: "Configuration error",
        category: ErrorCategory.CONFIGURATION_ERROR,
        severity: "critical",
      };

      const context: ErrorContext = {
        testName: "config test",
        suiteName: "Config Suite",
        filePath: "__tests__/config.test.ts",
        category: "integration",
        duration: 50,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.CONFIGURATION_ERROR
      );

      expect(suggestions.immediate.length).toBeGreaterThan(0);
      expect(suggestions.prevention.length).toBeGreaterThan(0);

      suggestions.immediate.forEach((s) =>
        expect(s.category).toBe("immediate")
      );
      suggestions.investigation.forEach((s) =>
        expect(s.category).toBe("investigation")
      );
      suggestions.prevention.forEach((s) =>
        expect(s.category).toBe("prevention")
      );
    });

    it("should provide effort estimates", () => {
      const error: TestError = {
        message: "Complex integration failure",
        category: ErrorCategory.INTEGRATION_FAILURE,
        severity: "high",
      };

      const context: ErrorContext = {
        testName: "complex test",
        suiteName: "Integration Suite",
        filePath: "__tests__/integration.test.ts",
        category: "integration",
        duration: 5000,
        retryCount: 2,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.INTEGRATION_FAILURE
      );
      const allSuggestions = [
        ...suggestions.immediate,
        ...suggestions.investigation,
        ...suggestions.prevention,
      ];

      allSuggestions.forEach((suggestion) => {
        expect(["low", "medium", "high"]).toContain(suggestion.estimatedEffort);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty error messages", () => {
      const error: TestError = {
        message: "",
        category: ErrorCategory.UNKNOWN,
        severity: "low",
      };

      const context: ErrorContext = {
        testName: "empty error test",
        suiteName: "Edge Case Suite",
        filePath: "__tests__/edge.test.ts",
        category: "unit",
        duration: 1,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.UNKNOWN
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.quickFixes.length).toBeGreaterThan(0);
    });

    it("should handle very long error messages", () => {
      const longMessage = "A".repeat(1000) + " error occurred";
      const error: TestError = {
        message: longMessage,
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "long error test",
        suiteName: "Edge Case Suite",
        filePath: "__tests__/edge.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const suggestions = engine.generateSuggestions(
        error,
        context,
        ErrorCategory.UNKNOWN
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.debuggingSteps.length).toBeGreaterThan(0);
    });
  });
});
