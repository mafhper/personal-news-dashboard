/**
 * testOrchestrator.ts
 *
 * Tipos e interfaces para o sistema de testes abrangentes
 * Fornece estruturas de dados para execução, coleta de métricas e geração de relatórios
 */

export interface TestConfig {
  testSuites: TestSuiteConfig[];
  reportConfig: ReportConfig;
  executionConfig: ExecutionConfig;
}

export interface TestSuiteConfig {
  name: string;
  filePath: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  critical: boolean; // Se falha deve parar execução
  category: "integration" | "performance" | "unit" | "functional";
}

export interface ReportConfig {
  outputPath: string;
  format: "markdown" | "json" | "html" | "all";
  includeStackTraces: boolean;
  includeMetrics: boolean;
  detailLevel: "summary" | "detailed" | "verbose";
  includeEnvironmentInfo: boolean;
  includeSuggestions: boolean;
}

export interface ExecutionConfig {
  maxParallelSuites: number;
  globalTimeout: number;
  continueOnFailure: boolean;
  collectCoverage: boolean;
  retryFailedTests: boolean;
  generateTimestamp: boolean;
}

export interface TestExecutionResult {
  summary: TestSummary;
  suiteResults: TestSuiteResult[];
  metrics: TestMetrics;
  environment: EnvironmentInfo;
  timestamp: Date;
  duration: number;
  configUsed: TestConfig;
  benchmarkResults?: BenchmarkResult[];
  performanceAlerts?: PerformanceAlert[];
  functionalValidationResults?: FunctionalValidationResult[];
  functionalAlerts?: FunctionalAlert[];
}

export interface TestSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  skippedSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  overallStatus: "passed" | "failed" | "partial";
  criticalFailures: number;
}

export interface TestSuiteResult {
  name: string;
  filePath: string;
  category: string;
  status: "passed" | "failed" | "skipped" | "timeout";
  duration: number;
  startTime: Date;
  endTime: Date;
  tests: TestCaseResult[];
  errors: TestError[];
  metrics: SuiteMetrics;
  retryCount: number;
  critical: boolean;
}

export interface TestCaseResult {
  name: string;
  fullName: string;
  status: "passed" | "failed" | "skipped" | "timeout";
  duration: number;
  error?: TestError;
  assertions: AssertionResult[];
  retryCount: number;
}

export interface TestError {
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  expected?: any;
  actual?: any;
  diff?: string;
  suggestions?: string[];
  category: ErrorCategory;
  severity: "critical" | "high" | "medium" | "low";
}

export interface AssertionResult {
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
}

export interface TestMetrics {
  performance: PerformanceMetrics;
  coverage?: CoverageMetrics;
  resources: ResourceMetrics;
  trends?: TrendMetrics;
}

export interface PerformanceMetrics {
  averageTestDuration: number;
  medianTestDuration: number;
  slowestTests: TestCaseResult[];
  fastestTests: TestCaseResult[];
  totalExecutionTime: number;
  setupTime: number;
  teardownTime: number;
}

export interface ResourceMetrics {
  memoryUsage: MemoryUsage;
  cpuUsage: CpuUsage;
  diskUsage?: DiskUsage;
  networkUsage?: NetworkUsage;
}

export interface MemoryUsage {
  peak: number;
  average: number;
  initial: number;
  final: number;
  leaks?: MemoryLeak[];
}

export interface CpuUsage {
  average: number;
  peak: number;
  userTime: number;
  systemTime: number;
}

export interface DiskUsage {
  reads: number;
  writes: number;
  totalBytes: number;
}

export interface NetworkUsage {
  requests: number;
  bytesTransferred: number;
  averageLatency: number;
}

export interface MemoryLeak {
  location: string;
  size: number;
  description: string;
}

export interface CoverageMetrics {
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
}

export interface CoverageData {
  total: number;
  covered: number;
  percentage: number;
}

export interface TrendMetrics {
  performanceTrend: "improving" | "stable" | "degrading";
  reliabilityTrend: "improving" | "stable" | "degrading";
  coverageTrend: "improving" | "stable" | "degrading";
  historicalData?: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  timestamp: Date;
  duration: number;
  passRate: number;
  coverage: number;
}

export interface SuiteMetrics {
  testCount: number;
  averageDuration: number;
  memoryUsed: number;
  cpuUsed: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  os: string;
  vitestVersion: string;
  timestamp: Date;
  gitInfo?: GitInfo;
  ciInfo?: CiInfo;
  systemResources: SystemResources;
}

export interface GitInfo {
  branch: string;
  commit: string;
  author: string;
  message: string;
  isDirty: boolean;
}

export interface CiInfo {
  provider: string;
  buildNumber: string;
  jobId: string;
  pullRequest?: string;
}

export interface SystemResources {
  totalMemory: number;
  availableMemory: number;
  cpuCores: number;
  diskSpace: number;
}

export enum ErrorCategory {
  ASSERTION_FAILURE = "assertion_failure",
  TIMEOUT = "timeout",
  NETWORK_ERROR = "network_error",
  CONFIGURATION_ERROR = "configuration_error",
  PERFORMANCE_DEGRADATION = "performance_degradation",
  INTEGRATION_FAILURE = "integration_failure",
  MOCK_FAILURE = "mock_failure",
  DEPENDENCY_ERROR = "dependency_error",
  UNKNOWN = "unknown",
}

export interface ErrorAnalysis {
  category: ErrorCategory;
  severity: "critical" | "high" | "medium" | "low";
  impact: string;
  suggestions: string[];
  relatedTests: string[];
  possibleCauses: string[];
  quickFixes: string[];
  documentationLinks: string[];
}

// Configurações padrão para os conjuntos de testes principais
export const DEFAULT_TEST_SUITES: TestSuiteConfig[] = [
  {
    name: "Feed Discovery Service",
    filePath: "__tests__/feedDiscoveryService.comprehensive.test.ts",
    timeout: 30000,
    retries: 1,
    parallel: false,
    critical: true,
    category: "integration",
  },
  {
    name: "Validation Flow Integration",
    filePath: "__tests__/validationFlow.integration.test.ts",
    timeout: 45000,
    retries: 1,
    parallel: false,
    critical: true,
    category: "integration",
  },
  {
    name: "Proxy Integration",
    filePath: "__tests__/proxyIntegration.test.ts",
    timeout: 30000,
    retries: 2,
    parallel: true,
    critical: false,
    category: "integration",
  },
  {
    name: "Performance Tests",
    filePath: "__tests__/performance.test.ts",
    timeout: 60000,
    retries: 1,
    parallel: false,
    critical: false,
    category: "performance",
  },
  {
    name: "Feed Duplicate Detector",
    filePath: "__tests__/feedDuplicateDetector.test.ts",
    timeout: 20000,
    retries: 1,
    parallel: true,
    critical: false,
    category: "functional",
  },
  {
    name: "OPML Export Service",
    filePath: "__tests__/opmlExportService.test.ts",
    timeout: 25000,
    retries: 1,
    parallel: true,
    critical: false,
    category: "functional",
  },
];

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  outputPath: "resultadoTestesCompletos_{timestamp}.md",
  format: "markdown",
  includeStackTraces: true,
  includeMetrics: true,
  detailLevel: "detailed",
  includeEnvironmentInfo: true,
  includeSuggestions: true,
};

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  maxParallelSuites: 3,
  globalTimeout: 300000, // 5 minutos
  continueOnFailure: true,
  collectCoverage: false,
  retryFailedTests: true,
  generateTimestamp: true,
};

export const DEFAULT_TEST_CONFIG: TestConfig = {
  testSuites: DEFAULT_TEST_SUITES,
  reportConfig: DEFAULT_REPORT_CONFIG,
  executionConfig: DEFAULT_EXECUTION_CONFIG,
};

// Benchmark and Performance Alert Types
export interface BenchmarkResult {
  category:
    | "concurrent_validation"
    | "cache_performance"
    | "memory_usage"
    | "network_efficiency";
  metric: string;
  value: number;
  threshold: number;
  status: "passed" | "failed";
  description: string;
}

export interface PerformanceAlert {
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "performance_degradation"
    | "cache_efficiency"
    | "memory_usage"
    | "network_efficiency";
  message: string;
  suggestion: string;
}

// Functional Test Validation Types
export interface FunctionalValidationResult {
  category:
    | "duplicate_detection"
    | "content_fingerprinting"
    | "opml_generation"
    | "xml_escaping"
    | "file_download";
  testType: string;
  passRate: number;
  threshold: number;
  status: "passed" | "failed";
  description: string;
  testsRun: number;
  testsPassed: number;
}

export interface FunctionalAlert {
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "duplicate_detection"
    | "content_fingerprinting"
    | "opml_generation"
    | "xml_escaping"
    | "file_download";
  message: string;
  suggestion: string;
  affectedTests: string[];
}
