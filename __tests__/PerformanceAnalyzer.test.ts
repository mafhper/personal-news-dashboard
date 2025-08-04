/**
 * PerformanceAnalyzer.test.ts
 *
 * Testes unitários para o sistema de análise de performance
 * Valida identificação de testes lentos, detecção de degradação e alertas
 */

import { describe, it, expect, beforeEach } from "vitest";
import PerformanceAnalyzer from "./PerformanceAnalyzer";
import { TestSuiteResult, PerformanceMetrics } from "./types/testOrchestrator";

describe("PerformanceAnalyzer", () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe("Inicialização", () => {
    it("deve criar uma instância do PerformanceAnalyzer", () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(PerformanceAnalyzer);
    });

    it("deve aceitar thresholds customizados", () => {
      const customAnalyzer = new PerformanceAnalyzer({
        slowTestThreshold: 2000,
        degradationThreshold: 30,
      });

      expect(customAnalyzer).toBeDefined();
    });
  });

  describe("Identificação de Testes Lentos", () => {
    it("deve identificar testes lentos corretamente", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 5000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "fast test",
              fullName: "Test Suite fast test",
              status: "passed",
              duration: 100, // Rápido
              assertions: [],
              retryCount: 0,
            },
            {
              name: "slow test",
              fullName: "Test Suite slow test",
              status: "passed",
              duration: 2000, // Lento
              assertions: [],
              retryCount: 0,
            },
            {
              name: "very slow test",
              fullName: "Test Suite very slow test",
              status: "passed",
              duration: 6000, // Muito lento
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

      const slowTests = analyzer.identifySlowTests(suiteResults);

      expect(slowTests).toHaveLength(2); // slow test e very slow test
      expect(slowTests[0].testName).toBe("Test Suite very slow test");
      expect(slowTests[0].category).toBe("critical");
      expect(slowTests[1].testName).toBe("Test Suite slow test");
      expect(slowTests[1].category).toBe("very_slow"); // 2000ms é 2x o threshold de 1000ms
    });

    it("deve calcular percentis corretamente", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 5000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 100,
              assertions: [],
              retryCount: 0,
            },
            {
              name: "test2",
              fullName: "Test Suite test2",
              status: "passed",
              duration: 500,
              assertions: [],
              retryCount: 0,
            },
            {
              name: "test3",
              fullName: "Test Suite test3",
              status: "passed",
              duration: 1500,
              assertions: [],
              retryCount: 0,
            },
            {
              name: "test4",
              fullName: "Test Suite test4",
              status: "passed",
              duration: 3000,
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

      const slowTests = analyzer.identifySlowTests(suiteResults);

      expect(slowTests).toHaveLength(2); // test3 e test4
      expect(slowTests[0].percentileRank).toBeGreaterThan(0);
      expect(slowTests[1].percentileRank).toBeGreaterThan(0);
    });
  });

  describe("Detecção de Degradação", () => {
    it("deve detectar degradação quando não há dados históricos", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 2000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 1000,
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

      const degradations = analyzer.detectPerformanceDegradation(suiteResults);

      expect(degradations).toHaveLength(0); // Sem dados históricos
    });

    it("deve detectar degradação com dados históricos", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 2000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 1500, // Mais lento que antes
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

      // Adicionar dados históricos primeiro
      analyzer.addHistoricalData([
        {
          ...suiteResults[0],
          tests: [
            {
              ...suiteResults[0].tests[0],
              duration: 1000, // Duração anterior
            },
          ],
        },
      ]);

      const degradations = analyzer.detectPerformanceDegradation(suiteResults);

      expect(degradations).toHaveLength(1);
      expect(degradations[0].testName).toBe("Test Suite test1");
      expect(degradations[0].changePercentage).toBe(50); // 50% mais lento
      expect(degradations[0].trend).toBe("degrading");
      expect(degradations[0].isSignificant).toBe(true);
    });
  });

  describe("Geração de Alertas", () => {
    it("deve gerar alertas para testes lentos", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 8000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "critical slow test",
              fullName: "Test Suite critical slow test",
              status: "passed",
              duration: 7000, // Muito lento
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

      const metrics: PerformanceMetrics = {
        averageTestDuration: 7000,
        medianTestDuration: 7000,
        slowestTests: suiteResults[0].tests,
        fastestTests: [],
        totalExecutionTime: 8000,
        setupTime: 100,
        teardownTime: 50,
      };

      const alerts = analyzer.generatePerformanceAlerts(suiteResults, metrics);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("slow_test");
      expect(alerts[0].severity).toBe("critical");
      expect(alerts[0].testName).toBe("Test Suite critical slow test");
    });

    it("deve gerar alertas para risco de timeout", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 25000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "timeout risk test",
              fullName: "Test Suite timeout risk test",
              status: "passed",
              duration: 25000, // Próximo do timeout de 30s
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

      const metrics: PerformanceMetrics = {
        averageTestDuration: 25000,
        medianTestDuration: 25000,
        slowestTests: suiteResults[0].tests,
        fastestTests: [],
        totalExecutionTime: 25000,
        setupTime: 100,
        teardownTime: 50,
      };

      const alerts = analyzer.generatePerformanceAlerts(suiteResults, metrics);

      const timeoutAlerts = alerts.filter((a) => a.type === "timeout_risk");
      expect(timeoutAlerts.length).toBeGreaterThan(0);
      expect(timeoutAlerts[0].severity).toBe("high");
    });
  });

  describe("Dados Históricos", () => {
    it("deve adicionar e recuperar dados históricos", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 1000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 500,
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

      analyzer.addHistoricalData(suiteResults);

      const exported = analyzer.exportHistoricalData();
      expect(exported["Test Suite test1"]).toBeDefined();
      expect(exported["Test Suite test1"]).toHaveLength(1);
      expect(exported["Test Suite test1"][0].duration).toBe(500);
    });

    it("deve limpar dados históricos", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 1000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 500,
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

      analyzer.addHistoricalData(suiteResults);

      let exported = analyzer.exportHistoricalData();
      expect(Object.keys(exported)).toHaveLength(1);

      analyzer.clearHistoricalData();

      exported = analyzer.exportHistoricalData();
      expect(Object.keys(exported)).toHaveLength(0);
    });
  });

  describe("Relatório de Performance", () => {
    it("deve gerar relatório completo de performance", () => {
      const suiteResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 3000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "fast test",
              fullName: "Test Suite fast test",
              status: "passed",
              duration: 100,
              assertions: [],
              retryCount: 0,
            },
            {
              name: "slow test",
              fullName: "Test Suite slow test",
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

      const metrics: PerformanceMetrics = {
        averageTestDuration: 1050,
        medianTestDuration: 1050,
        slowestTests: [suiteResults[0].tests[1]],
        fastestTests: [suiteResults[0].tests[0]],
        totalExecutionTime: 3000,
        setupTime: 150,
        teardownTime: 90,
      };

      const report = analyzer.generatePerformanceReport(suiteResults, metrics);

      expect(report.summary.totalTests).toBe(2);
      expect(report.summary.slowTests).toBe(0); // 2000ms é categorizado como "very_slow", não "slow"
      expect(report.summary.averageDuration).toBe(1050);
      expect(report.slowTests).toHaveLength(1);
      expect(report.recommendations).toHaveLength(1);
      expect(report.trends).toBeDefined();
    });
  });

  describe("Cálculo de Tendências", () => {
    it("deve calcular tendências com dados suficientes", () => {
      // Adicionar dados históricos simulando degradação
      const baseResults: TestSuiteResult[] = [
        {
          name: "Test Suite",
          filePath: "__tests__/example.test.ts",
          category: "unit",
          status: "passed",
          duration: 1000,
          startTime: new Date(),
          endTime: new Date(),
          tests: [
            {
              name: "test1",
              fullName: "Test Suite test1",
              status: "passed",
              duration: 500,
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

      // Simular múltiplas execuções com degradação
      for (let i = 0; i < 6; i++) {
        const results = [
          {
            ...baseResults[0],
            tests: [
              {
                ...baseResults[0].tests[0],
                duration: 500 + i * 100, // Degradação gradual
              },
            ],
          },
        ];
        analyzer.addHistoricalData(results);
      }

      const trends = analyzer.calculateTrendMetrics();

      expect(trends.performanceTrend).toBe("degrading");
      expect(trends.historicalData).toHaveLength(6);
    });
  });
});
