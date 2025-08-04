/**
 * testOrchestrator.ts
 *
 * Sistema de orquestração de testes abrangentes
 * Executa todos os principais conjuntos de testes e gera relatórios detalhados
 */

import { execSync, spawn } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import * as os from "os";
import {
  TestConfig,
  TestExecutionResult,
  TestSuiteResult,
  TestSummary,
  TestMetrics,
  EnvironmentInfo,
  TestError,
  ErrorCategory,
  DEFAULT_TEST_CONFIG,
  TestSuiteConfig,
  TestCaseResult,
  PerformanceMetrics,
  ResourceMetrics,
  MemoryUsage,
  CpuUsage,
  BenchmarkResult,
  PerformanceAlert,
  FunctionalValidationResult,
  FunctionalAlert,
} from "./types/testOrchestrator";

export class TestOrchestrator {
  private config: TestConfig;
  private startTime: Date = new Date();
  private results: TestExecutionResult | null = null;

  constructor(config?: Partial<TestConfig>) {
    this.config = this.mergeConfig(config);
    this.validateConfig();
  }

  /**
   * Executa todos os conjuntos de testes configurados
   */
  async runAllTests(): Promise<TestExecutionResult> {
    console.log("🚀 Iniciando execução de testes abrangentes...\n");

    this.startTime = new Date();
    const suiteResults: TestSuiteResult[] = [];
    const environment = await this.collectEnvironmentInfo();

    // Executar testes críticos primeiro
    const criticalSuites = this.config.testSuites.filter(
      (suite) => suite.critical
    );
    const nonCriticalSuites = this.config.testSuites.filter(
      (suite) => !suite.critical
    );

    console.log(`📋 Executando ${criticalSuites.length} conjuntos críticos...`);
    for (const suite of criticalSuites) {
      const result = await this.runTestSuite(suite);
      suiteResults.push(result);

      if (
        result.status === "failed" &&
        !this.config.executionConfig.continueOnFailure
      ) {
        console.log(
          `❌ Falha crítica detectada em ${suite.name}. Interrompendo execução.`
        );
        break;
      }
    }

    console.log(
      `\n📋 Executando ${nonCriticalSuites.length} conjuntos não-críticos...`
    );

    // Executar testes não-críticos (paralelo se configurado)
    if (this.config.executionConfig.maxParallelSuites > 1) {
      const chunks = this.chunkArray(
        nonCriticalSuites,
        this.config.executionConfig.maxParallelSuites
      );

      for (const chunk of chunks) {
        const promises = chunk.map((suite) => this.runTestSuite(suite));
        const chunkResults = await Promise.all(promises);
        suiteResults.push(...chunkResults);
      }
    } else {
      for (const suite of nonCriticalSuites) {
        const result = await this.runTestSuite(suite);
        suiteResults.push(result);
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();

    // Calcular métricas e resumo
    const summary = this.calculateSummary(suiteResults);
    const metrics = this.calculateMetrics(suiteResults);

    // Analisar benchmarks de performance se houver testes de performance
    const { benchmarkResults, performanceAlerts } =
      this.analyzeBenchmarks(suiteResults);

    // Validar resultados funcionais se houver testes funcionais
    const allFunctionalValidationResults: FunctionalValidationResult[] = [];
    const allFunctionalAlerts: FunctionalAlert[] = [];

    for (const suite of suiteResults.filter(
      (s) => s.category === "functional"
    )) {
      const { validationResults, functionalAlerts } =
        this.validateFunctionalTestResults(suite);
      allFunctionalValidationResults.push(...validationResults);
      allFunctionalAlerts.push(...functionalAlerts);
    }

    this.results = {
      summary,
      suiteResults,
      metrics,
      environment,
      timestamp: this.startTime,
      duration,
      configUsed: this.config,
      benchmarkResults:
        benchmarkResults.length > 0 ? benchmarkResults : undefined,
      performanceAlerts:
        performanceAlerts.length > 0 ? performanceAlerts : undefined,
      functionalValidationResults:
        allFunctionalValidationResults.length > 0
          ? allFunctionalValidationResults
          : undefined,
      functionalAlerts:
        allFunctionalAlerts.length > 0 ? allFunctionalAlerts : undefined,
    };

    console.log("\n✅ Execução de testes concluída!");
    console.log(`⏱️  Tempo total: ${(duration / 1000).toFixed(2)}s`);
    console.log(
      `📊 Resumo: ${summary.passedTests}/${summary.totalTests} testes aprovados`
    );

    return this.results;
  }

  /**
   * Executa conjuntos específicos de testes
   */
  async runSpecificTests(
    testSuiteNames: string[]
  ): Promise<TestExecutionResult> {
    const filteredSuites = this.config.testSuites.filter((suite) =>
      testSuiteNames.includes(suite.name)
    );

    if (filteredSuites.length === 0) {
      throw new Error(
        `Nenhum conjunto de testes encontrado para: ${testSuiteNames.join(
          ", "
        )}`
      );
    }

    const originalSuites = this.config.testSuites;
    this.config.testSuites = filteredSuites;

    try {
      return await this.runAllTests();
    } finally {
      this.config.testSuites = originalSuites;
    }
  }

  /**
   * Gera relatório baseado nos resultados
   */
  async generateReport(results?: TestExecutionResult): Promise<string> {
    const testResults = results || this.results;

    if (!testResults) {
      throw new Error(
        "Nenhum resultado de teste disponível para gerar relatório"
      );
    }

    const reportGenerator = new MarkdownReportGenerator(
      this.config.reportConfig
    );
    const reportContent = reportGenerator.generateReport(testResults);

    // Gerar nome do arquivo com timestamp se configurado
    let fileName = this.config.reportConfig.outputPath;
    if (this.config.executionConfig.generateTimestamp) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      fileName = fileName.replace("{timestamp}", timestamp);
    } else {
      fileName = fileName.replace("_{timestamp}", "");
    }

    // Escrever arquivo
    writeFileSync(fileName, reportContent, "utf8");

    console.log(`📄 Relatório gerado: ${fileName}`);

    return fileName;
  }

  /**
   * Executa um conjunto individual de testes
   */
  private async runTestSuite(suite: TestSuiteConfig): Promise<TestSuiteResult> {
    console.log(`🧪 Executando: ${suite.name}`);

    const startTime = new Date();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= suite.retries) {
      try {
        const result = await this.executeVitest(suite, attempt);
        const endTime = new Date();

        console.log(
          `✅ ${suite.name} - ${result.status} (${
            endTime.getTime() - startTime.getTime()
          }ms)`
        );

        return {
          ...result,
          startTime,
          endTime,
          retryCount: attempt,
          critical: suite.critical,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt <= suite.retries) {
          console.log(
            `⚠️  ${suite.name} - Tentativa ${attempt} falhou, tentando novamente...`
          );
          await this.delay(1000 * attempt); // Backoff exponencial
        }
      }
    }

    // Todas as tentativas falharam
    const endTime = new Date();
    console.log(
      `❌ ${suite.name} - Falhou após ${suite.retries + 1} tentativas`
    );

    return {
      name: suite.name,
      filePath: suite.filePath,
      category: suite.category,
      status: "failed",
      duration: endTime.getTime() - startTime.getTime(),
      startTime,
      endTime,
      tests: [],
      errors: [
        {
          message: lastError?.message || "Erro desconhecido",
          stack: lastError?.stack,
          category: ErrorCategory.UNKNOWN,
          severity: suite.critical ? "critical" : "high",
          suggestions: [
            "Verifique se o arquivo de teste existe",
            "Confirme se todas as dependências estão instaladas",
            "Execute o teste individualmente para mais detalhes",
          ],
        },
      ],
      metrics: {
        testCount: 0,
        averageDuration: 0,
        memoryUsed: 0,
        cpuUsed: 0,
        networkRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
      retryCount: attempt,
      critical: suite.critical,
    };
  }

  /**
   * Executa Vitest para um conjunto específico
   */
  private async executeVitest(
    suite: TestSuiteConfig,
    attempt: number
  ): Promise<
    Omit<TestSuiteResult, "startTime" | "endTime" | "retryCount" | "critical">
  > {
    return new Promise((resolve, reject) => {
      if (!existsSync(suite.filePath)) {
        reject(new Error(`Arquivo de teste não encontrado: ${suite.filePath}`));
        return;
      }

      const args = [
        "vitest",
        "run",
        suite.filePath,
        "--reporter=json",
        `--testTimeout=${suite.timeout}`,
      ];

      // Add category-specific configurations
      if (suite.category === "performance") {
        args.push("--no-coverage"); // Disable coverage for performance tests
        args.push("--pool=threads"); // Use thread pool for better performance isolation
        args.push("--poolOptions.threads.singleThread=true"); // Single thread for consistent metrics
      } else if (suite.category === "functional") {
        args.push("--pool=forks"); // Use fork pool for functional tests isolation
        if (suite.parallel) {
          args.push("--poolOptions.forks.maxForks=4"); // Allow parallel execution for functional tests
        } else {
          args.push("--poolOptions.forks.maxForks=1"); // Sequential execution
        }
      } else if (suite.category === "integration") {
        args.push("--pool=forks"); // Use fork pool for integration tests
        args.push("--poolOptions.forks.maxForks=2"); // Limited parallelism for integration tests
      }

      const child = spawn("npx", args, {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: suite.timeout + 5000, // 5s extra para overhead
      });

      let stdout = "";
      let stderr = "";

      // For performance tests, also collect system metrics
      let memoryUsage: number[] = [];
      let cpuUsage: number[] = [];
      let metricsInterval: NodeJS.Timeout | null = null;

      if (suite.category === "performance") {
        metricsInterval = setInterval(() => {
          const memUsage = process.memoryUsage();
          memoryUsage.push(memUsage.heapUsed);

          // Simple CPU usage approximation
          const cpuUsagePercent = process.cpuUsage();
          cpuUsage.push((cpuUsagePercent.user + cpuUsagePercent.system) / 1000);
        }, 100); // Collect metrics every 100ms
      }

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (metricsInterval) {
          clearInterval(metricsInterval);
        }

        try {
          const result = this.parseVitestOutput(stdout, stderr, suite);

          // Enhance performance test results with collected metrics
          if (suite.category === "performance") {
            result.metrics = {
              ...result.metrics,
              memoryUsed: memoryUsage.length > 0 ? Math.max(...memoryUsage) : 0,
              cpuUsed:
                cpuUsage.length > 0
                  ? cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length
                  : 0,
              networkRequests: this.extractNetworkMetrics(stdout),
              cacheHits: this.extractCacheMetrics(stdout, "hits"),
              cacheMisses: this.extractCacheMetrics(stdout, "misses"),
            };
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      child.on("error", (error) => {
        if (metricsInterval) {
          clearInterval(metricsInterval);
        }
        reject(error);
      });

      // Timeout handling
      setTimeout(() => {
        if (metricsInterval) {
          clearInterval(metricsInterval);
        }
        child.kill("SIGKILL");
        reject(new Error(`Timeout após ${suite.timeout}ms`));
      }, suite.timeout + 10000);
    });
  }

  /**
   * Faz parsing da saída do Vitest
   */
  private parseVitestOutput(
    stdout: string,
    stderr: string,
    suite: TestSuiteConfig
  ): Omit<
    TestSuiteResult,
    "startTime" | "endTime" | "retryCount" | "critical"
  > {
    try {
      // Tentar extrair JSON da saída
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      let vitestResult: any = null;

      if (jsonMatch) {
        try {
          vitestResult = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Fallback para parsing manual
        }
      }

      const tests: TestCaseResult[] = [];
      const errors: TestError[] = [];
      let status: "passed" | "failed" | "skipped" = "passed";
      let duration = 0;

      if (vitestResult && vitestResult.testResults) {
        // Processar resultados estruturados do Vitest
        for (const testFile of vitestResult.testResults) {
          duration += testFile.duration || 0;

          for (const test of testFile.assertionResults || []) {
            const testCase: TestCaseResult = {
              name: test.title || test.name,
              fullName:
                test.fullName ||
                test.ancestorTitles?.join(" > ") + " > " + test.title,
              status:
                test.status === "passed"
                  ? "passed"
                  : test.status === "skipped"
                  ? "skipped"
                  : "failed",
              duration: test.duration || 0,
              assertions: [],
              retryCount: 0,
            };

            if (test.status === "failed") {
              status = "failed";
              const error: TestError = {
                message: test.failureMessages?.[0] || "Teste falhou",
                stack: test.failureDetails?.[0]?.stack,
                category: this.categorizeError(test.failureMessages?.[0] || ""),
                severity: "medium",
                suggestions: this.generateSuggestions(
                  test.failureMessages?.[0] || ""
                ),
              };
              testCase.error = error;
              errors.push(error);
            }

            tests.push(testCase);
          }
        }
      } else {
        // Fallback: parsing manual da saída
        const lines = stdout.split("\n");
        let testCount = 0;
        let passedCount = 0;
        let failedCount = 0;

        for (const line of lines) {
          if (line.includes("✓") || line.includes("PASS")) {
            passedCount++;
            testCount++;
          } else if (line.includes("✗") || line.includes("FAIL")) {
            failedCount++;
            testCount++;
            status = "failed";
          }
        }

        // Criar testes genéricos baseados na contagem
        for (let i = 0; i < testCount; i++) {
          tests.push({
            name: `Test ${i + 1}`,
            fullName: `${suite.name} > Test ${i + 1}`,
            status: i < passedCount ? "passed" : "failed",
            duration: 0,
            assertions: [],
            retryCount: 0,
          });
        }
      }

      // Se há stderr, considerar como erro
      if (stderr.trim()) {
        status = "failed";
        errors.push({
          message: stderr.trim(),
          category: ErrorCategory.UNKNOWN,
          severity: "high",
          suggestions: ["Verifique os logs de erro para mais detalhes"],
        });
      }

      return {
        name: suite.name,
        filePath: suite.filePath,
        category: suite.category,
        status,
        duration,
        tests,
        errors,
        metrics: {
          testCount: tests.length,
          averageDuration: tests.length > 0 ? duration / tests.length : 0,
          memoryUsed: 0, // TODO: Implementar coleta de métricas
          cpuUsed: 0,
          networkRequests: 0,
          cacheHits: 0,
          cacheMisses: 0,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao processar saída do Vitest: ${error}`);
    }
  }

  /**
   * Categoriza erros baseado na mensagem
   */
  private categorizeError(message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("timeout")) return ErrorCategory.TIMEOUT;
    if (lowerMessage.includes("network") || lowerMessage.includes("fetch"))
      return ErrorCategory.NETWORK_ERROR;
    if (lowerMessage.includes("assertion") || lowerMessage.includes("expect"))
      return ErrorCategory.ASSERTION_FAILURE;
    if (lowerMessage.includes("mock")) return ErrorCategory.MOCK_FAILURE;
    if (lowerMessage.includes("config"))
      return ErrorCategory.CONFIGURATION_ERROR;

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Gera sugestões baseado na mensagem de erro
   */
  private generateSuggestions(message: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("timeout")) {
      suggestions.push("Considere aumentar o timeout do teste");
      suggestions.push("Verifique se há operações assíncronas não aguardadas");
    }

    if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
      suggestions.push("Verifique a conectividade de rede");
      suggestions.push(
        "Confirme se os mocks de rede estão configurados corretamente"
      );
    }

    if (lowerMessage.includes("expect")) {
      suggestions.push("Verifique se os valores esperados estão corretos");
      suggestions.push(
        "Confirme se o estado do sistema está como esperado antes da asserção"
      );
    }

    if (suggestions.length === 0) {
      suggestions.push("Execute o teste individualmente para mais detalhes");
      suggestions.push("Verifique os logs completos do teste");
    }

    return suggestions;
  }

  /**
   * Calcula resumo dos resultados
   */
  private calculateSummary(suiteResults: TestSuiteResult[]): TestSummary {
    const totalSuites = suiteResults.length;
    const passedSuites = suiteResults.filter(
      (r) => r.status === "passed"
    ).length;
    const failedSuites = suiteResults.filter(
      (r) => r.status === "failed"
    ).length;
    const skippedSuites = suiteResults.filter(
      (r) => r.status === "skipped"
    ).length;

    const totalTests = suiteResults.reduce((sum, r) => sum + r.tests.length, 0);
    const passedTests = suiteResults.reduce(
      (sum, r) => sum + r.tests.filter((t) => t.status === "passed").length,
      0
    );
    const failedTests = suiteResults.reduce(
      (sum, r) => sum + r.tests.filter((t) => t.status === "failed").length,
      0
    );
    const skippedTests = suiteResults.reduce(
      (sum, r) => sum + r.tests.filter((t) => t.status === "skipped").length,
      0
    );

    const totalDuration = suiteResults.reduce((sum, r) => sum + r.duration, 0);
    const criticalFailures = suiteResults.filter(
      (r) => r.critical && r.status === "failed"
    ).length;

    let overallStatus: "passed" | "failed" | "partial" = "passed";
    if (criticalFailures > 0) {
      overallStatus = "failed";
    } else if (failedSuites > 0) {
      overallStatus = "partial";
    }

    return {
      totalSuites,
      passedSuites,
      failedSuites,
      skippedSuites,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      overallStatus,
      criticalFailures,
    };
  }

  /**
   * Calcula métricas de performance
   */
  private calculateMetrics(suiteResults: TestSuiteResult[]): TestMetrics {
    const allTests = suiteResults.flatMap((r) => r.tests);
    const durations = allTests.map((t) => t.duration).filter((d) => d > 0);

    // Separate performance test suites for special analysis
    const performanceSuites = suiteResults.filter(
      (r) => r.category === "performance"
    );
    const integrationSuites = suiteResults.filter(
      (r) => r.category === "integration"
    );

    const performance: PerformanceMetrics = {
      averageTestDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      medianTestDuration:
        durations.length > 0
          ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
          : 0,
      slowestTests: allTests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
      fastestTests: allTests
        .filter((t) => t.duration > 0)
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 5),
      totalExecutionTime: suiteResults.reduce((sum, r) => sum + r.duration, 0),
      setupTime: 0, // TODO: Implementar
      teardownTime: 0, // TODO: Implementar
    };

    // Enhanced resource metrics with performance suite data
    const performanceMemoryUsage = performanceSuites
      .map((s) => s.metrics.memoryUsed)
      .filter((m) => m > 0);
    const performanceCpuUsage = performanceSuites
      .map((s) => s.metrics.cpuUsed)
      .filter((c) => c > 0);

    const resources: ResourceMetrics = {
      memoryUsage: {
        peak:
          performanceMemoryUsage.length > 0
            ? Math.max(...performanceMemoryUsage)
            : 0,
        average:
          performanceMemoryUsage.length > 0
            ? performanceMemoryUsage.reduce((a, b) => a + b, 0) /
              performanceMemoryUsage.length
            : 0,
        initial: 0, // TODO: Implementar
        final: 0, // TODO: Implementar
      } as MemoryUsage,
      cpuUsage: {
        average:
          performanceCpuUsage.length > 0
            ? performanceCpuUsage.reduce((a, b) => a + b, 0) /
              performanceCpuUsage.length
            : 0,
        peak:
          performanceCpuUsage.length > 0 ? Math.max(...performanceCpuUsage) : 0,
        userTime: 0, // TODO: Implementar
        systemTime: 0, // TODO: Implementar
      } as CpuUsage,
    };

    return {
      performance,
      resources,
    };
  }

  /**
   * Analisa benchmarks de performance
   */
  private analyzeBenchmarks(suiteResults: TestSuiteResult[]): {
    benchmarkResults: BenchmarkResult[];
    performanceAlerts: PerformanceAlert[];
  } {
    const performanceSuites = suiteResults.filter(
      (r) => r.category === "performance"
    );
    const benchmarkResults: BenchmarkResult[] = [];
    const performanceAlerts: PerformanceAlert[] = [];

    for (const suite of performanceSuites) {
      // Analyze concurrent validation performance
      const concurrentTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("concurrent") ||
          t.name.toLowerCase().includes("parallel")
      );

      if (concurrentTests.length > 0) {
        const avgConcurrentDuration =
          concurrentTests.reduce((sum, t) => sum + t.duration, 0) /
          concurrentTests.length;

        benchmarkResults.push({
          category: "concurrent_validation",
          metric: "average_duration",
          value: avgConcurrentDuration,
          threshold: 5000, // 5 seconds
          status: avgConcurrentDuration <= 5000 ? "passed" : "failed",
          description: `Concurrent validation average: ${avgConcurrentDuration.toFixed(
            2
          )}ms`,
        });

        if (avgConcurrentDuration > 5000) {
          performanceAlerts.push({
            severity: "high",
            category: "performance_degradation",
            message: `Concurrent validation is slower than expected: ${avgConcurrentDuration.toFixed(
              2
            )}ms > 5000ms`,
            suggestion:
              "Consider optimizing concurrent request handling or increasing timeout thresholds",
          });
        }
      }

      // Analyze cache performance
      const cacheTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("cache") ||
          t.name.toLowerCase().includes("caching")
      );

      if (cacheTests.length > 0) {
        const totalCacheHits = suite.metrics.cacheHits;
        const totalCacheMisses = suite.metrics.cacheMisses;
        const cacheHitRate =
          totalCacheHits + totalCacheMisses > 0
            ? totalCacheHits / (totalCacheHits + totalCacheMisses)
            : 0;

        benchmarkResults.push({
          category: "cache_performance",
          metric: "hit_rate",
          value: cacheHitRate * 100,
          threshold: 80, // 80% hit rate
          status: cacheHitRate >= 0.8 ? "passed" : "failed",
          description: `Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
        });

        if (cacheHitRate < 0.8) {
          performanceAlerts.push({
            severity: "medium",
            category: "cache_efficiency",
            message: `Cache hit rate is below optimal: ${(
              cacheHitRate * 100
            ).toFixed(1)}% < 80%`,
            suggestion:
              "Review cache TTL settings and cache invalidation strategies",
          });
        }
      }

      // Analyze memory usage
      if (suite.metrics.memoryUsed > 0) {
        const memoryUsageMB = suite.metrics.memoryUsed / (1024 * 1024);

        benchmarkResults.push({
          category: "memory_usage",
          metric: "peak_memory",
          value: memoryUsageMB,
          threshold: 100, // 100MB
          status: memoryUsageMB <= 100 ? "passed" : "failed",
          description: `Peak memory usage: ${memoryUsageMB.toFixed(2)}MB`,
        });

        if (memoryUsageMB > 100) {
          performanceAlerts.push({
            severity: "high",
            category: "memory_usage",
            message: `Memory usage exceeds threshold: ${memoryUsageMB.toFixed(
              2
            )}MB > 100MB`,
            suggestion: "Investigate memory leaks and optimize data structures",
          });
        }
      }

      // Analyze network requests efficiency
      if (suite.metrics.networkRequests > 0) {
        const networkEfficiency =
          suite.tests.length > 0
            ? suite.metrics.networkRequests / suite.tests.length
            : 0;

        benchmarkResults.push({
          category: "network_efficiency",
          metric: "requests_per_test",
          value: networkEfficiency,
          threshold: 10, // Max 10 requests per test
          status: networkEfficiency <= 10 ? "passed" : "failed",
          description: `Network requests per test: ${networkEfficiency.toFixed(
            1
          )}`,
        });

        if (networkEfficiency > 10) {
          performanceAlerts.push({
            severity: "medium",
            category: "network_efficiency",
            message: `High network requests per test: ${networkEfficiency.toFixed(
              1
            )} > 10`,
            suggestion:
              "Consider batching requests or improving caching strategies",
          });
        }
      }
    }

    return { benchmarkResults, performanceAlerts };
  }

  /**
   * Coleta informações do ambiente
   */
  private async collectEnvironmentInfo(): Promise<EnvironmentInfo> {
    const nodeVersion = process.version;
    const platform = os.platform();
    const arch = os.arch();
    const osInfo = `${os.type()} ${os.release()}`;

    let vitestVersion = "unknown";
    try {
      const packageJson = require("../package.json");
      vitestVersion =
        packageJson.devDependencies?.vitest ||
        packageJson.dependencies?.vitest ||
        "unknown";
    } catch (e) {
      // Ignorar erro
    }

    return {
      nodeVersion,
      platform,
      arch,
      os: osInfo,
      vitestVersion,
      timestamp: new Date(),
      systemResources: {
        totalMemory: os.totalmem(),
        availableMemory: os.freemem(),
        cpuCores: os.cpus().length,
        diskSpace: 0, // TODO: Implementar
      },
    };
  }

  /**
   * Utilitários
   */
  private mergeConfig(config?: Partial<TestConfig>): TestConfig {
    if (!config) return DEFAULT_TEST_CONFIG;

    return {
      testSuites: config.testSuites || DEFAULT_TEST_CONFIG.testSuites,
      reportConfig: {
        ...DEFAULT_TEST_CONFIG.reportConfig,
        ...config.reportConfig,
      },
      executionConfig: {
        ...DEFAULT_TEST_CONFIG.executionConfig,
        ...config.executionConfig,
      },
    };
  }

  private validateConfig(): void {
    if (!this.config.testSuites || this.config.testSuites.length === 0) {
      throw new Error("Pelo menos um conjunto de testes deve ser configurado");
    }

    for (const suite of this.config.testSuites) {
      if (!suite.name || !suite.filePath) {
        throw new Error(
          "Cada conjunto de testes deve ter nome e caminho do arquivo"
        );
      }
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extrai métricas de rede da saída dos testes
   */
  private extractNetworkMetrics(output: string): number {
    // Look for network-related patterns in test output
    const networkPatterns = [
      /fetch.*called.*(\d+)/gi,
      /network.*requests?.*(\d+)/gi,
      /http.*requests?.*(\d+)/gi,
      /api.*calls?.*(\d+)/gi,
    ];

    let totalRequests = 0;
    for (const pattern of networkPatterns) {
      const matches = output.match(pattern);
      if (matches) {
        for (const match of matches) {
          const numbers = match.match(/\d+/g);
          if (numbers) {
            totalRequests += parseInt(numbers[numbers.length - 1], 10);
          }
        }
      }
    }

    return totalRequests;
  }

  /**
   * Valida resultados específicos para testes funcionais
   */
  private validateFunctionalTestResults(suite: TestSuiteResult): {
    validationResults: FunctionalValidationResult[];
    functionalAlerts: FunctionalAlert[];
  } {
    const validationResults: FunctionalValidationResult[] = [];
    const functionalAlerts: FunctionalAlert[] = [];

    if (suite.category !== "functional") {
      return { validationResults, functionalAlerts };
    }

    // Validate Feed Duplicate Detector tests
    if (suite.name.includes("Feed Duplicate Detector")) {
      const duplicateTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("duplicate") ||
          t.name.toLowerCase().includes("normalization")
      );

      if (duplicateTests.length > 0) {
        const passedDuplicateTests = duplicateTests.filter(
          (t) => t.status === "passed"
        );
        const duplicateTestPassRate =
          passedDuplicateTests.length / duplicateTests.length;

        validationResults.push({
          category: "duplicate_detection",
          testType: "url_normalization",
          passRate: duplicateTestPassRate * 100,
          threshold: 95, // 95% pass rate expected
          status: duplicateTestPassRate >= 0.95 ? "passed" : "failed",
          description: `Duplicate detection pass rate: ${(
            duplicateTestPassRate * 100
          ).toFixed(1)}%`,
          testsRun: duplicateTests.length,
          testsPassed: passedDuplicateTests.length,
        });

        if (duplicateTestPassRate < 0.95) {
          functionalAlerts.push({
            severity: "high",
            category: "duplicate_detection",
            message: `Duplicate detection tests have low pass rate: ${(
              duplicateTestPassRate * 100
            ).toFixed(1)}% < 95%`,
            suggestion:
              "Review URL normalization logic and content fingerprinting algorithms",
            affectedTests: duplicateTests
              .filter((t) => t.status === "failed")
              .map((t) => t.name),
          });
        }
      }

      // Validate content fingerprinting
      const fingerprintTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("fingerprint") ||
          t.name.toLowerCase().includes("content")
      );

      if (fingerprintTests.length > 0) {
        const passedFingerprintTests = fingerprintTests.filter(
          (t) => t.status === "passed"
        );
        const fingerprintPassRate =
          passedFingerprintTests.length / fingerprintTests.length;

        validationResults.push({
          category: "content_fingerprinting",
          testType: "hash_generation",
          passRate: fingerprintPassRate * 100,
          threshold: 90,
          status: fingerprintPassRate >= 0.9 ? "passed" : "failed",
          description: `Content fingerprinting pass rate: ${(
            fingerprintPassRate * 100
          ).toFixed(1)}%`,
          testsRun: fingerprintTests.length,
          testsPassed: passedFingerprintTests.length,
        });

        if (fingerprintPassRate < 0.9) {
          functionalAlerts.push({
            severity: "medium",
            category: "content_fingerprinting",
            message: `Content fingerprinting tests have low pass rate: ${(
              fingerprintPassRate * 100
            ).toFixed(1)}% < 90%`,
            suggestion:
              "Check hash generation algorithms and content extraction logic",
            affectedTests: fingerprintTests
              .filter((t) => t.status === "failed")
              .map((t) => t.name),
          });
        }
      }
    }

    // Validate OPML Export Service tests
    if (suite.name.includes("OPML Export Service")) {
      const opmlGenerationTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("generate") ||
          t.name.toLowerCase().includes("opml")
      );

      if (opmlGenerationTests.length > 0) {
        const passedOpmlTests = opmlGenerationTests.filter(
          (t) => t.status === "passed"
        );
        const opmlPassRate =
          passedOpmlTests.length / opmlGenerationTests.length;

        validationResults.push({
          category: "opml_generation",
          testType: "xml_generation",
          passRate: opmlPassRate * 100,
          threshold: 98, // Very high threshold for OPML generation
          status: opmlPassRate >= 0.98 ? "passed" : "failed",
          description: `OPML generation pass rate: ${(
            opmlPassRate * 100
          ).toFixed(1)}%`,
          testsRun: opmlGenerationTests.length,
          testsPassed: passedOpmlTests.length,
        });

        if (opmlPassRate < 0.98) {
          functionalAlerts.push({
            severity: "high",
            category: "opml_generation",
            message: `OPML generation tests have low pass rate: ${(
              opmlPassRate * 100
            ).toFixed(1)}% < 98%`,
            suggestion: "Review XML generation logic and category handling",
            affectedTests: opmlGenerationTests
              .filter((t) => t.status === "failed")
              .map((t) => t.name),
          });
        }
      }

      // Validate XML escaping and special characters
      const xmlEscapingTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("escaping") ||
          t.name.toLowerCase().includes("special") ||
          t.name.toLowerCase().includes("unicode")
      );

      if (xmlEscapingTests.length > 0) {
        const passedEscapingTests = xmlEscapingTests.filter(
          (t) => t.status === "passed"
        );
        const escapingPassRate =
          passedEscapingTests.length / xmlEscapingTests.length;

        validationResults.push({
          category: "xml_escaping",
          testType: "character_handling",
          passRate: escapingPassRate * 100,
          threshold: 100, // Must be 100% for security
          status: escapingPassRate >= 1.0 ? "passed" : "failed",
          description: `XML escaping pass rate: ${(
            escapingPassRate * 100
          ).toFixed(1)}%`,
          testsRun: xmlEscapingTests.length,
          testsPassed: passedEscapingTests.length,
        });

        if (escapingPassRate < 1.0) {
          functionalAlerts.push({
            severity: "critical",
            category: "xml_escaping",
            message: `XML escaping tests failed: ${(
              escapingPassRate * 100
            ).toFixed(1)}% < 100%`,
            suggestion:
              "Fix XML escaping immediately - this is a security issue",
            affectedTests: xmlEscapingTests
              .filter((t) => t.status === "failed")
              .map((t) => t.name),
          });
        }
      }

      // Validate download functionality
      const downloadTests = suite.tests.filter(
        (t) =>
          t.name.toLowerCase().includes("download") ||
          t.name.toLowerCase().includes("file")
      );

      if (downloadTests.length > 0) {
        const passedDownloadTests = downloadTests.filter(
          (t) => t.status === "passed"
        );
        const downloadPassRate =
          passedDownloadTests.length / downloadTests.length;

        validationResults.push({
          category: "file_download",
          testType: "browser_download",
          passRate: downloadPassRate * 100,
          threshold: 95,
          status: downloadPassRate >= 0.95 ? "passed" : "failed",
          description: `File download pass rate: ${(
            downloadPassRate * 100
          ).toFixed(1)}%`,
          testsRun: downloadTests.length,
          testsPassed: passedDownloadTests.length,
        });

        if (downloadPassRate < 0.95) {
          functionalAlerts.push({
            severity: "medium",
            category: "file_download",
            message: `File download tests have low pass rate: ${(
              downloadPassRate * 100
            ).toFixed(1)}% < 95%`,
            suggestion:
              "Check browser compatibility and DOM manipulation logic",
            affectedTests: downloadTests
              .filter((t) => t.status === "failed")
              .map((t) => t.name),
          });
        }
      }
    }

    return { validationResults, functionalAlerts };
  }

  /**
   * Extrai métricas de cache da saída dos testes
   */
  private extractCacheMetrics(output: string, type: "hits" | "misses"): number {
    const cachePatterns = {
      hits: [/cache.*hits?.*(\d+)/gi, /hit.*count.*(\d+)/gi, /cached.*(\d+)/gi],
      misses: [
        /cache.*miss.*(\d+)/gi,
        /miss.*count.*(\d+)/gi,
        /cache.*failures?.*(\d+)/gi,
      ],
    };

    let totalCount = 0;
    const patterns = cachePatterns[type];

    for (const pattern of patterns) {
      const matches = output.match(pattern);
      if (matches) {
        for (const match of matches) {
          const numbers = match.match(/\d+/g);
          if (numbers) {
            totalCount += parseInt(numbers[numbers.length - 1], 10);
          }
        }
      }
    }

    return totalCount;
  }
}

// Import the advanced MarkdownReportGenerator
import { MarkdownReportGenerator } from "./MarkdownReportGenerator";
