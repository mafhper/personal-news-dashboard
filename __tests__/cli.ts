#!/usr/bin/env node

/**
 * cli.ts
 *
 * Interface de linha de comando para o sistema de testes abrangentes
 * Fornece argumentos de linha de comando, sistema de ajuda, modo interativo e controle de verbosidade
 */

import { readFileSync } from "fs";
import { join } from "path";
import * as readline from "readline";
import { TestOrchestrator } from "./testOrchestrator";
import {
  TestConfig,
  TestSuiteConfig,
  DEFAULT_TEST_CONFIG,
  DEFAULT_TEST_SUITES,
} from "./types/testOrchestrator";

interface CliOptions {
  help: boolean;
  version: boolean;
  interactive: boolean;
  verbose: boolean;
  quiet: boolean;
  suites: string[];
  config?: string;
  output?: string;
  format: "markdown" | "json" | "html" | "all";
  parallel: number;
  timeout: number;
  retries: number;
  continueOnFailure: boolean;
  includeMetrics: boolean;
  includeStackTraces: boolean;
  detailLevel: "summary" | "detailed" | "verbose";
}

class TestCli {
  private options: CliOptions;
  private rl?: readline.Interface;

  constructor() {
    this.options = this.parseArguments();
  }

  /**
   * Ponto de entrada principal da CLI
   */
  async run(): Promise<void> {
    try {
      // Mostrar ajuda se solicitado
      if (this.options.help) {
        this.showHelp();
        return;
      }

      // Mostrar versão se solicitado
      if (this.options.version) {
        this.showVersion();
        return;
      }

      // Configurar nível de log
      this.configureLogging();

      // Modo interativo
      if (this.options.interactive) {
        await this.runInteractiveMode();
        return;
      }

      // Modo não-interativo
      await this.runNonInteractiveMode();
    } catch (error) {
      if (!this.options.quiet) {
        console.error(
          "❌ Erro:",
          error instanceof Error ? error.message : error
        );
      }
      process.exit(1);
    }
  }

  /**
   * Executa modo interativo para seleção de testes
   */
  private async runInteractiveMode(): Promise<void> {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (!this.options.quiet) {
      console.log("🎯 Modo Interativo - Sistema de Testes Abrangentes\n");
    }

    try {
      // Selecionar conjuntos de testes
      const selectedSuites = await this.selectTestSuites();

      // Configurar opções de execução
      const executionOptions = await this.configureExecution();

      // Configurar relatório
      const reportOptions = await this.configureReport();

      // Confirmar execução
      const confirmed = await this.confirmExecution(
        selectedSuites,
        executionOptions,
        reportOptions
      );

      if (!confirmed) {
        console.log("❌ Execução cancelada pelo usuário.");
        return;
      }

      // Executar testes
      await this.executeTests(selectedSuites, executionOptions, reportOptions);
    } finally {
      this.rl?.close();
    }
  }

  /**
   * Executa modo não-interativo baseado nos argumentos
   */
  private async runNonInteractiveMode(): Promise<void> {
    if (!this.options.quiet) {
      console.log("🚀 Executando testes em modo não-interativo...\n");
    }

    const config = await this.buildConfig();
    const orchestrator = new TestOrchestrator(config);

    let results;
    if (this.options.suites.length > 0) {
      results = await orchestrator.runSpecificTests(this.options.suites);
    } else {
      results = await orchestrator.runAllTests();
    }

    const reportPath = await orchestrator.generateReport(results);

    if (!this.options.quiet) {
      console.log(`\n✅ Execução concluída!`);
      console.log(`📄 Relatório gerado: ${reportPath}`);

      // Mostrar resumo se não estiver em modo quiet
      console.log(`\n📊 Resumo:`);
      console.log(
        `   Conjuntos: ${results.summary.passedSuites}/${results.summary.totalSuites} aprovados`
      );
      console.log(
        `   Testes: ${results.summary.passedTests}/${results.summary.totalTests} aprovados`
      );
      console.log(`   Tempo: ${(results.duration / 1000).toFixed(2)}s`);
      console.log(`   Status: ${results.summary.overallStatus.toUpperCase()}`);
    }

    // Código de saída baseado no resultado
    if (results.summary.overallStatus === "failed") {
      process.exit(1);
    } else if (results.summary.overallStatus === "partial") {
      process.exit(2);
    }
  }

  /**
   * Seleciona conjuntos de testes interativamente
   */
  private async selectTestSuites(): Promise<string[]> {
    console.log("📋 Conjuntos de testes disponíveis:\n");

    DEFAULT_TEST_SUITES.forEach((suite, index) => {
      const criticalMark = suite.critical ? "🔴" : "🟡";
      const categoryMark = this.getCategoryIcon(suite.category);
      console.log(
        `  ${index + 1}. ${criticalMark} ${categoryMark} ${suite.name}`
      );
      console.log(`     ${suite.filePath}`);
      console.log(
        `     Timeout: ${suite.timeout}ms, Crítico: ${
          suite.critical ? "Sim" : "Não"
        }\n`
      );
    });

    console.log("Opções:");
    console.log("  - Digite números separados por vírgula (ex: 1,3,5)");
    console.log("  - Digite 'all' para todos os testes");
    console.log("  - Digite 'critical' para apenas testes críticos");
    console.log("  - Digite 'performance' para apenas testes de performance");
    console.log("  - Digite 'integration' para apenas testes de integração");
    console.log("  - Digite 'functional' para apenas testes funcionais\n");

    const answer = await this.question("Selecione os conjuntos de testes: ");

    if (answer.toLowerCase() === "all") {
      return DEFAULT_TEST_SUITES.map((s) => s.name);
    }

    if (answer.toLowerCase() === "critical") {
      return DEFAULT_TEST_SUITES.filter((s) => s.critical).map((s) => s.name);
    }

    if (
      ["performance", "integration", "functional", "unit"].includes(
        answer.toLowerCase()
      )
    ) {
      return DEFAULT_TEST_SUITES.filter(
        (s) => s.category === answer.toLowerCase()
      ).map((s) => s.name);
    }

    // Parse números
    const indices = answer.split(",").map((s) => parseInt(s.trim()) - 1);
    const selectedSuites: string[] = [];

    for (const index of indices) {
      if (index >= 0 && index < DEFAULT_TEST_SUITES.length) {
        selectedSuites.push(DEFAULT_TEST_SUITES[index].name);
      }
    }

    if (selectedSuites.length === 0) {
      console.log(
        "⚠️  Nenhum conjunto válido selecionado. Usando todos os conjuntos."
      );
      return DEFAULT_TEST_SUITES.map((s) => s.name);
    }

    return selectedSuites;
  }

  /**
   * Configura opções de execução interativamente
   */
  private async configureExecution(): Promise<
    Partial<TestConfig["executionConfig"]>
  > {
    console.log("\n⚙️  Configuração de Execução:\n");

    const parallel = await this.question(
      "Número máximo de conjuntos paralelos (padrão: 3): "
    );
    const timeout = await this.question(
      "Timeout global em segundos (padrão: 300): "
    );
    const continueOnFailure = await this.question(
      "Continuar após falhas? (s/N): "
    );
    const retryFailedTests = await this.question(
      "Tentar novamente testes falhados? (S/n): "
    );

    return {
      maxParallelSuites: parallel ? parseInt(parallel) : 3,
      globalTimeout: timeout ? parseInt(timeout) * 1000 : 300000,
      continueOnFailure: continueOnFailure.toLowerCase().startsWith("s"),
      retryFailedTests: !retryFailedTests.toLowerCase().startsWith("n"),
    };
  }

  /**
   * Configura opções de relatório interativamente
   */
  private async configureReport(): Promise<
    Partial<TestConfig["reportConfig"]>
  > {
    console.log("\n📄 Configuração de Relatório:\n");

    const format = await this.question(
      "Formato do relatório (markdown/json/html/all) [markdown]: "
    );
    const detailLevel = await this.question(
      "Nível de detalhes (summary/detailed/verbose) [detailed]: "
    );
    const includeStackTraces = await this.question(
      "Incluir stack traces? (S/n): "
    );
    const includeMetrics = await this.question(
      "Incluir métricas de performance? (S/n): "
    );
    const outputPath = await this.question(
      "Caminho do arquivo de saída [padrão]: "
    );

    return {
      format: (format as any) || "markdown",
      detailLevel: (detailLevel as any) || "detailed",
      includeStackTraces: !includeStackTraces.toLowerCase().startsWith("n"),
      includeMetrics: !includeMetrics.toLowerCase().startsWith("n"),
      outputPath: outputPath || undefined,
    };
  }

  /**
   * Confirma execução com o usuário
   */
  private async confirmExecution(
    suites: string[],
    executionOptions: any,
    reportOptions: any
  ): Promise<boolean> {
    console.log("\n📋 Resumo da Configuração:\n");
    console.log(`Conjuntos selecionados: ${suites.length}`);
    suites.forEach((suite) => console.log(`  - ${suite}`));
    console.log(
      `\nExecução paralela: ${
        executionOptions.maxParallelSuites || 3
      } conjuntos`
    );
    console.log(
      `Timeout global: ${(executionOptions.globalTimeout || 300000) / 1000}s`
    );
    console.log(
      `Continuar após falhas: ${
        executionOptions.continueOnFailure ? "Sim" : "Não"
      }`
    );
    console.log(`Formato do relatório: ${reportOptions.format || "markdown"}`);
    console.log(
      `Nível de detalhes: ${reportOptions.detailLevel || "detailed"}`
    );

    const confirm = await this.question("\nConfirmar execução? (S/n): ");
    return !confirm.toLowerCase().startsWith("n");
  }

  /**
   * Executa os testes com as configurações selecionadas
   */
  private async executeTests(
    suites: string[],
    executionOptions: any,
    reportOptions: any
  ): Promise<void> {
    const config: Partial<TestConfig> = {
      executionConfig: {
        ...DEFAULT_TEST_CONFIG.executionConfig,
        ...executionOptions,
      },
      reportConfig: {
        ...DEFAULT_TEST_CONFIG.reportConfig,
        ...reportOptions,
      },
    };

    const orchestrator = new TestOrchestrator(config);

    console.log("\n🚀 Iniciando execução...\n");

    const results =
      suites.length === DEFAULT_TEST_SUITES.length
        ? await orchestrator.runAllTests()
        : await orchestrator.runSpecificTests(suites);

    const reportPath = await orchestrator.generateReport(results);

    console.log(`\n✅ Execução concluída!`);
    console.log(`📄 Relatório gerado: ${reportPath}`);
    console.log(`📊 Status: ${results.summary.overallStatus.toUpperCase()}`);
  }

  /**
   * Constrói configuração baseada nos argumentos da CLI
   */
  private async buildConfig(): Promise<Partial<TestConfig>> {
    let config: Partial<TestConfig> = {};

    // Carregar arquivo de configuração se especificado
    if (this.options.config) {
      try {
        const configContent = readFileSync(this.options.config, "utf8");
        config = JSON.parse(configContent);
      } catch (error) {
        throw new Error(`Erro ao carregar arquivo de configuração: ${error}`);
      }
    }

    // Override com opções da CLI
    config.executionConfig = {
      ...DEFAULT_TEST_CONFIG.executionConfig,
      ...config.executionConfig,
      maxParallelSuites: this.options.parallel,
      globalTimeout: this.options.timeout * 1000,
      continueOnFailure: this.options.continueOnFailure,
    };

    config.reportConfig = {
      ...DEFAULT_TEST_CONFIG.reportConfig,
      ...config.reportConfig,
      format: this.options.format,
      includeMetrics: this.options.includeMetrics,
      includeStackTraces: this.options.includeStackTraces,
      detailLevel: this.options.detailLevel,
    };

    if (this.options.output) {
      config.reportConfig!.outputPath = this.options.output;
    }

    return config;
  }

  /**
   * Faz parsing dos argumentos da linha de comando
   */
  private parseArguments(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
      help: false,
      version: false,
      interactive: false,
      verbose: false,
      quiet: false,
      suites: [],
      format: "markdown",
      parallel: 3,
      timeout: 300,
      retries: 1,
      continueOnFailure: true,
      includeMetrics: true,
      includeStackTraces: true,
      detailLevel: "detailed",
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case "-h":
        case "--help":
          options.help = true;
          break;

        case "-v":
        case "--version":
          options.version = true;
          break;

        case "-i":
        case "--interactive":
          options.interactive = true;
          break;

        case "--verbose":
          options.verbose = true;
          break;

        case "-q":
        case "--quiet":
          options.quiet = true;
          break;

        case "-s":
        case "--suites":
          if (nextArg && !nextArg.startsWith("-")) {
            options.suites = nextArg.split(",").map((s) => s.trim());
            i++;
          }
          break;

        case "-c":
        case "--config":
          if (nextArg && !nextArg.startsWith("-")) {
            options.config = nextArg;
            i++;
          }
          break;

        case "-o":
        case "--output":
          if (nextArg && !nextArg.startsWith("-")) {
            options.output = nextArg;
            i++;
          }
          break;

        case "-f":
        case "--format":
          if (
            nextArg &&
            ["markdown", "json", "html", "all"].includes(nextArg)
          ) {
            options.format = nextArg as any;
            i++;
          }
          break;

        case "-p":
        case "--parallel":
          if (nextArg && !isNaN(parseInt(nextArg))) {
            options.parallel = parseInt(nextArg);
            i++;
          }
          break;

        case "-t":
        case "--timeout":
          if (nextArg && !isNaN(parseInt(nextArg))) {
            options.timeout = parseInt(nextArg);
            i++;
          }
          break;

        case "--no-continue":
          options.continueOnFailure = false;
          break;

        case "--no-metrics":
          options.includeMetrics = false;
          break;

        case "--no-stack-traces":
          options.includeStackTraces = false;
          break;

        case "--detail-level":
          if (nextArg && ["summary", "detailed", "verbose"].includes(nextArg)) {
            options.detailLevel = nextArg as any;
            i++;
          }
          break;

        default:
          // Argumentos não reconhecidos são ignorados
          if (!options.quiet) {
            console.warn(`⚠️  Argumento não reconhecido: ${arg}`);
          }
          break;
      }
    }

    // Validações
    if (options.verbose && options.quiet) {
      throw new Error(
        "Não é possível usar --verbose e --quiet simultaneamente"
      );
    }

    return options;
  }

  /**
   * Configura nível de logging baseado nas opções
   */
  private configureLogging(): void {
    if (this.options.quiet) {
      // Suprimir todos os logs exceto erros críticos
      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;

      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};

      // Manter console.error para erros críticos
    } else if (this.options.verbose) {
      // Modo verbose - mostrar informações adicionais
      const originalLog = console.log;
      console.log = (...args) => {
        const timestamp = new Date().toISOString();
        originalLog(`[${timestamp}]`, ...args);
      };
    }
  }

  /**
   * Mostra ajuda da CLI
   */
  private showHelp(): void {
    console.log(`
🧪 Sistema de Testes Abrangentes - Interface de Linha de Comando

USAGE:
  node cli.js [OPTIONS]

OPTIONS:
  -h, --help                    Mostra esta ajuda
  -v, --version                 Mostra a versão
  -i, --interactive             Modo interativo para seleção de testes
  --verbose                     Modo verboso com logs detalhados
  -q, --quiet                   Modo silencioso (apenas erros)

CONFIGURAÇÃO DE TESTES:
  -s, --suites <names>          Conjuntos específicos (separados por vírgula)
  -c, --config <file>           Arquivo de configuração JSON
  -p, --parallel <num>          Número máximo de conjuntos paralelos (padrão: 3)
  -t, --timeout <seconds>       Timeout global em segundos (padrão: 300)
  --no-continue                 Para execução na primeira falha crítica

CONFIGURAÇÃO DE RELATÓRIO:
  -o, --output <file>           Caminho do arquivo de relatório
  -f, --format <format>         Formato: markdown, json, html, all (padrão: markdown)
  --detail-level <level>        Nível: summary, detailed, verbose (padrão: detailed)
  --no-metrics                  Não incluir métricas de performance
  --no-stack-traces             Não incluir stack traces

CONJUNTOS DE TESTES DISPONÍVEIS:
  - Feed Discovery Service      (crítico, integração)
  - Validation Flow Integration (crítico, integração)
  - Proxy Integration          (integração)
  - Performance Tests          (performance)
  - Feed Duplicate Detector    (funcional)
  - OPML Export Service        (funcional)

EXEMPLOS:
  # Modo interativo
  node cli.js --interactive

  # Executar todos os testes
  node cli.js

  # Executar testes específicos
  node cli.js --suites "Feed Discovery Service,Performance Tests"

  # Executar com configuração personalizada
  node cli.js --config config.json --format json --output results.json

  # Modo silencioso para CI/CD
  node cli.js --quiet --no-continue --format json

  # Modo verboso para debugging
  node cli.js --verbose --detail-level verbose

CÓDIGOS DE SAÍDA:
  0  - Todos os testes passaram
  1  - Falhas críticas detectadas
  2  - Falhas não-críticas detectadas

Para mais informações, consulte a documentação do projeto.
`);
  }

  /**
   * Mostra versão do sistema
   */
  private showVersion(): void {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), "package.json"), "utf8")
      );
      console.log(
        `Sistema de Testes Abrangentes v${packageJson.version || "1.0.0"}`
      );
      console.log(`Node.js ${process.version}`);
      console.log(`Plataforma: ${process.platform} ${process.arch}`);
    } catch (error) {
      console.log("Sistema de Testes Abrangentes v1.0.0");
    }
  }

  /**
   * Obtém ícone para categoria de teste
   */
  private getCategoryIcon(category: string): string {
    switch (category) {
      case "integration":
        return "🔗";
      case "performance":
        return "⚡";
      case "functional":
        return "⚙️";
      case "unit":
        return "🧩";
      default:
        return "📝";
    }
  }

  /**
   * Utilitário para fazer perguntas no modo interativo
   */
  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl!.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Executar CLI se este arquivo for executado diretamente ou em modo CLI
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.env.CLI_MODE === "true"
) {
  // Se estamos em modo CLI via environment, usar os argumentos do environment
  if (process.env.CLI_MODE === "true" && process.env.CLI_ARGS) {
    try {
      const cliArgs = JSON.parse(process.env.CLI_ARGS);
      process.argv = ["node", "cli.ts", ...cliArgs];
    } catch (e) {
      // Ignorar erro de parsing e usar argumentos padrão
    }
  }

  const cli = new TestCli();
  cli.run().catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });
}

export { TestCli };
