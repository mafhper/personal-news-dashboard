/**
 * ErrorAnalyzer.test.ts
 *
 * Testes abrangentes para o sistema de análise de falhas
 * Verifica classificação de erros, geração de sugestões e agrupamento
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ErrorAnalyzer, ErrorContext, ErrorGroup } from "./ErrorAnalyzer";
import { TestError, ErrorCategory } from "./types/testOrchestrator";

describe("ErrorAnalyzer", () => {
  let analyzer: ErrorAnalyzer;

  beforeEach(() => {
    analyzer = new ErrorAnalyzer();
  });

  describe("Error Classification", () => {
    it("should classify timeout errors correctly", () => {
      const error: TestError = {
        message: "Test timed out after 5000ms",
        stack: "Error: Test timed out\n    at timeout (/test.js:10:5)",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "should handle timeout",
        suiteName: "Integration Tests",
        filePath: "__tests__/integration.test.ts",
        category: "integration",
        duration: 5000,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.category).toBe(ErrorCategory.TIMEOUT);
      expect(analysis.severity).toBe("medium");
      expect(analysis.suggestions).toContain("Aumentar o timeout do teste");
    });

    it("should classify network errors correctly", () => {
      const error: TestError = {
        message: "fetch failed: network error",
        stack: "Error: fetch failed\n    at fetch (/test.js:15:3)",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "should fetch data",
        suiteName: "API Tests",
        filePath: "__tests__/api.test.ts",
        category: "integration",
        duration: 2000,
        retryCount: 1,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.category).toBe(ErrorCategory.NETWORK_ERROR);
      expect(analysis.suggestions).toContain("Verificar conectividade de rede");
      expect(analysis.quickFixes).toContain("Verificar configuração de rede");
    });

    it("should classify assertion failures correctly", () => {
      const error: TestError = {
        message: "expected 'hello' to equal 'world'",
        expected: "world",
        actual: "hello",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "should return correct value",
        suiteName: "Unit Tests",
        filePath: "__tests__/unit.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.category).toBe(ErrorCategory.ASSERTION_FAILURE);
      expect(analysis.suggestions).toContain(
        "Verificar valores esperados vs recebidos"
      );
    });

    it("should classify mock failures correctly", () => {
      const error: TestError = {
        message: "jest.fn() mock was called with unexpected arguments",
        stack: "Error: mock failure\n    at mockFunction (/test.js:20:1)",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "should call mock correctly",
        suiteName: "Mock Tests",
        filePath: "__tests__/mock.test.ts",
        category: "unit",
        duration: 50,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.category).toBe(ErrorCategory.MOCK_FAILURE);
      expect(analysis.suggestions).toContain("Reconfigurar mocks corretamente");
    });

    it("should classify configuration errors correctly", () => {
      const error: TestError = {
        message: "Environment variable API_KEY is not defined",
        category: ErrorCategory.UNKNOWN,
        severity: "critical",
      };

      const context: ErrorContext = {
        testName: "should load configuration",
        suiteName: "Config Tests",
        filePath: "__tests__/config.test.ts",
        category: "integration",
        duration: 10,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.category).toBe(ErrorCategory.CONFIGURATION_ERROR);
      expect(analysis.severity).toBe("critical");
      expect(analysis.suggestions).toContain("Verificar variáveis de ambiente");
    });
  });

  describe("Severity Determination", () => {
    it("should assign critical severity to configuration errors", () => {
      const error: TestError = {
        message: "Configuration file not found",
        category: ErrorCategory.CONFIGURATION_ERROR,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "config test",
        suiteName: "Critical Suite",
        filePath: "__tests__/critical.test.ts",
        category: "integration",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.severity).toBe("critical");
    });

    it("should assign high severity to errors with retries", () => {
      const error: TestError = {
        message: "Random failure",
        category: ErrorCategory.UNKNOWN,
        severity: "low",
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

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.severity).toBe("high");
    });
  });

  describe("Stack Trace Parsing", () => {
    it("should parse stack trace correctly", () => {
      const error: TestError = {
        message: "Random test failure",
        stack: `Error: Random test failure
    at testFunction (/home/user/project/src/test.js:10:5)
    at Object.<anonymous> (/home/user/project/__tests__/test.test.js:15:3)
    at processTicksAndRejections (node:internal/process/task_queues.js:95:5)`,
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "test with stack",
        suiteName: "Stack Tests",
        filePath: "__tests__/stack.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      // Verificar se o stack trace foi processado (deve ter sugestões)
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      // Verificar se pelo menos uma sugestão menciona código ou arquivo
      const hasCodeSuggestion = analysis.suggestions.some(
        (s) =>
          s.includes("código") ||
          s.includes("arquivo") ||
          s.includes("Verificar")
      );
      expect(hasCodeSuggestion).toBe(true);
    });
  });

  describe("Suggestion Generation", () => {
    it("should generate contextual suggestions for timeout errors", () => {
      const error: TestError = {
        message: "Operation timed out after 1000ms",
        category: ErrorCategory.UNKNOWN, // Deixar o analyzer classificar
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "slow operation",
        suiteName: "Performance Tests",
        filePath: "__tests__/performance.test.ts",
        category: "performance",
        duration: 1000,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.suggestions).toContain("Aumentar o timeout do teste");
      expect(analysis.suggestions).toContain(
        "Verificar operações assíncronas não aguardadas"
      );
      expect(analysis.quickFixes.length).toBeGreaterThan(0);
      expect(
        analysis.quickFixes.some(
          (fix) => fix.includes("timeout") || fix.includes("await")
        )
      ).toBe(true);
    });

    it("should generate suggestions for network errors", () => {
      const error: TestError = {
        message: "Connection refused",
        category: ErrorCategory.NETWORK_ERROR,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "api call",
        suiteName: "API Tests",
        filePath: "__tests__/api.test.ts",
        category: "integration",
        duration: 500,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.suggestions).toContain("Verificar conectividade de rede");
      expect(analysis.suggestions).toContain(
        "Configurar mocks para requisições externas"
      );
    });

    it("should limit suggestions to 5 items", () => {
      const error: TestError = {
        message: "Complex error with many potential solutions",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "complex test",
        suiteName: "Complex Suite",
        filePath: "__tests__/complex.test.ts",
        category: "integration",
        duration: 5000,
        retryCount: 2,
        relatedErrors: [
          {
            message: "Related error 1",
            category: ErrorCategory.UNKNOWN,
            severity: "low",
          },
          {
            message: "Related error 2",
            category: ErrorCategory.UNKNOWN,
            severity: "low",
          },
        ],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Related Tests Identification", () => {
    it("should identify related tests in same suite", () => {
      const error: TestError = {
        message: "Suite-wide error",
        category: ErrorCategory.INTEGRATION_FAILURE,
        severity: "high",
      };

      const context: ErrorContext = {
        testName: "failing test",
        suiteName: "Integration Suite",
        filePath: "__tests__/integration.test.ts",
        category: "integration",
        duration: 1000,
        retryCount: 0,
        relatedErrors: [
          {
            message: "Related error",
            category: ErrorCategory.INTEGRATION_FAILURE,
            severity: "medium",
          },
        ],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.relatedTests).toContain(
        "Outros testes em Integration Suite"
      );
    });

    it("should identify tests with similar error category", () => {
      const error: TestError = {
        message: "Timeout error",
        category: ErrorCategory.TIMEOUT,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "timeout test",
        suiteName: "Timeout Suite",
        filePath: "__tests__/timeout.test.ts",
        category: "performance",
        duration: 5000,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.relatedTests).toContain("Testes com erros de timeout");
    });
  });

  describe("Impact Calculation", () => {
    it("should calculate high impact for integration tests", () => {
      const error: TestError = {
        message: "Integration failure",
        category: ErrorCategory.INTEGRATION_FAILURE,
        severity: "high",
      };

      const context: ErrorContext = {
        testName: "integration test",
        suiteName: "Integration Suite",
        filePath: "__tests__/integration.test.ts",
        category: "integration",
        duration: 1000,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.impact).toContain("Pode afetar funcionalidade principal");
    });

    it("should note intermittent errors", () => {
      const error: TestError = {
        message: "Flaky error",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "flaky test",
        suiteName: "Flaky Suite",
        filePath: "__tests__/flaky.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 2,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.impact).toContain(
        "Erro intermitente - pode causar instabilidade"
      );
    });
  });

  describe("Error Grouping", () => {
    it("should group similar errors correctly", () => {
      const errors: TestError[] = [
        {
          message: "timeout after 1000ms",
          category: ErrorCategory.TIMEOUT,
          severity: "medium",
        },
        {
          message: "timeout after 2000ms",
          category: ErrorCategory.TIMEOUT,
          severity: "medium",
        },
        {
          message: "network connection failed",
          category: ErrorCategory.NETWORK_ERROR,
          severity: "high",
        },
      ];

      const contexts: ErrorContext[] = [
        {
          testName: "test1",
          suiteName: "Suite1",
          filePath: "__tests__/test1.test.ts",
          category: "integration",
          duration: 1000,
          retryCount: 0,
          relatedErrors: [],
        },
        {
          testName: "test2",
          suiteName: "Suite1",
          filePath: "__tests__/test2.test.ts",
          category: "integration",
          duration: 2000,
          retryCount: 0,
          relatedErrors: [],
        },
        {
          testName: "test3",
          suiteName: "Suite2",
          filePath: "__tests__/test3.test.ts",
          category: "integration",
          duration: 500,
          retryCount: 0,
          relatedErrors: [],
        },
      ];

      const result = analyzer.analyzeErrorGroup(errors, contexts);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].frequency).toBe(2); // timeout group
      expect(result.groups[1].frequency).toBe(1); // network group
      expect(result.summary.totalErrors).toBe(3);
      expect(result.summary.totalGroups).toBe(2);
    });

    it("should generate group summary correctly", () => {
      const errors: TestError[] = [
        {
          message: "critical config error",
          category: ErrorCategory.CONFIGURATION_ERROR,
          severity: "critical",
        },
        {
          message: "medium assertion error",
          category: ErrorCategory.ASSERTION_FAILURE,
          severity: "medium",
        },
      ];

      const contexts: ErrorContext[] = [
        {
          testName: "config test",
          suiteName: "Config Suite",
          filePath: "__tests__/config.test.ts",
          category: "integration",
          duration: 100,
          retryCount: 0,
          relatedErrors: [],
        },
        {
          testName: "assertion test",
          suiteName: "Unit Suite",
          filePath: "__tests__/unit.test.ts",
          category: "unit",
          duration: 50,
          retryCount: 0,
          relatedErrors: [],
        },
      ];

      const result = analyzer.analyzeErrorGroup(errors, contexts);

      expect(result.summary.severityDistribution).toHaveProperty("critical", 1);
      expect(result.summary.severityDistribution).toHaveProperty("medium", 1);
      expect(result.summary.recommendations.length).toBeGreaterThan(0);
      expect(
        result.summary.recommendations.some(
          (rec) =>
            rec.includes("críticos") ||
            rec.includes("padrão") ||
            rec.includes("correção")
        )
      ).toBe(true);
    });
  });

  describe("Documentation Links", () => {
    it("should provide relevant documentation links", () => {
      const error: TestError = {
        message: "Test timed out",
        category: ErrorCategory.UNKNOWN, // Deixar o analyzer classificar
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "timeout test",
        suiteName: "Timeout Suite",
        filePath: "__tests__/timeout.test.ts",
        category: "performance",
        duration: 5000,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis.documentationLinks.length).toBeGreaterThan(0);
      expect(analysis.documentationLinks.length).toBeLessThanOrEqual(2);
      // Verificar se pelo menos um link é uma URL válida
      expect(
        analysis.documentationLinks.some((link) => link.startsWith("http"))
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle errors without stack traces", () => {
      const error: TestError = {
        message: "Simple error without stack",
        category: ErrorCategory.UNKNOWN,
        severity: "low",
      };

      const context: ErrorContext = {
        testName: "simple test",
        suiteName: "Simple Suite",
        filePath: "__tests__/simple.test.ts",
        category: "unit",
        duration: 10,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis).toBeDefined();
      expect(analysis.category).toBe(ErrorCategory.UNKNOWN);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

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

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis).toBeDefined();
      expect(analysis.category).toBe(ErrorCategory.UNKNOWN);
    });

    it("should handle malformed stack traces", () => {
      const error: TestError = {
        message: "Error with malformed stack",
        stack: "Not a real stack trace\nJust some random text",
        category: ErrorCategory.UNKNOWN,
        severity: "medium",
      };

      const context: ErrorContext = {
        testName: "malformed stack test",
        suiteName: "Edge Case Suite",
        filePath: "__tests__/edge.test.ts",
        category: "unit",
        duration: 100,
        retryCount: 0,
        relatedErrors: [],
      };

      const analysis = analyzer.analyzeError(error, context);

      expect(analysis).toBeDefined();
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});
