/**
 * MarkdownReportGenerator.test.ts
 *
 * Testes para o gerador avançado de relatórios em formato Markdown
 * Verifica a geração correta de templates, formatação e seções detalhadas
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MarkdownReportGenerator } from "./MarkdownReportGenerator";
import {
  TestExecutionResult,
  TestSuiteResult,
  TestSummary,
  TestMetrics,
  EnvironmentInfo,
  ReportConfig,
  ErrorCategory,
  TestCaseResult,
  TestError,
} from "./types/testOrchestrator";

describe("MarkdownReportGenerator", () => {
  let reportGenerator: MarkdownReportGenerator;
  let mockConfig: ReportConfig;
  let mockResults: TestExecutionResult;

  beforeEach(() => {
    mockConfig = {
      outputPath: "test-report.md",
      format: "markdown",
      includeStackTraces: true,
      includeMetrics: true,
      detailLevel: "detailed",
      includeEnvironmentInfo: true,
      includeSuggestions: true,
    };

    reportGenerator = new MarkdownReportGenerator(mockConfig);

    // Mock test results
    const mockError: TestError = {
      message: "Expected 'true' but received 'false'",
      stack: "Error: Test failed\n    at test.js:10:5",
      file: "test.js",
      line: 10,
      column: 5,
      expected: true,
      actual: false,
      diff: "- true\n+ false",
      category: ErrorCategory.ASSERTION_FAILURE,
      severity: "medium",
      suggestions: [
        "Verifique se os valores esperados estão corretos",
        "Confirme se o estado do sistema está como esperado",
      ],
    };

    const mockTestCase: TestCaseResult = {
      name: "should validate feed URL",
      fullName: "Feed Validator > should validate feed URL",
      status: "failed",
      duration: 150,
      error: mockError,
      assertions: [],
      retryCount: 0,
    };

    const mockSuiteResult: TestSuiteResult = {
      name: "Feed Discovery Service",
      filePath: "__tests__/feedDiscoveryService.test.ts",
      category: "integration",
      status: "failed",
      duration: 5000,
      startTime: new Date("2025-01-01T10:00:00Z"),
      endTime: new Date("2025-01-01T10:00:05Z"),
      tests: [mockTestCase],
      errors: [mockError],
      metrics: {
        testCount: 1,
        averageDuration: 150,
        memoryUsed: 1024 * 1024 * 50, // 50MB
        cpuUsed: 25.5,
        networkRequests: 3,
        cacheHits: 2,
        cacheMisses: 1,
      },
      retryCount: 0,
      critical: true,
    };

    const mockSummary: TestSummary = {
      totalSuites: 2,
      passedSuites: 1,
      failedSuites: 1,
      skippedSuites: 0,
      totalTests: 3,
      passedTests: 2,
      failedTests: 1,
      skippedTests: 0,
      totalDuration: 8000,
      overallStatus: "partial",
      criticalFailures: 1,
    };

    const mockMetrics: TestMetrics = {
      performance: {
        averageTestDuration: 150,
        medianTestDuration: 120,
        slowestTests: [mockTestCase],
        fastestTests: [],
        totalExecutionTime: 8000,
        setupTime: 500,
        teardownTime: 300,
      },
      resources: {
        memoryUsage: {
          peak: 1024 * 1024 * 100, // 100MB
          average: 1024 * 1024 * 75, // 75MB
          initial: 1024 * 1024 * 50, // 50MB
          final: 1024 * 1024 * 60, // 60MB
        },
        cpuUsage: {
          average: 45.2,
          peak: 89.5,
          userTime: 2000,
          systemTime: 1000,
        },
      },
    };

    const mockEnvironment: EnvironmentInfo = {
      nodeVersion: "v18.17.0",
      platform: "linux",
      arch: "x64",
      os: "Linux 5.15.0",
      vitestVersion: "^1.0.0",
      timestamp: new Date("2025-01-01T10:00:00Z"),
      gitInfo: {
        branch: "feature/test-reporting",
        commit: "abc123def456",
        author: "Test User",
        message: "Add comprehensive test reporting",
        isDirty: false,
      },
      systemResources: {
        totalMemory: 1024 * 1024 * 1024 * 8, // 8GB
        availableMemory: 1024 * 1024 * 1024 * 4, // 4GB
        cpuCores: 8,
        diskSpace: 1024 * 1024 * 1024 * 500, // 500GB
      },
    };

    mockResults = {
      summary: mockSummary,
      suiteResults: [mockSuiteResult],
      metrics: mockMetrics,
      environment: mockEnvironment,
      timestamp: new Date("2025-01-01T10:00:00Z"),
      duration: 8000,
      configUsed: {
        testSuites: [],
        reportConfig: mockConfig,
        executionConfig: {
          maxParallelSuites: 3,
          globalTimeout: 300000,
          continueOnFailure: true,
          collectCoverage: false,
          retryFailedTests: true,
          generateTimestamp: true,
        },
      },
    };
  });

  describe("generateReport", () => {
    it("should generate a complete markdown report", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("# 📊 Relatório de Testes Completos");
      expect(report).toContain("## 📋 Resumo Executivo");
      expect(report).toContain("## 🖥️ Ambiente de Execução");
      expect(report).toContain("## 🧪 Resultados por Conjunto de Testes");
      expect(report).toContain("## 🔍 Análise de Falhas");
      expect(report).toContain("## ⚡ Análise de Performance");
      expect(report).toContain("## 💡 Recomendações");
    });

    it("should include timestamp and duration in header", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**Data de Execução:** 01/01/2025, 10:00:00");
      expect(report).toContain("**Duração Total:** 8.00s");
      expect(report).toContain("**Status:** ⚠️ PARTIAL");
    });

    it("should respect configuration options", () => {
      const minimalConfig: ReportConfig = {
        ...mockConfig,
        includeStackTraces: false,
        includeMetrics: false,
        includeEnvironmentInfo: false,
        includeSuggestions: false,
        detailLevel: "summary",
      };

      const minimalGenerator = new MarkdownReportGenerator(minimalConfig);
      const report = minimalGenerator.generateReport(mockResults);

      expect(report).not.toContain("## 🖥️ Ambiente de Execução");
      expect(report).not.toContain("## ⚡ Análise de Performance");
      expect(report).not.toContain("Stack Trace");
      expect(report).not.toContain("💡 Sugestões");
    });
  });

  describe("Executive Summary", () => {
    it("should display correct status and metrics", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### Status Geral: ⚠️ PARTIAL");
      expect(report).toContain("| **Conjuntos de Testes** | 1/2 | 50% |");
      expect(report).toContain("| **Testes Individuais** | 2/3 | 67% |");
      expect(report).toContain("| **Falhas Críticas** | 1 | - |");
    });

    it("should show critical failure warning", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain(
        "⚠️ **ATENÇÃO:** 1 falha(s) crítica(s) detectada(s)"
      );
    });

    it("should include quality indicator", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**Indicador de Qualidade:**");
      expect(report).toMatch(/🟡 Bom|🟠 Regular|🔴 Crítico/);
    });
  });

  describe("Environment Information", () => {
    it("should display system information in table format", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("| **Node.js** | v18.17.0 |");
      expect(report).toContain("| **Sistema Operacional** | Linux 5.15.0 |");
      expect(report).toContain("| **Plataforma** | linux (x64) |");
      expect(report).toContain("| **Memória Total** | 8.00 GB |");
      expect(report).toContain("| **CPUs** | 8 cores |");
    });

    it("should include git information when available", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### 📝 Informações do Git");
      expect(report).toContain("| **Branch** | `feature/test-reporting` |");
      expect(report).toContain("| **Commit** | `abc123de` |");
      expect(report).toContain("| **Estado** | ✅ Limpo |");
    });
  });

  describe("Test Suite Results", () => {
    it("should display suite summary table", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### Resumo dos Conjuntos");
      expect(report).toContain(
        "| Conjunto | Status | Categoria | Duração | Testes | Taxa de Sucesso |"
      );
      expect(report).toContain(
        "| Feed Discovery Service 🔴 | ❌ failed | integration | 5.00s | 1 | 0% |"
      );
    });

    it("should display detailed suite information", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("#### Feed Discovery Service ❌ 🔴 **CRÍTICO**");
      expect(report).toContain(
        "**Arquivo:** `__tests__/feedDiscoveryService.test.ts`"
      );
      expect(report).toContain("**Categoria:** integration");
      expect(report).toContain("**Duração:** 5.00s");
    });

    it("should include suite metrics when enabled", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**Métricas:**");
      expect(report).toContain("- ⏱️ Duração Média: 150.00ms");
      expect(report).toContain("- 🧠 Memória Usada: 50.00 MB");
      expect(report).toContain("- 🔄 CPU: 25.5%");
      expect(report).toContain("- 🌐 Requisições de Rede: 3");
    });
  });

  describe("Error Reporting", () => {
    it("should display detailed error information", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**1. 🟡 ASSERTION FAILURE**");
      expect(report).toContain(
        "**Mensagem:** Expected 'true' but received 'false'"
      );
      expect(report).toContain("**Localização:** `test.js:10:5`");
    });

    it("should show expected vs actual values", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**Comparação:**");
      expect(report).toContain("- **Esperado:** `true`");
      expect(report).toContain("- **Recebido:** `false`");
    });

    it("should include stack trace when enabled", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("<details>");
      expect(report).toContain("<summary>📋 Stack Trace</summary>");
      expect(report).toContain("Error: Test failed");
    });

    it("should include suggestions when enabled", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("**💡 Sugestões:**");
      expect(report).toContain(
        "- Verifique se os valores esperados estão corretos"
      );
      expect(report).toContain(
        "- Confirme se o estado do sistema está como esperado"
      );
    });
  });

  describe("Failure Analysis", () => {
    it("should provide failure summary", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("## 🔍 Análise de Falhas");
      expect(report).toContain("| **Conjuntos com Falhas** | 1 |");
      expect(report).toContain("| **Conjuntos Críticos com Falhas** | 1 |");
      expect(report).toContain("| **Total de Erros** | 1 |");
    });

    it("should categorize failures", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### Falhas por Categoria");
      expect(report).toContain("| assertion failure | 1 |");
    });
  });

  describe("Performance Metrics", () => {
    it("should display general performance metrics", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("## ⚡ Análise de Performance");
      expect(report).toContain("| **Tempo Médio por Teste** | 150.00ms |");
      expect(report).toContain("| **Tempo Mediano por Teste** | 120.00ms |");
      expect(report).toContain("| **Tempo Total de Execução** | 8.00s |");
    });

    it("should display resource usage", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### Uso de Recursos");
      expect(report).toContain(
        "| **Memória** | 100.00 MB | 75.00 MB | 50.00 MB | 60.00 MB |"
      );
      expect(report).toContain("| **CPU** | 89.5% | 45.2% | - | - |");
    });

    it("should list slowest tests", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### 🐌 Testes Mais Lentos");
      expect(report).toContain(
        "| should validate feed URL | 150ms | ❌ failed |"
      );
    });
  });

  describe("Recommendations", () => {
    it("should provide immediate actions for critical failures", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("## 💡 Recomendações");
      expect(report).toContain(
        "🚨 **CRÍTICO:** 1 falha(s) crítica(s) detectada(s)"
      );
      expect(report).toContain(
        "🔍 Investigue imediatamente os conjuntos críticos"
      );
    });

    it("should suggest next steps", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("### 📈 Próximos Passos");
      expect(report).toContain(
        "📊 Configure execução regular destes testes em CI/CD"
      );
      expect(report).toContain("📈 Implemente coleta de métricas históricas");
    });
  });

  describe("Formatting Utilities", () => {
    it("should format durations correctly", () => {
      const report = reportGenerator.generateReport(mockResults);

      // Test various duration formats
      expect(report).toContain("150ms"); // < 1 second
      expect(report).toContain("5.00s"); // seconds
      expect(report).toContain("8.00s"); // total duration
    });

    it("should format bytes correctly", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("50.00 MB");
      expect(report).toContain("75.00 MB");
      expect(report).toContain("100.00 MB");
      expect(report).toContain("8.00 GB");
    });

    it("should use appropriate status icons", () => {
      const report = reportGenerator.generateReport(mockResults);

      expect(report).toContain("✅"); // passed
      expect(report).toContain("❌"); // failed
      expect(report).toContain("⚠️"); // partial
      expect(report).toContain("🔴"); // critical
    });
  });

  describe("Verbose Mode", () => {
    it("should include appendices in verbose mode", () => {
      const verboseConfig: ReportConfig = {
        ...mockConfig,
        detailLevel: "verbose",
      };

      const verboseGenerator = new MarkdownReportGenerator(verboseConfig);
      const report = verboseGenerator.generateReport(mockResults);

      expect(report).toContain("## 📎 Apêndices");
      expect(report).toContain("### A. Configuração de Testes");
      expect(report).toContain("### B. Dados Brutos (JSON)");
    });

    it("should include individual test details in verbose mode", () => {
      const verboseConfig: ReportConfig = {
        ...mockConfig,
        detailLevel: "verbose",
      };

      const verboseGenerator = new MarkdownReportGenerator(verboseConfig);
      const report = verboseGenerator.generateReport(mockResults);

      expect(report).toContain("**Testes Individuais:**");
      expect(report).toContain(
        "| should validate feed URL | ❌ failed | 150ms |"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty test results", () => {
      const emptyResults: TestExecutionResult = {
        ...mockResults,
        suiteResults: [],
        summary: {
          ...mockResults.summary,
          totalSuites: 0,
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          criticalFailures: 0,
          overallStatus: "passed",
        },
      };

      const report = reportGenerator.generateReport(emptyResults);

      expect(report).toContain("# 📊 Relatório de Testes Completos");
      expect(report).toContain("**Status:** ✅ PASSED");
      expect(report).not.toContain("## 🔍 Análise de Falhas");
    });

    it("should handle missing optional data", () => {
      const minimalResults: TestExecutionResult = {
        ...mockResults,
        environment: {
          ...mockResults.environment,
          gitInfo: undefined,
          ciInfo: undefined,
        },
      };

      const report = reportGenerator.generateReport(minimalResults);

      expect(report).toContain("# 📊 Relatório de Testes Completos");
      expect(report).not.toContain("### 📝 Informações do Git");
      expect(report).not.toContain("### 🔄 Informações de CI/CD");
    });

    it("should handle very long error messages", () => {
      const longErrorMessage = "A".repeat(200);
      const resultsWithLongError: TestExecutionResult = {
        ...mockResults,
        suiteResults: [
          {
            ...mockResults.suiteResults[0],
            errors: [
              {
                ...mockResults.suiteResults[0].errors[0],
                message: longErrorMessage,
              },
            ],
          },
        ],
      };

      const report = reportGenerator.generateReport(resultsWithLongError);

      expect(report).toContain("**Mensagem:** " + longErrorMessage);
    });
  });
});
