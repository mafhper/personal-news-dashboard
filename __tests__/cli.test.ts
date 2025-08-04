/**
 * cli.test.ts
 *
 * Testes para a interface de linha de comando
 * Verifica argumentos, modo interativo, help system e controle de verbosidade
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestCli } from "./cli";
import * as fs from "fs";
import * as readline from "readline";

// Mock dependencies
vi.mock("fs");
vi.mock("readline");
vi.mock("./testOrchestrator", () => ({
  TestOrchestrator: vi.fn(),
}));

describe("TestCli", () => {
  let originalArgv: string[];
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;
  let mockConsoleLog: ReturnType<typeof vi.fn>;
  let mockConsoleError: ReturnType<typeof vi.fn>;
  let mockProcessExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalArgv = process.argv;
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;

    mockConsoleLog = vi.fn();
    mockConsoleError = vi.fn();
    mockProcessExit = vi.fn();

    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = mockProcessExit as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    vi.clearAllMocks();
  });

  describe("Argument Parsing", () => {
    it("should parse help argument correctly", async () => {
      process.argv = ["node", "cli.js", "--help"];

      const cli = new TestCli();
      await cli.run();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(
          "Sistema de Testes Abrangentes - Interface de Linha de Comando"
        )
      );
    });

    it("should parse version argument correctly", async () => {
      process.argv = ["node", "cli.js", "--version"];

      const cli = new TestCli();
      await cli.run();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Sistema de Testes Abrangentes")
      );
    });

    it("should parse verbose argument correctly", async () => {
      process.argv = ["node", "cli.js", "--verbose"];

      // Mock TestOrchestrator to avoid actual test execution
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 5,
            totalSuites: 6,
            passedTests: 50,
            totalTests: 60,
            overallStatus: "partial",
          },
          duration: 30000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const cli = new TestCli();
      await cli.run();

      // Verify verbose logging is enabled (timestamps should be added)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\]$/),
        expect.any(String)
      );
    });

    it("should parse quiet argument correctly", async () => {
      process.argv = ["node", "cli.js", "--quiet"];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const cli = new TestCli();
      await cli.run();

      // In quiet mode, most console.log calls should be suppressed
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining("🚀 Executando testes")
      );
    });

    it("should parse suites argument correctly", async () => {
      process.argv = [
        "node",
        "cli.js",
        "--suites",
        "Feed Discovery Service,Performance Tests",
      ];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runSpecificTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 2,
            totalSuites: 2,
            passedTests: 20,
            totalTests: 20,
            overallStatus: "passed",
          },
          duration: 15000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const cli = new TestCli();
      await cli.run();

      expect(mockOrchestrator.runSpecificTests).toHaveBeenCalledWith([
        "Feed Discovery Service",
        "Performance Tests",
      ]);
    });

    it("should parse format argument correctly", async () => {
      process.argv = ["node", "cli.js", "--format", "json"];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.json"),
      };

      vi.mocked(TestOrchestrator).mockImplementation((config) => {
        expect(config?.reportConfig?.format).toBe("json");
        return mockOrchestrator as any;
      });

      const cli = new TestCli();
      await cli.run();
    });

    it("should parse parallel argument correctly", async () => {
      process.argv = ["node", "cli.js", "--parallel", "5"];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 20000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation((config) => {
        expect(config?.executionConfig?.maxParallelSuites).toBe(5);
        return mockOrchestrator as any;
      });

      const cli = new TestCli();
      await cli.run();
    });

    it("should parse timeout argument correctly", async () => {
      process.argv = ["node", "cli.js", "--timeout", "600"];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 30000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation((config) => {
        expect(config?.executionConfig?.globalTimeout).toBe(600000); // 600 seconds * 1000
        return mockOrchestrator as any;
      });

      const cli = new TestCli();
      await cli.run();
    });

    it("should handle config file argument", async () => {
      const mockConfig = {
        testSuites: [],
        reportConfig: { format: "html" },
        executionConfig: { maxParallelSuites: 2 },
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      process.argv = ["node", "cli.js", "--config", "test-config.json"];

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.html"),
      };

      vi.mocked(TestOrchestrator).mockImplementation((config) => {
        expect(config?.reportConfig?.format).toBe("html");
        expect(config?.executionConfig?.maxParallelSuites).toBe(2);
        return mockOrchestrator as any;
      });

      const cli = new TestCli();
      await cli.run();

      expect(fs.readFileSync).toHaveBeenCalledWith("test-config.json", "utf8");
    });
  });

  describe("Help System", () => {
    it("should show comprehensive help information", async () => {
      process.argv = ["node", "cli.js", "--help"];

      const cli = new TestCli();
      await cli.run();

      // Verify help contains key sections
      const helpOutput = mockConsoleLog.mock.calls.join(" ");

      expect(helpOutput).toContain("USAGE:");
      expect(helpOutput).toContain("OPTIONS:");
      expect(helpOutput).toContain("CONFIGURAÇÃO DE TESTES:");
      expect(helpOutput).toContain("CONFIGURAÇÃO DE RELATÓRIO:");
      expect(helpOutput).toContain("CONJUNTOS DE TESTES DISPONÍVEIS:");
      expect(helpOutput).toContain("EXEMPLOS:");
      expect(helpOutput).toContain("CÓDIGOS DE SAÍDA:");

      // Verify specific options are documented
      expect(helpOutput).toContain("--interactive");
      expect(helpOutput).toContain("--verbose");
      expect(helpOutput).toContain("--quiet");
      expect(helpOutput).toContain("--suites");
      expect(helpOutput).toContain("--format");
      expect(helpOutput).toContain("--parallel");
    });

    it("should show version information", async () => {
      // Mock package.json reading
      const mockPackageJson = {
        version: "2.1.0",
      };
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(mockPackageJson)
      );

      process.argv = ["node", "cli.js", "--version"];

      const cli = new TestCli();
      await cli.run();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("v2.1.0")
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`Node.js ${process.version}`)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(
          `Plataforma: ${process.platform} ${process.arch}`
        )
      );
    });
  });

  describe("Interactive Mode", () => {
    it("should handle interactive mode initialization", async () => {
      // Mock readline interface
      const mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      };

      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      // Mock user responses
      mockRl.question
        .mockImplementationOnce((prompt, callback) => callback("all")) // test selection
        .mockImplementationOnce((prompt, callback) => callback("3")) // parallel
        .mockImplementationOnce((prompt, callback) => callback("300")) // timeout
        .mockImplementationOnce((prompt, callback) => callback("s")) // continue on failure
        .mockImplementationOnce((prompt, callback) => callback("s")) // retry failed tests
        .mockImplementationOnce((prompt, callback) => callback("markdown")) // format
        .mockImplementationOnce((prompt, callback) => callback("detailed")) // detail level
        .mockImplementationOnce((prompt, callback) => callback("s")) // include stack traces
        .mockImplementationOnce((prompt, callback) => callback("s")) // include metrics
        .mockImplementationOnce((prompt, callback) => callback("")) // output path
        .mockImplementationOnce((prompt, callback) => callback("s")); // confirm execution

      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      process.argv = ["node", "cli.js", "--interactive"];

      const cli = new TestCli();
      await cli.run();

      expect(readline.createInterface).toHaveBeenCalled();
      expect(mockRl.question).toHaveBeenCalledTimes(11);
      expect(mockRl.close).toHaveBeenCalled();
      expect(mockOrchestrator.runAllTests).toHaveBeenCalled();
    });

    it("should handle user cancellation in interactive mode", async () => {
      // Mock readline interface
      const mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      };

      vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);

      // Mock user responses - user cancels at confirmation
      mockRl.question
        .mockImplementationOnce((prompt, callback) => callback("1,2")) // test selection
        .mockImplementationOnce((prompt, callback) => callback("3")) // parallel
        .mockImplementationOnce((prompt, callback) => callback("300")) // timeout
        .mockImplementationOnce((prompt, callback) => callback("n")) // continue on failure
        .mockImplementationOnce((prompt, callback) => callback("s")) // retry failed tests
        .mockImplementationOnce((prompt, callback) => callback("json")) // format
        .mockImplementationOnce((prompt, callback) => callback("summary")) // detail level
        .mockImplementationOnce((prompt, callback) => callback("n")) // include stack traces
        .mockImplementationOnce((prompt, callback) => callback("n")) // include metrics
        .mockImplementationOnce((prompt, callback) => callback("custom.json")) // output path
        .mockImplementationOnce((prompt, callback) => callback("n")); // cancel execution

      process.argv = ["node", "cli.js", "--interactive"];

      const cli = new TestCli();
      await cli.run();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "❌ Execução cancelada pelo usuário."
      );
      expect(mockRl.close).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid arguments gracefully", async () => {
      process.argv = ["node", "cli.js", "--invalid-arg"];

      const cli = new TestCli();
      await cli.run();

      // Should warn about unrecognized argument but continue
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("🚀 Executando testes")
      );
    });

    it("should handle conflicting verbose and quiet arguments", async () => {
      process.argv = ["node", "cli.js", "--verbose", "--quiet"];

      expect(() => new TestCli()).toThrow(
        "Não é possível usar --verbose e --quiet simultaneamente"
      );
    });

    it("should handle config file read errors", async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("File not found");
      });

      process.argv = ["node", "cli.js", "--config", "nonexistent.json"];

      const cli = new TestCli();

      await cli.run();

      // Should exit with code 1 and show error message
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Erro:",
        expect.stringContaining("Erro ao carregar arquivo de configuração")
      );
    });

    it("should handle test execution errors", async () => {
      // Mock TestOrchestrator to throw error
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi
          .fn()
          .mockRejectedValue(new Error("Test execution failed")),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      process.argv = ["node", "cli.js"];

      const cli = new TestCli();

      await cli.run();

      // Should exit with code 1 and show error message
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Erro:",
        "Test execution failed"
      );
    });
  });

  describe("Exit Codes", () => {
    let originalExit: typeof process.exit;
    let mockExit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      originalExit = process.exit;
      mockExit = vi.fn();
      process.exit = mockExit as any;
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    it("should exit with code 0 for successful tests", async () => {
      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      process.argv = ["node", "cli.js"];

      const cli = new TestCli();
      await cli.run();

      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should exit with code 1 for failed tests", async () => {
      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 4,
            totalSuites: 6,
            passedTests: 40,
            totalTests: 60,
            overallStatus: "failed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      process.argv = ["node", "cli.js"];

      const cli = new TestCli();
      await cli.run();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should exit with code 2 for partial failures", async () => {
      // Mock TestOrchestrator
      const { TestOrchestrator } = await import("./testOrchestrator");
      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 5,
            totalSuites: 6,
            passedTests: 55,
            totalTests: 60,
            overallStatus: "partial",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.md"),
      };

      vi.mocked(TestOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      process.argv = ["node", "cli.js"];

      const cli = new TestCli();
      await cli.run();

      expect(mockExit).toHaveBeenCalledWith(2);
    });
  });

  describe("Configuration Building", () => {
    it("should merge CLI options with default config correctly", async () => {
      process.argv = [
        "node",
        "cli.js",
        "--format",
        "json",
        "--parallel",
        "4",
        "--timeout",
        "600",
        "--no-continue",
        "--no-metrics",
        "--detail-level",
        "verbose",
      ];

      // Mock TestOrchestrator to capture config
      const { TestOrchestrator } = await import("./testOrchestrator");
      let capturedConfig: any;

      const mockOrchestrator = {
        runAllTests: vi.fn().mockResolvedValue({
          summary: {
            passedSuites: 6,
            totalSuites: 6,
            passedTests: 60,
            totalTests: 60,
            overallStatus: "passed",
          },
          duration: 25000,
        }),
        generateReport: vi.fn().mockResolvedValue("test-report.json"),
      };

      vi.mocked(TestOrchestrator).mockImplementation((config) => {
        capturedConfig = config;
        return mockOrchestrator as any;
      });

      const cli = new TestCli();
      await cli.run();

      expect(capturedConfig.reportConfig.format).toBe("json");
      expect(capturedConfig.reportConfig.includeMetrics).toBe(false);
      expect(capturedConfig.reportConfig.detailLevel).toBe("verbose");
      expect(capturedConfig.executionConfig.maxParallelSuites).toBe(4);
      expect(capturedConfig.executionConfig.globalTimeout).toBe(600000);
      expect(capturedConfig.executionConfig.continueOnFailure).toBe(false);
    });
  });
});
