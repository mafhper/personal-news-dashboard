/**
 * PerformanceAnalyzer.ts
 *
 * Sistema de análise de performance para testes
 * Identifica testes lentos, detecta degradação e compara execuções
 */

import {
  TestSuiteResult,
  TestCaseResult,
  PerformanceMetrics,
  TrendMetrics,
  HistoricalDataPoint,
} from "./types/testOrchestrator";

export interface PerformanceThresholds {
  slowTestThreshold: number; // ms
  verySlowTestThreshold: number; // ms
  degradationThreshold: number; // percentage
  significantDegradationThreshold: number; // percentage
  memoryLeakThreshold: number; // bytes
  cpuUsageThreshold: number; // percentage
}

export interface PerformanceAlert {
  type:
    | "slow_test"
    | "degradation"
    | "memory_leak"
    | "cpu_spike"
    | "timeout_risk";
  severity: "low" | "medium" | "high" | "critical";
  testName: string;
  message: string;
  currentValue: number;
  threshold: number;
  suggestion: string;
  trend?: "improving" | "stable" | "degrading";
}

export interface PerformanceComparison {
  testName: string;
  currentDuration: number;
  previousDuration: number;
  changePercentage: number;
  trend: "improving" | "stable" | "degrading";
  isSignificant: boolean;
}

export interface SlowTestAnalysis {
  testName: string;
  duration: number;
  category: "slow" | "very_slow" | "critical";
  percentileRank: number;
  suggestion: string;
}

export class PerformanceAnalyzer {
  private thresholds: PerformanceThresholds;
  private historicalData: Map<string, HistoricalDataPoint[]> = new Map();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      slowTestThreshold: 1000, // 1 segundo
      verySlowTestThreshold: 5000, // 5 segundos
      degradationThreshold: 20, // 20%
      significantDegradationThreshold: 50, // 50%
      memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
      cpuUsageThreshold: 80, // 80%
      ...thresholds,
    };
  }

  /**
   * Identifica testes lentos baseado nos thresholds configurados
   */
  identifySlowTests(suiteResults: TestSuiteResult[]): SlowTestAnalysis[] {
    const allTests = suiteResults.flatMap((suite) => suite.tests);
    const durations = allTests
      .map((test) => test.duration)
      .sort((a, b) => a - b);

    const slowTests: SlowTestAnalysis[] = [];

    for (const test of allTests) {
      if (test.duration >= this.thresholds.slowTestThreshold) {
        const percentileRank = this.calculatePercentileRank(
          test.duration,
          durations
        );

        let category: "slow" | "very_slow" | "critical";
        let suggestion: string;

        if (test.duration >= this.thresholds.verySlowTestThreshold) {
          category = "critical";
          suggestion = `Teste extremamente lento (${test.duration}ms). Considere dividir em testes menores ou otimizar a lógica de teste.`;
        } else if (test.duration >= this.thresholds.slowTestThreshold * 2) {
          category = "very_slow";
          suggestion = `Teste muito lento (${test.duration}ms). Verifique se há operações desnecessárias ou mocks que podem ser otimizados.`;
        } else {
          category = "slow";
          suggestion = `Teste lento (${test.duration}ms). Considere otimizar ou adicionar timeouts mais específicos.`;
        }

        slowTests.push({
          testName: test.fullName,
          duration: test.duration,
          category,
          percentileRank,
          suggestion,
        });
      }
    }

    return slowTests.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Detecta degradação de performance comparando com execuções anteriores
   */
  detectPerformanceDegradation(
    currentResults: TestSuiteResult[],
    testName?: string
  ): PerformanceComparison[] {
    const comparisons: PerformanceComparison[] = [];
    const allTests = currentResults.flatMap((suite) => suite.tests);

    for (const test of allTests) {
      if (testName && test.fullName !== testName) {
        continue;
      }

      const historical = this.historicalData.get(test.fullName);
      if (!historical || historical.length === 0) {
        continue;
      }

      const previousExecution = historical[historical.length - 1];
      const changePercentage =
        ((test.duration - previousExecution.duration) /
          previousExecution.duration) *
        100;

      let trend: "improving" | "stable" | "degrading";
      if (changePercentage > this.thresholds.degradationThreshold) {
        trend = "degrading";
      } else if (changePercentage < -this.thresholds.degradationThreshold) {
        trend = "improving";
      } else {
        trend = "stable";
      }

      const isSignificant =
        Math.abs(changePercentage) >= this.thresholds.degradationThreshold;

      comparisons.push({
        testName: test.fullName,
        currentDuration: test.duration,
        previousDuration: previousExecution.duration,
        changePercentage,
        trend,
        isSignificant,
      });
    }

    return comparisons.sort(
      (a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage)
    );
  }

  /**
   * Gera alertas baseados na análise de performance
   */
  generatePerformanceAlerts(
    suiteResults: TestSuiteResult[],
    metrics: PerformanceMetrics
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Alertas para testes lentos
    const slowTests = this.identifySlowTests(suiteResults);
    for (const slowTest of slowTests) {
      let severity: "low" | "medium" | "high" | "critical";

      switch (slowTest.category) {
        case "critical":
          severity = "critical";
          break;
        case "very_slow":
          severity = "high";
          break;
        default:
          severity = "medium";
      }

      alerts.push({
        type: "slow_test",
        severity,
        testName: slowTest.testName,
        message: `Teste lento detectado: ${slowTest.duration}ms (${slowTest.percentileRank}º percentil)`,
        currentValue: slowTest.duration,
        threshold: this.thresholds.slowTestThreshold,
        suggestion: slowTest.suggestion,
      });
    }

    // Alertas para degradação de performance
    const degradations = this.detectPerformanceDegradation(suiteResults);
    for (const degradation of degradations) {
      if (degradation.trend === "degrading" && degradation.isSignificant) {
        const severity =
          degradation.changePercentage >=
          this.thresholds.significantDegradationThreshold
            ? "critical"
            : "high";

        alerts.push({
          type: "degradation",
          severity,
          testName: degradation.testName,
          message: `Degradação de performance detectada: ${degradation.changePercentage.toFixed(
            1
          )}% mais lento`,
          currentValue: degradation.currentDuration,
          threshold: degradation.previousDuration,
          suggestion: `Teste está ${degradation.changePercentage.toFixed(
            1
          )}% mais lento que a execução anterior. Investigue mudanças recentes no código.`,
          trend: degradation.trend,
        });
      }
    }

    // Alertas para risco de timeout
    const allTests = suiteResults.flatMap((suite) => suite.tests);
    for (const test of allTests) {
      // Assumindo timeout padrão de 30 segundos
      const timeoutThreshold = 30000;
      const riskThreshold = timeoutThreshold * 0.8; // 80% do timeout

      if (test.duration >= riskThreshold) {
        alerts.push({
          type: "timeout_risk",
          severity:
            test.duration >= timeoutThreshold * 0.95 ? "critical" : "high",
          testName: test.fullName,
          message: `Teste próximo do timeout: ${test.duration}ms (${(
            (test.duration / timeoutThreshold) *
            100
          ).toFixed(1)}% do limite)`,
          currentValue: test.duration,
          threshold: riskThreshold,
          suggestion:
            "Considere aumentar o timeout ou otimizar o teste para evitar falhas por timeout.",
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Adiciona dados históricos para comparação futura
   */
  addHistoricalData(suiteResults: TestSuiteResult[]): void {
    const timestamp = new Date();
    const allTests = suiteResults.flatMap((suite) => suite.tests);

    for (const test of allTests) {
      if (!this.historicalData.has(test.fullName)) {
        this.historicalData.set(test.fullName, []);
      }

      const historical = this.historicalData.get(test.fullName)!;

      // Calcular taxa de aprovação (assumindo que testes passados = 100%)
      const passRate = test.status === "passed" ? 100 : 0;

      historical.push({
        timestamp,
        duration: test.duration,
        passRate,
        coverage: 0, // Seria calculado se tivéssemos dados de cobertura
      });

      // Manter apenas os últimos 50 registros para evitar uso excessivo de memória
      if (historical.length > 50) {
        historical.shift();
      }
    }
  }

  /**
   * Calcula métricas de tendência baseadas no histórico
   */
  calculateTrendMetrics(testName?: string): TrendMetrics {
    let performanceTrend: "improving" | "stable" | "degrading" = "stable";
    let reliabilityTrend: "improving" | "stable" | "degrading" = "stable";
    let coverageTrend: "improving" | "stable" | "degrading" = "stable";

    const relevantData = testName
      ? [this.historicalData.get(testName) || []]
      : Array.from(this.historicalData.values());

    if (relevantData.length > 0) {
      // Calcular tendência de performance
      const allDurations = relevantData.flat().map((d) => d.duration);
      if (allDurations.length >= 3) {
        const recent = allDurations.slice(-3);
        const older = allDurations.slice(-6, -3);

        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          const change = ((recentAvg - olderAvg) / olderAvg) * 100;

          if (change > 10) {
            performanceTrend = "degrading";
          } else if (change < -10) {
            performanceTrend = "improving";
          }
        }
      }

      // Calcular tendência de confiabilidade
      const allPassRates = relevantData.flat().map((d) => d.passRate);
      if (allPassRates.length >= 3) {
        const recent = allPassRates.slice(-3);
        const older = allPassRates.slice(-6, -3);

        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

          if (recentAvg > olderAvg + 5) {
            reliabilityTrend = "improving";
          } else if (recentAvg < olderAvg - 5) {
            reliabilityTrend = "degrading";
          }
        }
      }
    }

    return {
      performanceTrend,
      reliabilityTrend,
      coverageTrend,
      historicalData: testName
        ? this.historicalData.get(testName) || []
        : relevantData.flat().slice(-20), // Últimos 20 pontos
    };
  }

  /**
   * Gera relatório de análise de performance
   */
  generatePerformanceReport(
    suiteResults: TestSuiteResult[],
    metrics: PerformanceMetrics
  ): {
    summary: {
      totalTests: number;
      slowTests: number;
      criticalTests: number;
      averageDuration: number;
      totalDuration: number;
    };
    slowTests: SlowTestAnalysis[];
    degradations: PerformanceComparison[];
    alerts: PerformanceAlert[];
    trends: TrendMetrics;
    recommendations: string[];
  } {
    const allTests = suiteResults.flatMap((suite) => suite.tests);
    const slowTests = this.identifySlowTests(suiteResults);
    const degradations = this.detectPerformanceDegradation(suiteResults);
    const alerts = this.generatePerformanceAlerts(suiteResults, metrics);
    const trends = this.calculateTrendMetrics();

    const summary = {
      totalTests: allTests.length,
      slowTests: slowTests.filter((t) => t.category === "slow").length,
      criticalTests: slowTests.filter((t) => t.category === "critical").length,
      averageDuration: metrics.averageTestDuration,
      totalDuration: metrics.totalExecutionTime,
    };

    const recommendations = this.generateRecommendations(
      slowTests,
      degradations,
      alerts
    );

    return {
      summary,
      slowTests,
      degradations,
      alerts,
      trends,
      recommendations,
    };
  }

  /**
   * Limpa dados históricos
   */
  clearHistoricalData(): void {
    this.historicalData.clear();
  }

  /**
   * Exporta dados históricos
   */
  exportHistoricalData(): { [testName: string]: HistoricalDataPoint[] } {
    const exported: { [testName: string]: HistoricalDataPoint[] } = {};
    for (const [testName, data] of this.historicalData.entries()) {
      exported[testName] = [...data];
    }
    return exported;
  }

  // Métodos privados

  /**
   * Calcula o percentil de um valor em um array ordenado
   */
  private calculatePercentileRank(
    value: number,
    sortedArray: number[]
  ): number {
    const index = sortedArray.findIndex((v) => v >= value);
    if (index === -1) return 100;
    return Math.round((index / sortedArray.length) * 100);
  }

  /**
   * Gera recomendações baseadas na análise
   */
  private generateRecommendations(
    slowTests: SlowTestAnalysis[],
    degradations: PerformanceComparison[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (slowTests.length > 0) {
      recommendations.push(
        `Foram identificados ${slowTests.length} testes lentos. Considere otimizar os testes mais críticos primeiro.`
      );
    }

    if (degradations.filter((d) => d.trend === "degrading").length > 0) {
      recommendations.push(
        "Detectada degradação de performance em alguns testes. Revise mudanças recentes no código."
      );
    }

    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      recommendations.push(
        `${criticalAlerts.length} alertas críticos de performance requerem atenção imediata.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Performance dos testes está dentro dos parâmetros aceitáveis."
      );
    }

    return recommendations;
  }
}

export default PerformanceAnalyzer;
