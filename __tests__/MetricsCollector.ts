/**
 * MetricsCollector.ts
 *
 * Sistema de coleta de métricas avançadas para testes
 * Coleta tempo de execução detalhado, uso de memória, CPU e estatísticas agregadas
 */

import { performance } from "perf_hooks";
import {
  TestSuiteResult,
  TestCaseResult,
  PerformanceMetrics,
  ResourceMetrics,
  MemoryUsage,
  CpuUsage,
  SuiteMetrics,
  TestMetrics,
  MemoryLeak,
} from "./types/testOrchestrator";

export interface MetricsSnapshot {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  performanceNow: number;
}

export interface TestExecutionMetrics {
  startSnapshot: MetricsSnapshot;
  endSnapshot: MetricsSnapshot;
  duration: number;
  memoryDelta: number;
  cpuDelta: {
    user: number;
    system: number;
  };
}

export class MetricsCollector {
  private metricsHistory: Map<string, TestExecutionMetrics[]> = new Map();
  private currentTestMetrics: Map<string, MetricsSnapshot> = new Map();
  private systemBaseline: MetricsSnapshot;

  constructor() {
    this.systemBaseline = this.captureSnapshot();
  }

  /**
   * Inicia coleta de métricas para um teste específico
   */
  startTestMetrics(testId: string): void {
    const snapshot = this.captureSnapshot();
    this.currentTestMetrics.set(testId, snapshot);
  }

  /**
   * Finaliza coleta de métricas para um teste específico
   */
  endTestMetrics(testId: string): TestExecutionMetrics | null {
    const startSnapshot = this.currentTestMetrics.get(testId);
    if (!startSnapshot) {
      console.warn(`Métricas não encontradas para teste: ${testId}`);
      return null;
    }

    const endSnapshot = this.captureSnapshot();
    const metrics = this.calculateTestMetrics(startSnapshot, endSnapshot);

    // Armazenar no histórico
    if (!this.metricsHistory.has(testId)) {
      this.metricsHistory.set(testId, []);
    }
    this.metricsHistory.get(testId)!.push(metrics);

    // Limpar métricas atuais
    this.currentTestMetrics.delete(testId);

    return metrics;
  }

  /**
   * Coleta métricas detalhadas para um conjunto de testes
   */
  collectSuiteMetrics(suiteResult: TestSuiteResult): SuiteMetrics {
    const testCount = suiteResult.tests.length;
    const totalDuration = suiteResult.tests.reduce(
      (sum, test) => sum + test.duration,
      0
    );
    const averageDuration = testCount > 0 ? totalDuration / testCount : 0;

    // Calcular uso de memória baseado nos testes executados
    let totalMemoryUsed = 0;
    let totalCpuUsed = 0;
    let networkRequests = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    // Coletar métricas dos testes individuais
    for (const test of suiteResult.tests) {
      const testMetrics = this.metricsHistory.get(test.fullName);
      if (testMetrics && testMetrics.length > 0) {
        const latestMetrics = testMetrics[testMetrics.length - 1];
        totalMemoryUsed += latestMetrics.memoryDelta;
        totalCpuUsed +=
          latestMetrics.cpuDelta.user + latestMetrics.cpuDelta.system;
      }

      // Estimar métricas de rede e cache baseado no tipo de teste
      if (
        test.name.toLowerCase().includes("network") ||
        test.name.toLowerCase().includes("fetch") ||
        test.name.toLowerCase().includes("api")
      ) {
        networkRequests += this.estimateNetworkRequests(test);
      }

      if (test.name.toLowerCase().includes("cache")) {
        const cacheMetrics = this.estimateCacheMetrics(test);
        cacheHits += cacheMetrics.hits;
        cacheMisses += cacheMetrics.misses;
      }
    }

    return {
      testCount,
      averageDuration,
      memoryUsed: totalMemoryUsed,
      cpuUsed: totalCpuUsed,
      networkRequests,
      cacheHits,
      cacheMisses,
    };
  }

  /**
   * Calcula métricas de performance agregadas
   */
  calculatePerformanceMetrics(
    suiteResults: TestSuiteResult[]
  ): PerformanceMetrics {
    const allTests = suiteResults.flatMap((suite) => suite.tests);
    const durations = allTests
      .map((test) => test.duration)
      .filter((d) => d > 0);

    // Calcular estatísticas básicas
    const totalExecutionTime = suiteResults.reduce(
      (sum, suite) => sum + suite.duration,
      0
    );
    const averageTestDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Calcular mediana
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const medianTestDuration =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length / 2)]
        : 0;

    // Identificar testes mais lentos e mais rápidos
    const slowestTests = allTests
      .filter((test) => test.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const fastestTests = allTests
      .filter((test) => test.duration > 0)
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 10);

    // Estimar tempos de setup e teardown
    const setupTime = this.estimateSetupTime(suiteResults);
    const teardownTime = this.estimateTeardownTime(suiteResults);

    return {
      averageTestDuration,
      medianTestDuration,
      slowestTests,
      fastestTests,
      totalExecutionTime,
      setupTime,
      teardownTime,
    };
  }

  /**
   * Calcula métricas de recursos do sistema
   */
  calculateResourceMetrics(suiteResults: TestSuiteResult[]): ResourceMetrics {
    const allTestMetrics = Array.from(this.metricsHistory.values()).flat();

    // Calcular uso de memória
    const memoryUsages = allTestMetrics.map(
      (m) => m.endSnapshot.memoryUsage.heapUsed
    );
    const memoryUsage: MemoryUsage = {
      peak: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      average:
        memoryUsages.length > 0
          ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
          : 0,
      initial: this.systemBaseline.memoryUsage.heapUsed,
      final:
        memoryUsages.length > 0 ? memoryUsages[memoryUsages.length - 1] : 0,
      leaks: this.detectMemoryLeaks(allTestMetrics),
    };

    // Calcular uso de CPU
    const cpuDeltas = allTestMetrics.map(
      (m) => m.cpuDelta.user + m.cpuDelta.system
    );
    const cpuUsage: CpuUsage = {
      average:
        cpuDeltas.length > 0
          ? cpuDeltas.reduce((a, b) => a + b, 0) / cpuDeltas.length
          : 0,
      peak: cpuDeltas.length > 0 ? Math.max(...cpuDeltas) : 0,
      userTime: allTestMetrics.reduce((sum, m) => sum + m.cpuDelta.user, 0),
      systemTime: allTestMetrics.reduce((sum, m) => sum + m.cpuDelta.system, 0),
    };

    return {
      memoryUsage,
      cpuUsage,
    };
  }

  /**
   * Calcula métricas completas do sistema de testes
   */
  calculateCompleteTestMetrics(suiteResults: TestSuiteResult[]): TestMetrics {
    const performance = this.calculatePerformanceMetrics(suiteResults);
    const resources = this.calculateResourceMetrics(suiteResults);

    return {
      performance,
      resources,
    };
  }

  /**
   * Obtém estatísticas agregadas de um teste específico
   */
  getTestStatistics(testId: string): {
    executionCount: number;
    averageDuration: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    trend: "improving" | "stable" | "degrading";
  } | null {
    const metrics = this.metricsHistory.get(testId);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const executionCount = metrics.length;
    const averageDuration =
      metrics.reduce((sum, m) => sum + m.duration, 0) / executionCount;
    const averageMemoryUsage =
      metrics.reduce((sum, m) => sum + m.memoryDelta, 0) / executionCount;
    const averageCpuUsage =
      metrics.reduce((sum, m) => sum + m.cpuDelta.user + m.cpuDelta.system, 0) /
      executionCount;

    // Calcular tendência baseada nas últimas execuções
    const trend = this.calculateTrend(metrics);

    return {
      executionCount,
      averageDuration,
      averageMemoryUsage,
      averageCpuUsage,
      trend,
    };
  }

  /**
   * Limpa histórico de métricas
   */
  clearMetricsHistory(): void {
    this.metricsHistory.clear();
    this.currentTestMetrics.clear();
  }

  /**
   * Exporta métricas para análise externa
   */
  exportMetrics(): {
    systemBaseline: MetricsSnapshot;
    testMetrics: { [testId: string]: TestExecutionMetrics[] };
    summary: {
      totalTests: number;
      totalExecutions: number;
      averageExecutionTime: number;
      totalMemoryUsed: number;
      totalCpuUsed: number;
    };
  } {
    const testMetrics: { [testId: string]: TestExecutionMetrics[] } = {};
    let totalExecutions = 0;
    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;
    let totalCpuUsed = 0;

    for (const [testId, metrics] of this.metricsHistory.entries()) {
      testMetrics[testId] = metrics;
      totalExecutions += metrics.length;
      totalExecutionTime += metrics.reduce((sum, m) => sum + m.duration, 0);
      totalMemoryUsed += metrics.reduce((sum, m) => sum + m.memoryDelta, 0);
      totalCpuUsed += metrics.reduce(
        (sum, m) => sum + m.cpuDelta.user + m.cpuDelta.system,
        0
      );
    }

    return {
      systemBaseline: this.systemBaseline,
      testMetrics,
      summary: {
        totalTests: this.metricsHistory.size,
        totalExecutions,
        averageExecutionTime:
          totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
        totalMemoryUsed,
        totalCpuUsed,
      },
    };
  }

  // Métodos privados

  /**
   * Captura snapshot atual do sistema
   */
  private captureSnapshot(): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      performanceNow: performance.now(),
    };
  }

  /**
   * Calcula métricas entre dois snapshots
   */
  private calculateTestMetrics(
    startSnapshot: MetricsSnapshot,
    endSnapshot: MetricsSnapshot
  ): TestExecutionMetrics {
    const duration = endSnapshot.performanceNow - startSnapshot.performanceNow;
    const memoryDelta =
      endSnapshot.memoryUsage.heapUsed - startSnapshot.memoryUsage.heapUsed;

    const cpuDelta = {
      user: endSnapshot.cpuUsage.user - startSnapshot.cpuUsage.user,
      system: endSnapshot.cpuUsage.system - startSnapshot.cpuUsage.system,
    };

    return {
      startSnapshot,
      endSnapshot,
      duration,
      memoryDelta,
      cpuDelta,
    };
  }

  /**
   * Estima número de requisições de rede baseado no teste
   */
  private estimateNetworkRequests(test: TestCaseResult): number {
    // Heurística baseada no nome e duração do teste
    if (
      test.name.toLowerCase().includes("multiple") ||
      test.name.toLowerCase().includes("batch")
    ) {
      return Math.ceil(test.duration / 100); // Estima 1 request por 100ms
    }

    if (test.duration > 1000) {
      return Math.ceil(test.duration / 500); // Testes longos podem ter múltiplas requests
    }

    return 1; // Padrão: 1 request por teste de rede
  }

  /**
   * Estima métricas de cache baseado no teste
   */
  private estimateCacheMetrics(test: TestCaseResult): {
    hits: number;
    misses: number;
  } {
    // Heurística baseada no status e duração do teste
    if (test.status === "passed" && test.duration < 100) {
      return { hits: 3, misses: 1 }; // Cache eficiente
    }

    if (test.status === "failed" || test.duration > 500) {
      return { hits: 1, misses: 3 }; // Cache menos eficiente
    }

    return { hits: 2, misses: 2 }; // Padrão balanceado
  }

  /**
   * Estima tempo de setup baseado nos resultados
   */
  private estimateSetupTime(suiteResults: TestSuiteResult[]): number {
    // Estima 5% do tempo total como setup
    const totalTime = suiteResults.reduce(
      (sum, suite) => sum + suite.duration,
      0
    );
    return totalTime * 0.05;
  }

  /**
   * Estima tempo de teardown baseado nos resultados
   */
  private estimateTeardownTime(suiteResults: TestSuiteResult[]): number {
    // Estima 3% do tempo total como teardown
    const totalTime = suiteResults.reduce(
      (sum, suite) => sum + suite.duration,
      0
    );
    return totalTime * 0.03;
  }

  /**
   * Detecta possíveis vazamentos de memória
   */
  private detectMemoryLeaks(metrics: TestExecutionMetrics[]): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Procurar por aumentos consistentes de memória
    for (let i = 1; i < metrics.length; i++) {
      const current = metrics[i];
      const previous = metrics[i - 1];

      const memoryIncrease =
        current.endSnapshot.memoryUsage.heapUsed -
        previous.endSnapshot.memoryUsage.heapUsed;

      // Se o aumento de memória for > 10MB e consistente
      if (memoryIncrease > 10 * 1024 * 1024) {
        leaks.push({
          location: `Test execution ${i}`,
          size: memoryIncrease,
          description: `Possível vazamento de memória detectado: aumento de ${(
            memoryIncrease /
            1024 /
            1024
          ).toFixed(2)}MB`,
        });
      }
    }

    return leaks;
  }

  /**
   * Calcula tendência de performance baseado no histórico
   */
  private calculateTrend(
    metrics: TestExecutionMetrics[]
  ): "improving" | "stable" | "degrading" {
    if (metrics.length < 3) {
      return "stable";
    }

    // Analisar últimas 3 execuções
    const recent = metrics.slice(-3);
    const durations = recent.map((m) => m.duration);

    // Calcular tendência linear simples
    const firstDuration = durations[0];
    const lastDuration = durations[durations.length - 1];
    const change = (lastDuration - firstDuration) / firstDuration;

    if (change < -0.1) return "improving"; // Melhoria > 10%
    if (change > 0.1) return "degrading"; // Degradação > 10%
    return "stable";
  }
}

export default MetricsCollector;
