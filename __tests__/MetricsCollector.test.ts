import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector } from "./MetricsCollector";
import { TestSuiteResult } from "./types/testOrchestrator";

describe("MetricsCollector", () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  describe("Inicialização", () => {
    it("deve criar uma instância do MetricsCollector", () => {
      expect(metricsCollector).toBeDefined();
      expect(metricsCollector).toBeInstanceOf(MetricsCollector);
    });
  });

  describe("Coleta de Métricas Básicas", () => {
    it("deve iniciar e finalizar coleta de métricas para um teste", () => {
      const testId = "test-1";

      metricsCollector.startTestMetrics(testId);

      // Simular algum tempo de execução
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Simular trabalho
      }

      const metrics = metricsCollector.endTestMetrics(testId);

      expect(metrics).toBeDefined();
      expect(metrics!.duration).toBeGreaterThan(0);
      expect(metrics!.startSnapshot).toBeDefined();
      expect(metrics!.endSnapshot).toBeDefined();
    });

    it("deve retornar null ao finalizar métricas de teste não iniciado", () => {
      const testId = "test-inexistente";
      const metrics = metricsCollector.endTestMetrics(testId);
      expect(metrics).toBeNull();
    });
  });

  describe("Coleta de Métricas de Suite", () => {
    it("deve coletar métricas básicas de uma suite de testes", () => {
      const suiteResult: TestSuiteResult = {
        name: "Test Suite",
        filePath: "__tests__/example.test.ts",
        category: "unit",
        status: "passed",
        duration: 5000,
        startTime: new Date(),
        endTime: new Date(),
        tests: [
          {
            name: "test 1",
            fullName: "Test Suite test 1",
            status: "passed",
            duration: 1000,
            assertions: [],
            retryCount: 0,
          },
          {
            name: "test 2",
            fullName: "Test Suite test 2",
            status: "passed",
            duration: 2000,
            assertions: [],
            retryCount: 0,
          },
        ],
        errors: [],
        metrics: {
          testCount: 0,
          averageDuration: 0,
          memoryUsed: 0,
          cpuUsed: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0,
        },
        retryCount: 0,
        critical: false,
      };

      const metrics = metricsCollector.collectSuiteMetrics(suiteResult);

      expect(metrics.testCount).toBe(2);
      expect(metrics.averageDuration).toBe(1500);
      expect(metrics.memoryUsed).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cálculo de Métricas de Performance", () => {
    it("deve calcular métricas de performance agregadas", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Suite 1",
          filePath: "__tests__/suite1.test.ts",
          category: "unit",
          status: "passed",
          duration: 3000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "fast test",
              fullName: "Suite 1 fast test",
              status: "passed",
              duration: 100,
              assertions: [],
              retryCount: 0,
            },
            {
              name: "slow test",
              fullName: "Suite 1 slow test",
              status: "passed",
              duration: 2000,
              assertions: [],
              retryCount: 0,
            },
          ],
          errors: [],
          metrics: {
            testCount: 0,
            averageDuration: 0,
            memoryUsed: 0,
            cpuUsed: 0,
            networkRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
          },
          retryCount: 0,
          critical: false,
        },
      ];

      const metrics =
        metricsCollector.calculatePerformanceMetrics(suiteResults);

      expect(metrics.totalExecutionTime).toBe(3000);
      expect(metrics.averageTestDuration).toBe(1050);
      expect(metrics.slowestTests).toHaveLength(2);
      expect(metrics.fastestTests).toHaveLength(2);
      expect(metrics.setupTime).toBeGreaterThan(0);
      expect(metrics.teardownTime).toBeGreaterThan(0);
    });
  });

  describe("Exportação e Limpeza", () => {
    it("deve exportar métricas completas", () => {
      const testId = "export-test";

      metricsCollector.startTestMetrics(testId);

      const start = Date.now();
      while (Date.now() - start < 5) {
        // Simular trabalho
      }

      metricsCollector.endTestMetrics(testId);

      const exported = metricsCollector.exportMetrics();

      expect(exported.systemBaseline).toBeDefined();
      expect(exported.testMetrics).toBeDefined();
      expect(exported.testMetrics[testId]).toBeDefined();
      expect(exported.testMetrics[testId]).toHaveLength(1);
      expect(exported.summary.totalTests).toBe(1);
      expect(exported.summary.totalExecutions).toBe(1);
      expect(exported.summary.averageExecutionTime).toBeGreaterThan(0);
    });

    it("deve limpar histórico de métricas", () => {
      const testId = "cleanup-test";

      metricsCollector.startTestMetrics(testId);

      const start = Date.now();
      while (Date.now() - start < 5) {
        // Simular trabalho
      }

      metricsCollector.endTestMetrics(testId);

      let stats = metricsCollector.getTestStatistics(testId);
      expect(stats).toBeDefined();

      metricsCollector.clearMetricsHistory();

      stats = metricsCollector.getTestStatistics(testId);
      expect(stats).toBeNull();
    });
  });
});
