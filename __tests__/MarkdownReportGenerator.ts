/**
 * MarkdownReportGene

 * Gerador avançado de relatórios em formato Markdown
 * Implementa templates estruturados, formatação de dados e seções detalhadas
 */

import {
  TestExecutionResult,
  TestSuiteResult,
  TestError,
  TestMetrics,
  EnvironmentInfo,
  ReportConfig,
  ErrorCategory,
  TestCaseResult,
} from "./types/testOrchestrator";

export interface MarkdownReportSections {
  executiveSummary: string;
  environmentInfo: string;
  testSuiteResults: string;
  failureAnalysis: string;
  performanceMetrics: string;
  recommendations: string;
  appendices: string;
}

export class MarkdownReportGenerator {
  private config: ReportConfig;

  constructor(config: ReportConfig) {
    this.config = config;
  }

  /**
   * Gera o relatório completo em formato Markdown
   */
  generateReport(results: TestExecutionResult): string {
    const sections = this.generateAllSections(results);

    return this.assembleReport(results, sections);
  }

  /**
   * Gera todas as seções do relatório
   */
  private generateAllSections(
    results: TestExecutionResult
  ): MarkdownReportSections {
    return {
      executiveSummary: this.generateExecutiveSummary(results),
      environmentInfo: this.generateEnvironmentInfo(results.environment),
      testSuiteResults: this.generateTestSuiteResults(results.suiteResults),
      failureAnalysis: this.generateFailureAnalysis(results.suiteResults),
      performanceMetrics: this.generatePerformanceMetrics(results.metrics),
      recommendations: this.generateRecommendations(results),
      appendices: this.generateAppendices(results),
    };
  }

  /**
   * Monta o relatório final combinando todas as seções
   */
  private assembleReport(
    results: TestExecutionResult,
    sections: MarkdownReportSections
  ): string {
    const timestamp = this.formatTimestamp(results.timestamp);
    const duration = this.formatDuration(results.duration);

    let report = this.generateReportHeader(
      timestamp,
      duration,
      results.summary.overallStatus
    );

    // Adicionar índice se detailLevel for verbose
    if (this.config.detailLevel === "verbose") {
      report += this.generateTableOfContents(results);
    }

    // Adicionar seções baseadas na configuração de detalhamento
    report += sections.executiveSummary;

    // Adicionar gráficos avançados ao resumo executivo
    if (this.config.detailLevel !== "summary") {
      report += this.enhanceExecutiveSummaryWithCharts(results);
    }

    if (this.config.includeEnvironmentInfo) {
      report += sections.environmentInfo;
    }

    report += sections.testSuiteResults;

    if (results.summary.failedTests > 0) {
      report += sections.failureAnalysis;
    }

    if (this.config.includeMetrics) {
      report += sections.performanceMetrics;

      // Adicionar gráficos avançados às métricas de performance
      if (this.config.detailLevel !== "summary") {
        report += this.enhancePerformanceMetricsWithCharts(results.metrics);
      }
    }

    if (this.config.includeSuggestions) {
      report += sections.recommendations;
    }

    if (this.config.detailLevel === "verbose") {
      report += sections.appendices;
    }

    report += this.generateReportFooter(results);

    return report;
  }

  /**
   * Gera o cabeçalho do relatório
   */
  private generateReportHeader(
    timestamp: string,
    duration: string,
    status: string
  ): string {
    const statusIcon = this.getStatusIcon(status);

    return `# 📊 Relatório de Testes Completos

**Data de Execução:** ${timestamp}
**Duração Total:** ${duration}
**Status:** ${statusIcon} ${status.toUpperCase()}

---

`;
  }

  /**
   * Gera o resumo executivo
   */
  private generateExecutiveSummary(results: TestExecutionResult): string {
    const { summary } = results;
    const statusIcon = this.getStatusIcon(summary.overallStatus);
    const successRate = this.calculateSuccessRate(
      summary.passedTests,
      summary.totalTests
    );
    const suiteSuccessRate = this.calculateSuccessRate(
      summary.passedSuites,
      summary.totalSuites
    );

    let section = `## 📋 Resumo Executivo

### Status Geral: ${statusIcon} ${summary.overallStatus.toUpperCase()}

| Métrica | Valor | Taxa de Sucesso |
|---------|-------|-----------------|
| **Conjuntos de Testes** | ${summary.passedSuites}/${
      summary.totalSuites
    } | ${suiteSuccessRate}% |
| **Testes Individuais** | ${summary.passedTests}/${
      summary.totalTests
    } | ${successRate}% |
| **Tempo Total** | ${this.formatDuration(summary.totalDuration)} | - |
| **Falhas Críticas** | ${summary.criticalFailures} | - |

`;

    // Adicionar alertas para falhas críticas
    if (summary.criticalFailures > 0) {
      section += `> ⚠️ **ATENÇÃO:** ${summary.criticalFailures} falha(s) crítica(s) detectada(s). Ação imediata necessária.\n\n`;
    }

    // Adicionar indicador de qualidade
    const qualityIndicator = this.getQualityIndicator(successRate);
    section += `**Indicador de Qualidade:** ${qualityIndicator}\n\n`;

    return section;
  }

  /**
   * Gera informações do ambiente de execução
   */
  private generateEnvironmentInfo(environment: EnvironmentInfo): string {
    let section = `## 🖥️ Ambiente de Execução

| Componente | Versão/Informação |
|------------|-------------------|
| **Data/Hora** | ${this.formatTimestamp(environment.timestamp)} |
| **Node.js** | ${environment.nodeVersion} |
| **Sistema Operacional** | ${environment.os} |
| **Plataforma** | ${environment.platform} (${environment.arch}) |
| **Vitest** | ${environment.vitestVersion} |
| **Memória Total** | ${this.formatBytes(
      environment.systemResources.totalMemory
    )} |
| **Memória Disponível** | ${this.formatBytes(
      environment.systemResources.availableMemory
    )} |
| **CPUs** | ${environment.systemResources.cpuCores} cores |

`;

    // Adicionar informações de Git se disponíveis
    if (environment.gitInfo) {
      section += `### 📝 Informações do Git

| Campo | Valor |
|-------|-------|
| **Branch** | \`${environment.gitInfo.branch}\` |
| **Commit** | \`${environment.gitInfo.commit.substring(0, 8)}\` |
| **Autor** | ${environment.gitInfo.author} |
| **Mensagem** | ${environment.gitInfo.message} |
| **Estado** | ${environment.gitInfo.isDirty ? "🔴 Modificado" : "✅ Limpo"} |

`;
    }

    // Adicionar informações de CI se disponíveis
    if (environment.ciInfo) {
      section += `### 🔄 Informações de CI/CD

| Campo | Valor |
|-------|-------|
| **Provedor** | ${environment.ciInfo.provider} |
| **Build** | #${environment.ciInfo.buildNumber} |
| **Job ID** | ${environment.ciInfo.jobId} |
${
  environment.ciInfo.pullRequest
    ? `| **Pull Request** | #${environment.ciInfo.pullRequest} |`
    : ""
}

`;
    }

    return section;
  }

  /**
   * Gera resultados detalhados por conjunto de testes
   */
  private generateTestSuiteResults(suiteResults: TestSuiteResult[]): string {
    let section = `## 🧪 Resultados por Conjunto de Testes

`;

    // Tabela resumo
    section += `### Resumo dos Conjuntos

| Conjunto | Status | Categoria | Duração | Testes | Taxa de Sucesso |
|----------|--------|-----------|---------|--------|-----------------|
`;

    for (const suite of suiteResults) {
      const statusIcon = this.getStatusIcon(suite.status);
      const criticalBadge = suite.critical ? " 🔴" : "";
      const successRate = this.calculateSuccessRate(
        suite.tests.filter((t) => t.status === "passed").length,
        suite.tests.length
      );

      section += `| ${suite.name}${criticalBadge} | ${statusIcon} ${
        suite.status
      } | ${suite.category} | ${this.formatDuration(suite.duration)} | ${
        suite.tests.length
      } | ${successRate}% |\n`;
    }

    section += "\n";

    // Detalhes por conjunto
    section += `### Detalhes dos Conjuntos\n\n`;

    for (const suite of suiteResults) {
      section += this.generateSuiteDetailSection(suite);
    }

    return section;
  }

  /**
   * Gera seção detalhada para um conjunto específico
   */
  private generateSuiteDetailSection(suite: TestSuiteResult): string {
    const statusIcon = this.getStatusIcon(suite.status);
    const criticalBadge = suite.critical ? " 🔴 **CRÍTICO**" : "";

    let section = `#### ${suite.name} ${statusIcon}${criticalBadge}

**Arquivo:** \`${suite.filePath}\`
**Categoria:** ${suite.category}
**Duração:** ${this.formatDuration(suite.duration)}
**Status:** ${suite.status.toUpperCase()}
`;

    if (suite.retryCount > 0) {
      section += `**Tentativas:** ${suite.retryCount + 1}  \n`;
    }

    // Estatísticas dos testes
    const passedTests = suite.tests.filter((t) => t.status === "passed").length;
    const failedTests = suite.tests.filter((t) => t.status === "failed").length;
    const skippedTests = suite.tests.filter(
      (t) => t.status === "skipped"
    ).length;

    section += `
**Estatísticas:**
- ✅ Aprovados: ${passedTests}
- ❌ Falharam: ${failedTests}
- ⏭️ Ignorados: ${skippedTests}
- 📊 Total: ${suite.tests.length}

`;

    // Métricas do conjunto
    if (this.config.includeMetrics && suite.metrics) {
      section += `**Métricas:**
- ⏱️ Duração Média: ${suite.metrics.averageDuration.toFixed(2)}ms
- 🧠 Memória Usada: ${this.formatBytes(suite.metrics.memoryUsed)}
- 🔄 CPU: ${suite.metrics.cpuUsed.toFixed(1)}%
- 🌐 Requisições de Rede: ${suite.metrics.networkRequests}
- 💾 Cache Hits: ${suite.metrics.cacheHits}/${
        suite.metrics.cacheHits + suite.metrics.cacheMisses
      }

`;
    }

    // Falhas específicas
    if (suite.errors.length > 0) {
      section += `**Falhas Detectadas:**\n\n`;

      for (let i = 0; i < suite.errors.length; i++) {
        const error = suite.errors[i];
        section += this.generateErrorSection(error, i + 1);
      }
    }

    // Testes individuais (apenas se detailLevel for verbose)
    if (this.config.detailLevel === "verbose" && suite.tests.length > 0) {
      section += `**Testes Individuais:**\n\n`;
      section += `| Teste | Status | Duração |\n`;
      section += `|-------|--------|----------|\n`;

      for (const test of suite.tests) {
        const testStatusIcon = this.getStatusIcon(test.status);
        section += `| ${test.name} | ${testStatusIcon} ${
          test.status
        } | ${this.formatDuration(test.duration)} |\n`;
      }
      section += "\n";
    }

    section += "---\n\n";

    return section;
  }

  /**
   * Gera seção de erro detalhada
   */
  private generateErrorSection(error: TestError, index: number): string {
    const severityIcon = this.getSeverityIcon(error.severity);

    let section = `**${index}. ${severityIcon} ${error.category
      .replace(/_/g, " ")
      .toUpperCase()}**

**Mensagem:** ${error.message}

`;

    if (error.file && error.line) {
      section += `**Localização:** \`${error.file}:${error.line}${
        error.column ? `:${error.column}` : ""
      }\`\n\n`;
    }

    if (error.expected !== undefined && error.actual !== undefined) {
      section += `**Comparação:**
- **Esperado:** \`${this.formatValue(error.expected)}\`
- **Recebido:** \`${this.formatValue(error.actual)}\`

`;
    }

    if (error.diff && this.config.detailLevel !== "summary") {
      section += `**Diferença:**
\`\`\`diff
${error.diff}
\`\`\`

`;
    }

    if (this.config.includeStackTraces && error.stack) {
      section += `<details>
<summary>📋 Stack Trace</summary>

\`\`\`
${error.stack}
\`\`\`

</details>

`;
    }

    if (
      this.config.includeSuggestions &&
      error.suggestions &&
      error.suggestions.length > 0
    ) {
      section += `**💡 Sugestões:**
`;
      for (const suggestion of error.suggestions) {
        section += `- ${suggestion}\n`;
      }
      section += "\n";
    }

    return section;
  }

  /**
   * Gera análise detalhada de falhas
   */
  private generateFailureAnalysis(suiteResults: TestSuiteResult[]): string {
    const failedSuites = suiteResults.filter((s) => s.status === "failed");

    if (failedSuites.length === 0) {
      return "";
    }

    let section = `## 🔍 Análise de Falhas

### Resumo de Falhas

| Métrica | Valor |
|---------|-------|
| **Conjuntos com Falhas** | ${failedSuites.length} |
| **Conjuntos Críticos com Falhas** | ${
      failedSuites.filter((s) => s.critical).length
    } |
| **Total de Erros** | ${failedSuites.reduce(
      (sum, s) => sum + s.errors.length,
      0
    )} |

`;

    // Análise por categoria de erro
    const errorsByCategory = this.groupErrorsByCategory(failedSuites);

    section += `### Falhas por Categoria

| Categoria | Ocorrências | Severidade Média | Conjuntos Afetados |
|-----------|-------------|------------------|-------------------|
`;

    for (const [category, errors] of Object.entries(errorsByCategory)) {
      const avgSeverity = this.calculateAverageSeverity(errors);
      const affectedSuites = new Set(
        errors.map((e) => failedSuites.find((s) => s.errors.includes(e))?.name)
      ).size;

      section += `| ${category.replace(/_/g, " ")} | ${
        errors.length
      } | ${avgSeverity} | ${affectedSuites} |\n`;
    }

    section += "\n";

    // Top 5 erros mais comuns
    const errorFrequency = this.calculateErrorFrequency(failedSuites);
    if (errorFrequency.length > 0) {
      section += `### Erros Mais Frequentes

| Erro | Frequência | Conjuntos Afetados |
|------|------------|-------------------|
`;

      for (const { message, count, suites } of errorFrequency.slice(0, 5)) {
        section += `| ${message.substring(0, 50)}${
          message.length > 50 ? "..." : ""
        } | ${count} | ${suites.join(", ")} |\n`;
      }
      section += "\n";
    }

    // Análise de impacto
    section += this.generateImpactAnalysis(failedSuites);

    // Padrões de falha
    section += this.generateFailurePatterns(failedSuites);

    // Correlações entre falhas
    section += this.generateFailureCorrelations(failedSuites);

    return section;
  }

  /**
   * Gera métricas de performance
   */
  private generatePerformanceMetrics(metrics: TestMetrics): string {
    let section = `## ⚡ Análise de Performance

### Métricas Gerais

| Métrica | Valor |
|---------|-------|
| **Tempo Médio por Teste** | ${metrics.performance.averageTestDuration.toFixed(
      2
    )}ms |
| **Tempo Mediano por Teste** | ${metrics.performance.medianTestDuration.toFixed(
      2
    )}ms |
| **Tempo Total de Execução** | ${this.formatDuration(
      metrics.performance.totalExecutionTime
    )} |
| **Tempo de Setup** | ${this.formatDuration(metrics.performance.setupTime)} |
| **Tempo de Teardown** | ${this.formatDuration(
      metrics.performance.teardownTime
    )} |

`;

    // Análise de recursos
    section += `### Uso de Recursos

| Recurso | Pico | Média | Inicial | Final |
|---------|------|-------|---------|-------|
| **Memória** | ${this.formatBytes(
      metrics.resources.memoryUsage.peak
    )} | ${this.formatBytes(
      metrics.resources.memoryUsage.average
    )} | ${this.formatBytes(
      metrics.resources.memoryUsage.initial
    )} | ${this.formatBytes(metrics.resources.memoryUsage.final)} |
| **CPU** | ${metrics.resources.cpuUsage.peak.toFixed(
      1
    )}% | ${metrics.resources.cpuUsage.average.toFixed(1)}% | - | - |

`;

    // Testes mais lentos
    if (metrics.performance.slowestTests.length > 0) {
      section += `### 🐌 Testes Mais Lentos

| Teste | Duração | Status |
|-------|---------|--------|
`;

      for (const test of metrics.performance.slowestTests.slice(0, 10)) {
        const statusIcon = this.getStatusIcon(test.status);
        section += `| ${test.name} | ${this.formatDuration(
          test.duration
        )} | ${statusIcon} ${test.status} |\n`;
      }
      section += "\n";
    }

    // Testes mais rápidos
    if (metrics.performance.fastestTests.length > 0) {
      section += `### ⚡ Testes Mais Rápidos

| Teste | Duração | Status |
|-------|---------|--------|
`;

      for (const test of metrics.performance.fastestTests.slice(0, 5)) {
        const statusIcon = this.getStatusIcon(test.status);
        section += `| ${test.name} | ${this.formatDuration(
          test.duration
        )} | ${statusIcon} ${test.status} |\n`;
      }
      section += "\n";
    }

    // Alertas de performance
    section += this.generatePerformanceAlerts(metrics);

    return section;
  }

  /**
   * Gera recomendações baseadas nos resultados
   */
  private generateRecommendations(results: TestExecutionResult): string {
    let section = `## 💡 Recomendações

`;

    const { summary, metrics } = results;
    const recommendations: string[] = [];

    // Recomendações baseadas em falhas críticas
    if (summary.criticalFailures > 0) {
      section += `### ⚠️ Ações Imediatas

`;
      recommendations.push(
        `🚨 **CRÍTICO:** ${summary.criticalFailures} falha(s) crítica(s) detectada(s). Não faça deploy até resolver.`
      );
      recommendations.push(
        `🔍 Investigue imediatamente os conjuntos críticos que falharam.`
      );
      recommendations.push(
        `📋 Execute os testes críticos individualmente para diagnóstico detalhado.`
      );
    }

    // Recomendações baseadas em performance
    if (metrics.performance.averageTestDuration > 1000) {
      section += `### 🚀 Melhorias de Performance

`;
      recommendations.push(
        `⏱️ Tempo médio de teste (${metrics.performance.averageTestDuration.toFixed(
          2
        )}ms) está alto. Considere otimizações.`
      );
      recommendations.push(
        `🔍 Analise os ${Math.min(
          5,
          metrics.performance.slowestTests.length
        )} testes mais lentos para possíveis otimizações.`
      );
    }

    // Recomendações baseadas em taxa de sucesso
    const successRate = this.calculateSuccessRate(
      summary.passedTests,
      summary.totalTests
    );
    if (successRate < 95) {
      section += `### 🎯 Melhoria da Qualidade

`;
      recommendations.push(
        `📊 Taxa de sucesso (${successRate}%) está abaixo do ideal (95%+).`
      );
      recommendations.push(
        `🔧 Foque na estabilização dos ${summary.failedTests} testes que falharam.`
      );
    }

    // Recomendações gerais
    section += `### 📈 Próximos Passos

`;
    recommendations.push(
      `📊 Configure execução regular destes testes em CI/CD.`
    );
    recommendations.push(
      `📈 Implemente coleta de métricas históricas para análise de tendências.`
    );
    recommendations.push(
      `🔔 Configure alertas automáticos para falhas críticas.`
    );
    recommendations.push(
      `📚 Documente os padrões de falha identificados para referência futura.`
    );

    // Renderizar todas as recomendações
    for (const recommendation of recommendations) {
      section += `- ${recommendation}\n`;
    }

    section += "\n";

    return section;
  }

  /**
   * Gera apêndices com dados técnicos
   */
  private generateAppendices(results: TestExecutionResult): string {
    let section = `## 📎 Apêndices

### A. Configuração de Testes

\`\`\`json
${JSON.stringify(results.configUsed, null, 2)}
\`\`\`

### B. Dados Brutos (JSON)

<details>
<summary>📊 Clique para expandir dados completos</summary>

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`

</details>

`;

    return section;
  }

  /**
   * Gera rodapé do relatório
   */
  private generateReportFooter(results: TestExecutionResult): string {
    const timestamp = this.formatTimestamp(new Date());

    return `---

**Relatório gerado em:** ${timestamp}
**Ferramenta:** Sistema de Testes Abrangentes v1.0
**Formato:** Markdown

> 💡 **Dica:** Este relatório pode ser visualizado melhor em um visualizador de Markdown que suporte tabelas e detalhes expansíveis.

`;
  }

  // Métodos utilitários para formatação

  private getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      passed: "✅",
      failed: "❌",
      skipped: "⏭️",
      timeout: "⏰",
      partial: "⚠️",
    };
    return icons[status] || "❓";
  }

  private getSeverityIcon(severity: string): string {
    const icons: { [key: string]: string } = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    };
    return icons[severity] || "⚪";
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private formatValue(value: any): string {
    if (typeof value === "string") {
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    }
    return JSON.stringify(value);
  }

  private calculateSuccessRate(passed: number, total: number): number {
    return total === 0 ? 0 : Math.round((passed / total) * 100);
  }

  private getQualityIndicator(successRate: number): string {
    if (successRate >= 95) return "🟢 Excelente";
    if (successRate >= 85) return "🟡 Bom";
    if (successRate >= 70) return "🟠 Regular";
    return "🔴 Crítico";
  }

  private groupErrorsByCategory(failedSuites: TestSuiteResult[]): {
    [key: string]: TestError[];
  } {
    const errorsByCategory: { [key: string]: TestError[] } = {};

    for (const suite of failedSuites) {
      for (const error of suite.errors) {
        if (!errorsByCategory[error.category]) {
          errorsByCategory[error.category] = [];
        }
        errorsByCategory[error.category].push(error);
      }
    }

    return errorsByCategory;
  }

  private calculateAverageSeverity(errors: TestError[]): string {
    const severityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalWeight = errors.reduce(
      (sum, error) => sum + severityWeights[error.severity],
      0
    );
    const avgWeight = totalWeight / errors.length;

    if (avgWeight >= 3.5) return "Critical";
    if (avgWeight >= 2.5) return "High";
    if (avgWeight >= 1.5) return "Medium";
    return "Low";
  }

  private calculateErrorFrequency(
    failedSuites: TestSuiteResult[]
  ): Array<{ message: string; count: number; suites: string[] }> {
    const errorFreq: { [key: string]: { count: number; suites: Set<string> } } =
      {};

    for (const suite of failedSuites) {
      for (const error of suite.errors) {
        const key = error.message.substring(0, 100); // Truncar para agrupar mensagens similares
        if (!errorFreq[key]) {
          errorFreq[key] = { count: 0, suites: new Set() };
        }
        errorFreq[key].count++;
        errorFreq[key].suites.add(suite.name);
      }
    }

    return Object.entries(errorFreq)
      .map(([message, data]) => ({
        message,
        count: data.count,
        suites: Array.from(data.suites),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private generateFailurePatterns(failedSuites: TestSuiteResult[]): string {
    let section = `### Padrões de Falha

`;

    // Analisar padrões temporais
    const timePatterns = this.analyzeTimePatterns(failedSuites);
    if (timePatterns.length > 0) {
      section += `**Padrões Temporais:**
`;
      for (const pattern of timePatterns) {
        section += `- ${pattern}\n`;
      }
      section += "\n";
    }

    // Analisar padrões de categoria
    const categoryPatterns = this.analyzeCategoryPatterns(failedSuites);
    if (categoryPatterns.length > 0) {
      section += `**Padrões por Categoria:**
`;
      for (const pattern of categoryPatterns) {
        section += `- ${pattern}\n`;
      }
      section += "\n";
    }

    return section;
  }

  private analyzeTimePatterns(failedSuites: TestSuiteResult[]): string[] {
    const patterns: string[] = [];

    // Verificar se há concentração de falhas em testes longos
    const longTests = failedSuites.filter((s) => s.duration > 10000);
    if (longTests.length > failedSuites.length * 0.5) {
      patterns.push(
        `${longTests.length} de ${failedSuites.length} falhas ocorreram em testes longos (>10s)`
      );
    }

    return patterns;
  }

  private analyzeCategoryPatterns(failedSuites: TestSuiteResult[]): string[] {
    const patterns: string[] = [];

    // Agrupar por categoria
    const byCategory: { [key: string]: number } = {};
    for (const suite of failedSuites) {
      byCategory[suite.category] = (byCategory[suite.category] || 0) + 1;
    }

    // Identificar categorias com mais falhas
    const sortedCategories = Object.entries(byCategory).sort(
      (a, b) => b[1] - a[1]
    );
    if (sortedCategories.length > 0 && sortedCategories[0][1] > 1) {
      patterns.push(
        `Categoria "${sortedCategories[0][0]}" tem ${
          sortedCategories[0][1]
        } falhas (${Math.round(
          (sortedCategories[0][1] / failedSuites.length) * 100
        )}% do total)`
      );
    }

    return patterns;
  }

  private generatePerformanceAlerts(metrics: TestMetrics): string {
    let section = `### 🚨 Alertas de Performance

`;

    const alerts: string[] = [];

    // Alertas de tempo
    if (metrics.performance.averageTestDuration > 2000) {
      alerts.push(
        `⏱️ Tempo médio de teste muito alto (${metrics.performance.averageTestDuration.toFixed(
          2
        )}ms)`
      );
    }

    // Alertas de memória
    const memoryGrowth =
      metrics.resources.memoryUsage.final -
      metrics.resources.memoryUsage.initial;
    if (memoryGrowth > 100 * 1024 * 1024) {
      // 100MB
      alerts.push(
        `🧠 Possível vazamento de memória detectado (+${this.formatBytes(
          memoryGrowth
        )})`
      );
    }

    // Alertas de CPU
    if (metrics.resources.cpuUsage.peak > 90) {
      alerts.push(
        `💻 Uso de CPU muito alto (${metrics.resources.cpuUsage.peak.toFixed(
          1
        )}%)`
      );
    }

    if (alerts.length === 0) {
      section += `✅ Nenhum alerta de performance detectado.\n\n`;
    } else {
      for (const alert of alerts) {
        section += `- ${alert}\n`;
      }
      section += "\n";
    }

    return section;
  }

  /**
   * Gera análise de impacto das falhas
   */
  private generateImpactAnalysis(failedSuites: TestSuiteResult[]): string {
    let section = `### 📊 Análise de Impacto

`;

    const criticalFailures = failedSuites.filter((s) => s.critical);
    const totalFailedTests = failedSuites.reduce(
      (sum, s) => sum + s.tests.filter((t) => t.status === "failed").length,
      0
    );
    const avgFailureDuration =
      failedSuites.reduce((sum, s) => sum + s.duration, 0) /
      failedSuites.length;

    section += `| Métrica de Impacto | Valor | Descrição |
|-------------------|-------|-----------|
| **Falhas Críticas** | ${
      criticalFailures.length
    } | Conjuntos que bloqueiam deploy |
| **Testes Afetados** | ${totalFailedTests} | Total de testes individuais com falha |
| **Tempo Perdido** | ${this.formatDuration(
      avgFailureDuration * failedSuites.length
    )} | Tempo gasto em testes que falharam |
| **Taxa de Falha** | ${Math.round(
      (failedSuites.length / (failedSuites.length + 1)) * 100
    )}% | Percentual de conjuntos com falha |

`;

    // Impacto por categoria
    const impactByCategory = this.calculateImpactByCategory(failedSuites);
    if (Object.keys(impactByCategory).length > 0) {
      section += `**Impacto por Categoria:**
`;
      for (const [category, impact] of Object.entries(impactByCategory)) {
        section += `- **${category}**: ${impact.suites} conjuntos, ${
          impact.tests
        } testes, ${this.formatDuration(impact.duration)} tempo\n`;
      }
      section += "\n";
    }

    return section;
  }

  /**
   * Gera análise de correlações entre falhas
   */
  private generateFailureCorrelations(failedSuites: TestSuiteResult[]): string {
    let section = `### 🔗 Correlações entre Falhas

`;

    // Correlação temporal
    const timeCorrelations = this.analyzeTimeCorrelations(failedSuites);
    if (timeCorrelations.length > 0) {
      section += `**Correlações Temporais:**
`;
      for (const correlation of timeCorrelations) {
        section += `- ${correlation}\n`;
      }
      section += "\n";
    }

    // Correlação por tipo de erro
    const errorCorrelations = this.analyzeErrorCorrelations(failedSuites);
    if (errorCorrelations.length > 0) {
      section += `**Correlações por Tipo de Erro:**
`;
      for (const correlation of errorCorrelations) {
        section += `- ${correlation}\n`;
      }
      section += "\n";
    }

    // Dependências entre conjuntos
    const dependencyCorrelations =
      this.analyzeDependencyCorrelations(failedSuites);
    if (dependencyCorrelations.length > 0) {
      section += `**Possíveis Dependências:**
`;
      for (const correlation of dependencyCorrelations) {
        section += `- ${correlation}\n`;
      }
      section += "\n";
    }

    return section;
  }

  /**
   * Calcula impacto por categoria
   */
  private calculateImpactByCategory(failedSuites: TestSuiteResult[]): {
    [key: string]: { suites: number; tests: number; duration: number };
  } {
    const impact: {
      [key: string]: { suites: number; tests: number; duration: number };
    } = {};

    for (const suite of failedSuites) {
      if (!impact[suite.category]) {
        impact[suite.category] = { suites: 0, tests: 0, duration: 0 };
      }

      impact[suite.category].suites++;
      impact[suite.category].tests += suite.tests.filter(
        (t) => t.status === "failed"
      ).length;
      impact[suite.category].duration += suite.duration;
    }

    return impact;
  }

  /**
   * Analisa correlações temporais
   */
  private analyzeTimeCorrelations(failedSuites: TestSuiteResult[]): string[] {
    const correlations: string[] = [];

    // Verificar se falhas ocorreram em sequência
    const sortedSuites = failedSuites.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    for (let i = 0; i < sortedSuites.length - 1; i++) {
      const current = sortedSuites[i];
      const next = sortedSuites[i + 1];
      const timeDiff = next.startTime.getTime() - current.endTime.getTime();

      if (timeDiff < 5000) {
        // Menos de 5 segundos entre falhas
        correlations.push(
          `${current.name} e ${
            next.name
          } falharam em sequência (${this.formatDuration(
            timeDiff
          )} de diferença)`
        );
      }
    }

    return correlations;
  }

  /**
   * Analisa correlações por tipo de erro
   */
  private analyzeErrorCorrelations(failedSuites: TestSuiteResult[]): string[] {
    const correlations: string[] = [];
    const errorsByType: { [key: string]: string[] } = {};

    // Agrupar conjuntos por tipo de erro
    for (const suite of failedSuites) {
      for (const error of suite.errors) {
        if (!errorsByType[error.category]) {
          errorsByType[error.category] = [];
        }
        errorsByType[error.category].push(suite.name);
      }
    }

    // Identificar tipos de erro que afetam múltiplos conjuntos
    for (const [errorType, suites] of Object.entries(errorsByType)) {
      if (suites.length > 1) {
        correlations.push(
          `Erro tipo "${errorType}" afeta ${
            suites.length
          } conjuntos: ${suites.join(", ")}`
        );
      }
    }

    return correlations;
  }

  /**
   * Analisa correlações de dependência
   */
  private analyzeDependencyCorrelations(
    failedSuites: TestSuiteResult[]
  ): string[] {
    const correlations: string[] = [];

    // Verificar padrões de dependência baseados em categoria
    const integrationFailures = failedSuites.filter(
      (s) => s.category === "integration"
    );
    const performanceFailures = failedSuites.filter(
      (s) => s.category === "performance"
    );

    if (integrationFailures.length > 0 && performanceFailures.length > 0) {
      correlations.push(
        `Falhas de integração podem estar impactando testes de performance`
      );
    }

    // Verificar se conjuntos críticos falharam junto com não-críticos
    const criticalFailures = failedSuites.filter((s) => s.critical);
    const nonCriticalFailures = failedSuites.filter((s) => !s.critical);

    if (criticalFailures.length > 0 && nonCriticalFailures.length > 0) {
      correlations.push(
        `Falhas críticas podem ter causado falhas em cascata em ${nonCriticalFailures.length} conjuntos não-críticos`
      );
    }

    return correlations;
  }

  /**
   * Gera gráfico ASCII/Unicode para distribuição de dados
   */
  private generateAsciiChart(
    data: { label: string; value: number }[],
    title: string
  ): string {
    if (data.length === 0) return "";

    const maxValue = Math.max(...data.map((d) => d.value));
    const maxBarLength = 40;

    let chart = `**${title}**\n\n\`\`\`\n`;

    for (const item of data) {
      const barLength = Math.round((item.value / maxValue) * maxBarLength);
      const bar = "█".repeat(barLength) + "░".repeat(maxBarLength - barLength);
      const percentage =
        maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;

      chart += `${item.label.padEnd(20)} │${bar}│ ${
        item.value
      } (${percentage}%)\n`;
    }

    chart += "```\n\n";
    return chart;
  }

  /**
   * Gera gráfico de tendência ASCII
   */
  private generateTrendChart(values: number[], title: string): string {
    if (values.length < 2) return "";

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    const height = 10;

    let chart = `**${title}**\n\n\`\`\`\n`;

    // Normalizar valores para altura do gráfico
    const normalizedValues = values.map((v) =>
      range > 0 ? Math.round(((v - minValue) / range) * height) : height / 2
    );

    // Desenhar gráfico linha por linha (de cima para baixo)
    for (let row = height; row >= 0; row--) {
      let line = "";
      for (let col = 0; col < normalizedValues.length; col++) {
        if (normalizedValues[col] >= row) {
          line += "██";
        } else if (normalizedValues[col] === row - 1) {
          line += "▄▄";
        } else {
          line += "  ";
        }
      }
      chart += line + "\n";
    }

    // Adicionar eixo X
    chart += "─".repeat(values.length * 2) + "\n";

    // Adicionar valores
    let valueRow = "";
    for (let i = 0; i < values.length; i++) {
      valueRow += values[i].toString().padEnd(2);
    }
    chart += valueRow + "\n";

    chart += "```\n\n";
    return chart;
  }

  /**
   * Formata diff de código com syntax highlighting
   */
  private formatCodeDiff(
    diff: string,
    language: string = "javascript"
  ): string {
    if (!diff) return "";

    const lines = diff.split("\n");
    let formattedDiff = `\`\`\`diff\n`;

    for (const line of lines) {
      if (line.startsWith("+")) {
        formattedDiff += `+ ${line.substring(1)}\n`;
      } else if (line.startsWith("-")) {
        formattedDiff += `- ${line.substring(1)}\n`;
      } else {
        formattedDiff += `  ${line}\n`;
      }
    }

    formattedDiff += `\`\`\`\n\n`;
    return formattedDiff;
  }

  /**
   * Formata código com syntax highlighting
   */
  private formatCodeBlock(
    code: string,
    language: string = "javascript"
  ): string {
    return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  }

  /**
   * Gera links internos para navegação no relatório
   */
  private generateTableOfContents(results: TestExecutionResult): string {
    let toc = `## 📑 Índice

`;

    // Links principais
    toc += `- [📋 Resumo Executivo](#-resumo-executivo)\n`;

    if (this.config.includeEnvironmentInfo) {
      toc += `- [🖥️ Ambiente de Execução](#️-ambiente-de-execução)\n`;
    }

    toc += `- [🧪 Resultados por Conjunto de Testes](#-resultados-por-conjunto-de-testes)\n`;

    if (results.summary.failedTests > 0) {
      toc += `- [🔍 Análise de Falhas](#-análise-de-falhas)\n`;
    }

    if (this.config.includeMetrics) {
      toc += `- [⚡ Análise de Performance](#-análise-de-performance)\n`;
    }

    if (this.config.includeSuggestions) {
      toc += `- [💡 Recomendações](#-recomendações)\n`;
    }

    // Links para conjuntos específicos
    if (results.suiteResults.length > 0) {
      toc += `\n**Conjuntos de Testes:**\n`;
      for (const suite of results.suiteResults) {
        const anchor = suite.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const statusIcon = this.getStatusIcon(suite.status);
        toc += `- [${statusIcon} ${suite.name}](#${anchor})\n`;
      }
    }

    toc += "\n---\n\n";
    return toc;
  }

  /**
   * Gera âncoras para seções
   */
  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /**
   * Gera gráfico de pizza ASCII para distribuição
   */
  private generatePieChart(
    data: { label: string; value: number; color?: string }[],
    title: string
  ): string {
    if (data.length === 0) return "";

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return "";

    let chart = `**${title}**\n\n`;

    // Símbolos para diferentes fatias
    const symbols = ["█", "▓", "▒", "░", "▄", "▀", "■", "□"];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const percentage = Math.round((item.value / total) * 100);
      const symbol = symbols[i % symbols.length];

      chart += `${symbol} ${item.label}: ${item.value} (${percentage}%)\n`;
    }

    // Representação visual simples
    chart += "\n";
    let visualLine = "";
    let currentPos = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const segmentSize = Math.round((item.value / total) * 50); // 50 caracteres total
      const symbol = symbols[i % symbols.length];

      visualLine += symbol.repeat(segmentSize);
      currentPos += segmentSize;
    }

    chart += `\`${visualLine}\`\n\n`;
    return chart;
  }

  /**
   * Gera indicadores visuais de progresso
   */
  private generateProgressBar(
    current: number,
    total: number,
    width: number = 30
  ): string {
    if (total === 0) return "░".repeat(width);

    const progress = Math.round((current / total) * width);
    const filled = "█".repeat(progress);
    const empty = "░".repeat(width - progress);
    const percentage = Math.round((current / total) * 100);

    return `${filled}${empty} ${percentage}%`;
  }

  /**
   * Adiciona formatação avançada ao resumo executivo
   */
  private enhanceExecutiveSummaryWithCharts(
    results: TestExecutionResult
  ): string {
    let enhanced = "";

    // Gráfico de distribuição de status dos conjuntos
    const suiteStatusData = [
      { label: "Aprovados", value: results.summary.passedSuites },
      { label: "Falharam", value: results.summary.failedSuites },
      { label: "Ignorados", value: results.summary.skippedSuites },
    ].filter((item) => item.value > 0);

    if (suiteStatusData.length > 0) {
      enhanced += this.generatePieChart(
        suiteStatusData,
        "Distribuição de Status dos Conjuntos"
      );
    }

    // Gráfico de distribuição por categoria
    const categoryData: { [key: string]: number } = {};
    for (const suite of results.suiteResults) {
      categoryData[suite.category] = (categoryData[suite.category] || 0) + 1;
    }

    const categoryChartData = Object.entries(categoryData).map(
      ([label, value]) => ({ label, value })
    );
    if (categoryChartData.length > 0) {
      enhanced += this.generateAsciiChart(
        categoryChartData,
        "Distribuição por Categoria"
      );
    }

    return enhanced;
  }

  /**
   * Adiciona formatação avançada às métricas de performance
   */
  private enhancePerformanceMetricsWithCharts(metrics: TestMetrics): string {
    let enhanced = "";

    // Gráfico de tendência de duração dos testes mais lentos
    if (metrics.performance.slowestTests.length > 0) {
      const durations = metrics.performance.slowestTests
        .slice(0, 10)
        .map((t) => t.duration);
      enhanced += this.generateTrendChart(
        durations,
        "Tendência de Duração - Testes Mais Lentos"
      );
    }

    // Gráfico de uso de recursos
    const resourceData = [
      { label: "CPU Pico", value: metrics.resources.cpuUsage.peak },
      { label: "CPU Médio", value: metrics.resources.cpuUsage.average },
    ];

    enhanced += this.generateAsciiChart(resourceData, "Uso de CPU (%)");

    return enhanced;
  }
}
