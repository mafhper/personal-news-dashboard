/**
 * ErrorAnalyzer.ts
 *
 * Sistema avançado de análise de falhas de testes
 * Classifica erros automaticamente, extrai contexto detalhado e fornece sugestões de correção
 */

import {
  TestError,
  ErrorCategory,
  ErrorAnalysis,
  TestCaseResult,
  TestSuiteResult,
} from "./types/testOrchestrator";

export interface ErrorPattern {
  pattern: RegExp;
  category: ErrorCategory;
  severity: "critical" | "high" | "medium" | "low";
  keywords: string[];
  suggestions: string[];
  quickFixes: string[];
  documentationLinks: string[];
}

export interface ErrorContext {
  testName: string;
  suiteName: string;
  filePath: string;
  category: string;
  duration: number;
  retryCount: number;
  relatedErrors: TestError[];
}

export interface StackTraceInfo {
  file: string;
  line: number;
  column?: number;
  function?: string;
  source?: string;
  isUserCode: boolean;
}

export class ErrorAnalyzer {
  private errorPatterns: ErrorPattern[] = [];
  private knowledgeBase: Map<string, ErrorAnalysis> = new Map();

  constructor() {
    this.initializeErrorPatterns();
    this.initializeKnowledgeBase();
  }

  /**
   * Analisa um erro individual e retorna análise detalhada
   */
  analyzeError(error: TestError, context: ErrorContext): ErrorAnalysis {
    // Classificar o erro
    const category = this.classifyError(error.message, error.stack);

    // Determinar severidade
    const severity = this.determineSeverity(error, context, category);

    // Extrair informações do stack trace
    const stackInfo = this.parseStackTrace(error.stack || "");

    // Gerar sugestões
    const suggestions = this.generateSuggestions(
      error,
      context,
      stackInfo,
      category
    );

    // Encontrar testes relacionados
    const relatedTests = this.findRelatedTests(error, context, category);

    // Identificar possíveis causas
    const possibleCauses = this.identifyPossibleCauses(
      error,
      context,
      category
    );

    // Gerar quick fixes
    const quickFixes = this.generateQuickFixes(error, context, category);

    // Links de documentação
    const documentationLinks = this.getDocumentationLinks(
      category,
      error.message
    );

    return {
      category,
      severity,
      impact: this.calculateImpact(error, context),
      suggestions,
      relatedTests,
      possibleCauses,
      quickFixes,
      documentationLinks,
    };
  }

  /**
   * Analisa múltiplos erros e agrupa por similaridade
   */
  analyzeErrorGroup(
    errors: TestError[],
    contexts: ErrorContext[]
  ): {
    groups: ErrorGroup[];
    summary: ErrorGroupSummary;
  } {
    const groups = this.groupSimilarErrors(errors, contexts);
    const summary = this.generateErrorGroupSummary(groups);

    return { groups, summary };
  }

  /**
   * Classifica automaticamente o tipo de erro
   */
  private classifyError(message: string, stack?: string): ErrorCategory {
    const fullText = `${message} ${stack || ""}`.toLowerCase();

    // Verificar padrões específicos primeiro
    for (const pattern of this.errorPatterns) {
      if (
        pattern.pattern.test(fullText) ||
        pattern.keywords.some((keyword) =>
          fullText.includes(keyword.toLowerCase())
        )
      ) {
        return pattern.category;
      }
    }

    // Classificação baseada em palavras-chave (ordem importa - mais específico primeiro)

    // Mock failures - verificar primeiro para evitar conflitos com "expect"
    if (
      this.containsKeywords(fullText, [
        "jest.fn",
        "mock was called",
        "spy",
        "stub",
      ]) ||
      (fullText.includes("mock") && fullText.includes("called"))
    ) {
      return ErrorCategory.MOCK_FAILURE;
    }

    if (this.containsKeywords(fullText, ["timeout", "timed out", "exceeded"])) {
      return ErrorCategory.TIMEOUT;
    }

    if (
      this.containsKeywords(fullText, [
        "network",
        "fetch",
        "request",
        "connection",
        "cors",
      ])
    ) {
      return ErrorCategory.NETWORK_ERROR;
    }

    if (
      this.containsKeywords(fullText, [
        "expect",
        "assertion",
        "tobe",
        "toequal",
        "tomatch",
      ])
    ) {
      return ErrorCategory.ASSERTION_FAILURE;
    }

    if (
      this.containsKeywords(fullText, [
        "config",
        "configuration",
        "environment",
        "env",
      ])
    ) {
      return ErrorCategory.CONFIGURATION_ERROR;
    }

    if (
      this.containsKeywords(fullText, ["performance", "memory", "cpu", "slow"])
    ) {
      return ErrorCategory.PERFORMANCE_DEGRADATION;
    }

    if (
      this.containsKeywords(fullText, [
        "integration",
        "service",
        "api",
        "endpoint",
      ])
    ) {
      return ErrorCategory.INTEGRATION_FAILURE;
    }

    if (
      this.containsKeywords(fullText, [
        "dependency",
        "module",
        "import",
        "require",
      ])
    ) {
      return ErrorCategory.DEPENDENCY_ERROR;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determina a severidade do erro baseado no contexto
   */
  private determineSeverity(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): "critical" | "high" | "medium" | "low" {
    // Erros de configuração são sempre críticos
    if (category === ErrorCategory.CONFIGURATION_ERROR) {
      return "critical";
    }

    // Erros que causaram múltiplas tentativas
    if (context.retryCount > 1) {
      return "high";
    }

    // Erros em testes críticos são sempre de alta severidade
    if (
      context.category === "integration" &&
      context.suiteName.includes("critical")
    ) {
      return "critical";
    }

    // Padrão baseado na categoria
    const severityMap: Record<
      ErrorCategory,
      "critical" | "high" | "medium" | "low"
    > = {
      [ErrorCategory.CONFIGURATION_ERROR]: "critical",
      [ErrorCategory.DEPENDENCY_ERROR]: "high",
      [ErrorCategory.INTEGRATION_FAILURE]: "high",
      [ErrorCategory.ASSERTION_FAILURE]: "medium",
      [ErrorCategory.MOCK_FAILURE]: "medium",
      [ErrorCategory.TIMEOUT]: "medium",
      [ErrorCategory.NETWORK_ERROR]: "medium",
      [ErrorCategory.PERFORMANCE_DEGRADATION]: "low",
      [ErrorCategory.UNKNOWN]: "low",
    };

    return severityMap[category] || "low";
  }

  /**
   * Faz parsing detalhado do stack trace
   */
  private parseStackTrace(stack: string): StackTraceInfo[] {
    if (!stack) return [];

    const lines = stack.split("\n").filter((line) => line.trim());
    const stackInfo: StackTraceInfo[] = [];

    for (const line of lines) {
      // Padrão comum: "at functionName (file:line:column)"
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        const [, functionName, file, lineStr, columnStr] = match;
        const lineNum = parseInt(lineStr, 10);
        const column = parseInt(columnStr, 10);

        stackInfo.push({
          file: file.replace(process.cwd(), "."),
          line: lineNum,
          column,
          function: functionName,
          isUserCode:
            !file.includes("node_modules") &&
            !file.includes("vitest") &&
            !file.includes("node:internal"),
        });
      } else {
        // Padrão alternativo: "at file:line:column"
        const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
        if (simpleMatch) {
          const [, file, lineStr, columnStr] = simpleMatch;
          stackInfo.push({
            file: file.replace(process.cwd(), "."),
            line: parseInt(lineStr, 10),
            column: parseInt(columnStr, 10),
            isUserCode: !file.includes("node_modules"),
          });
        }
      }
    }

    return stackInfo;
  }

  /**
   * Gera sugestões contextuais baseadas no erro e contexto
   */
  private generateSuggestions(
    error: TestError,
    context: ErrorContext,
    stackInfo: StackTraceInfo[],
    category: ErrorCategory
  ): string[] {
    const suggestions: string[] = [];

    // Sugestões baseadas na categoria do erro
    const categorySuggestions = this.getCategorySuggestions(category);
    suggestions.push(...categorySuggestions);

    // Sugestões baseadas no contexto do teste
    const contextSuggestions = this.getContextSuggestions(context);
    suggestions.push(...contextSuggestions);

    // Sugestões baseadas no stack trace
    const stackSuggestions = this.getStackTraceSuggestions(stackInfo);
    suggestions.push(...stackSuggestions);

    // Sugestões específicas da mensagem de erro
    const messageSuggestions = this.getMessageSpecificSuggestions(
      error.message
    );
    suggestions.push(...messageSuggestions);

    // Remover duplicatas e limitar a 5 sugestões mais relevantes
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Encontra testes relacionados que podem ter o mesmo problema
   */
  private findRelatedTests(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): string[] {
    const relatedTests: string[] = [];

    // Testes na mesma suite
    if (context.relatedErrors.length > 0) {
      relatedTests.push(`Outros testes em ${context.suiteName}`);
    }

    // Testes com erro similar
    if (category !== ErrorCategory.UNKNOWN) {
      relatedTests.push(`Testes com erros de ${category.replace("_", " ")}`);
    }

    // Testes no mesmo arquivo
    if (context.filePath) {
      relatedTests.push(`Testes em ${context.filePath}`);
    }

    return relatedTests.slice(0, 3);
  }

  /**
   * Identifica possíveis causas do erro
   */
  private identifyPossibleCauses(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): string[] {
    const causes: string[] = [];

    switch (category) {
      case ErrorCategory.TIMEOUT:
        causes.push("Operação assíncrona não finalizada");
        causes.push("Timeout configurado muito baixo");
        causes.push("Dependência externa lenta");
        break;

      case ErrorCategory.NETWORK_ERROR:
        causes.push("Conectividade de rede instável");
        causes.push("Serviço externo indisponível");
        causes.push("Configuração de proxy incorreta");
        break;

      case ErrorCategory.ASSERTION_FAILURE:
        causes.push("Dados de teste desatualizados");
        causes.push("Lógica de negócio alterada");
        causes.push("Estado do sistema inconsistente");
        break;

      case ErrorCategory.MOCK_FAILURE:
        causes.push("Mock não configurado corretamente");
        causes.push("Dependência real sendo chamada");
        causes.push("Estrutura de dados alterada");
        break;

      case ErrorCategory.CONFIGURATION_ERROR:
        causes.push("Variáveis de ambiente ausentes");
        causes.push("Arquivo de configuração inválido");
        causes.push("Dependências não instaladas");
        break;

      default:
        causes.push("Causa não identificada automaticamente");
    }

    return causes.slice(0, 3);
  }

  /**
   * Gera quick fixes automatizados
   */
  private generateQuickFixes(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): string[] {
    const fixes: string[] = [];

    switch (category) {
      case ErrorCategory.TIMEOUT:
        fixes.push(`Aumentar timeout para ${context.duration * 2}ms`);
        fixes.push("Adicionar await em operações assíncronas");
        break;

      case ErrorCategory.NETWORK_ERROR:
        fixes.push("Verificar configuração de rede");
        fixes.push("Adicionar retry automático");
        break;

      case ErrorCategory.ASSERTION_FAILURE:
        fixes.push("Atualizar valores esperados no teste");
        fixes.push("Verificar setup do teste");
        break;

      case ErrorCategory.MOCK_FAILURE:
        fixes.push("Reconfigurar mocks");
        fixes.push("Limpar mocks entre testes");
        break;

      case ErrorCategory.CONFIGURATION_ERROR:
        fixes.push("Verificar variáveis de ambiente");
        fixes.push("Reinstalar dependências");
        break;
    }

    return fixes.slice(0, 2);
  }

  /**
   * Obtém links de documentação relevantes
   */
  private getDocumentationLinks(
    category: ErrorCategory,
    message: string
  ): string[] {
    const links: string[] = [];

    // Links baseados na categoria
    const categoryLinks: Record<ErrorCategory, string[]> = {
      [ErrorCategory.TIMEOUT]: [
        "https://vitest.dev/config/#testtimeout",
        "https://vitest.dev/guide/debugging.html#timeouts",
      ],
      [ErrorCategory.NETWORK_ERROR]: [
        "https://vitest.dev/guide/mocking.html#requests",
        "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
      ],
      [ErrorCategory.ASSERTION_FAILURE]: [
        "https://vitest.dev/api/expect.html",
        "https://vitest.dev/guide/debugging.html",
      ],
      [ErrorCategory.MOCK_FAILURE]: [
        "https://vitest.dev/guide/mocking.html",
        "https://vitest.dev/api/vi.html#vi-mock",
      ],
      [ErrorCategory.CONFIGURATION_ERROR]: [
        "https://vitest.dev/config/",
        "https://vitest.dev/guide/environment.html",
      ],
      [ErrorCategory.INTEGRATION_FAILURE]: [
        "https://vitest.dev/guide/testing-types.html#integration-testing",
      ],
      [ErrorCategory.PERFORMANCE_DEGRADATION]: [
        "https://vitest.dev/guide/debugging.html#performance",
      ],
      [ErrorCategory.DEPENDENCY_ERROR]: [
        "https://vitest.dev/guide/troubleshooting.html",
      ],
      [ErrorCategory.UNKNOWN]: ["https://vitest.dev/guide/debugging.html"],
    };

    links.push(...(categoryLinks[category] || []));

    return links.slice(0, 2);
  }

  /**
   * Calcula o impacto do erro
   */
  private calculateImpact(error: TestError, context: ErrorContext): string {
    const impacts: string[] = [];

    if (context.category === "integration") {
      impacts.push("Pode afetar funcionalidade principal");
    }

    if (context.retryCount > 1) {
      impacts.push("Erro intermitente - pode causar instabilidade");
    }

    if (error.category === ErrorCategory.CONFIGURATION_ERROR) {
      impacts.push("Pode bloquear outros testes");
    }

    if (context.duration > 10000) {
      impacts.push("Impacta performance da suite de testes");
    }

    return impacts.join("; ") || "Impacto limitado ao teste específico";
  }

  /**
   * Agrupa erros similares
   */
  private groupSimilarErrors(
    errors: TestError[],
    contexts: ErrorContext[]
  ): ErrorGroup[] {
    const groups: Map<string, ErrorGroup> = new Map();

    errors.forEach((error, index) => {
      const context = contexts[index];
      const category = this.classifyError(error.message, error.stack);
      const groupKey = this.generateGroupKey(error, context, category);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          category,
          pattern: this.extractErrorPattern(error.message),
          errors: [],
          contexts: [],
          frequency: 0,
          severity: this.determineSeverity(error, context, category),
        });
      }

      const group = groups.get(groupKey)!;
      group.errors.push(error);
      group.contexts.push(context);
      group.frequency++;

      // Atualizar severidade para a mais alta do grupo
      if (
        this.compareSeverity(
          this.determineSeverity(error, context, category),
          group.severity
        ) > 0
      ) {
        group.severity = this.determineSeverity(error, context, category);
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.frequency - a.frequency
    );
  }

  /**
   * Gera resumo dos grupos de erro
   */
  private generateErrorGroupSummary(groups: ErrorGroup[]): ErrorGroupSummary {
    const totalErrors = groups.reduce((sum, group) => sum + group.frequency, 0);
    const categoryCounts: Record<string, number> = {};

    groups.forEach((group) => {
      categoryCounts[group.category] =
        (categoryCounts[group.category] || 0) + group.frequency;
    });

    const mostCommonCategory =
      Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "unknown";

    return {
      totalGroups: groups.length,
      totalErrors,
      mostCommonCategory: mostCommonCategory as ErrorCategory,
      severityDistribution: this.calculateSeverityDistribution(groups),
      recommendations: this.generateGroupRecommendations(groups),
    };
  }

  // Métodos auxiliares
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
  }

  private getCategorySuggestions(category: ErrorCategory): string[] {
    const suggestions: Record<ErrorCategory, string[]> = {
      [ErrorCategory.TIMEOUT]: [
        "Aumentar o timeout do teste",
        "Verificar operações assíncronas não aguardadas",
        "Otimizar operações lentas",
      ],
      [ErrorCategory.NETWORK_ERROR]: [
        "Verificar conectividade de rede",
        "Configurar mocks para requisições externas",
        "Implementar retry automático",
      ],
      [ErrorCategory.ASSERTION_FAILURE]: [
        "Verificar valores esperados vs recebidos",
        "Confirmar estado do sistema antes da asserção",
        "Atualizar dados de teste",
      ],
      [ErrorCategory.MOCK_FAILURE]: [
        "Reconfigurar mocks corretamente",
        "Limpar mocks entre testes",
        "Verificar estrutura de dados mockados",
      ],
      [ErrorCategory.CONFIGURATION_ERROR]: [
        "Verificar variáveis de ambiente",
        "Validar arquivos de configuração",
        "Confirmar dependências instaladas",
      ],
      [ErrorCategory.INTEGRATION_FAILURE]: [
        "Verificar serviços dependentes",
        "Confirmar configuração de integração",
        "Testar componentes isoladamente",
      ],
      [ErrorCategory.PERFORMANCE_DEGRADATION]: [
        "Otimizar código testado",
        "Revisar configuração de performance",
        "Implementar profiling",
      ],
      [ErrorCategory.DEPENDENCY_ERROR]: [
        "Reinstalar dependências",
        "Verificar versões compatíveis",
        "Limpar cache de módulos",
      ],
      [ErrorCategory.UNKNOWN]: [
        "Executar teste individualmente",
        "Verificar logs detalhados",
        "Consultar documentação",
      ],
    };

    return suggestions[category] || [];
  }

  private getContextSuggestions(context: ErrorContext): string[] {
    const suggestions: string[] = [];

    if (context.retryCount > 0) {
      suggestions.push("Erro intermitente - investigar condições de corrida");
    }

    if (context.duration > 30000) {
      suggestions.push("Teste muito lento - considerar otimização");
    }

    if (context.category === "integration") {
      suggestions.push("Verificar dependências externas");
    }

    return suggestions;
  }

  private getStackTraceSuggestions(stackInfo: StackTraceInfo[]): string[] {
    const suggestions: string[] = [];

    const userCodeFrames = stackInfo.filter((frame) => frame.isUserCode);
    if (userCodeFrames.length > 0) {
      const firstUserFrame = userCodeFrames[0];
      suggestions.push(
        `Verificar código em ${firstUserFrame.file}:${firstUserFrame.line}`
      );
    }

    return suggestions;
  }

  private getMessageSpecificSuggestions(message: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("cannot read property")) {
      suggestions.push("Verificar se objeto não é null/undefined");
    }

    if (
      lowerMessage.includes("expected") &&
      lowerMessage.includes("received")
    ) {
      suggestions.push("Comparar valores esperados com recebidos");
    }

    return suggestions;
  }

  private generateGroupKey(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): string {
    return `${category}_${this.extractErrorPattern(error.message)}_${
      context.category
    }`;
  }

  private extractErrorPattern(message: string): string {
    // Extrair padrão genérico da mensagem removendo valores específicos
    return message
      .replace(/\d+/g, "N")
      .replace(/"[^"]*"/g, '"STRING"')
      .replace(/'[^']*'/g, "'STRING'")
      .substring(0, 100);
  }

  private compareSeverity(a: string, b: string): number {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (
      (severityOrder[a as keyof typeof severityOrder] || 0) -
      (severityOrder[b as keyof typeof severityOrder] || 0)
    );
  }

  private calculateSeverityDistribution(
    groups: ErrorGroup[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    groups.forEach((group) => {
      distribution[group.severity] =
        (distribution[group.severity] || 0) + group.frequency;
    });

    return distribution;
  }

  private generateGroupRecommendations(groups: ErrorGroup[]): string[] {
    const recommendations: string[] = [];

    const criticalGroups = groups.filter((g) => g.severity === "critical");
    if (criticalGroups.length > 0) {
      recommendations.push(
        `Priorizar correção de ${criticalGroups.length} grupos críticos`
      );
    }

    const mostFrequentGroup = groups[0];
    if (mostFrequentGroup && mostFrequentGroup.frequency > 1) {
      recommendations.push(
        `Focar no padrão mais comum: ${mostFrequentGroup.category}`
      );
    }

    return recommendations;
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns = [
      {
        pattern: /timeout.*exceeded/i,
        category: ErrorCategory.TIMEOUT,
        severity: "medium",
        keywords: ["timeout", "exceeded", "timed out"],
        suggestions: ["Aumentar timeout", "Verificar operações assíncronas"],
        quickFixes: ["Aumentar timeout do teste"],
        documentationLinks: ["https://vitest.dev/config/#testtimeout"],
      },
      {
        pattern: /network.*error|fetch.*failed/i,
        category: ErrorCategory.NETWORK_ERROR,
        severity: "medium",
        keywords: ["network", "fetch", "request", "connection"],
        suggestions: ["Verificar conectividade", "Configurar mocks"],
        quickFixes: ["Adicionar mock para requisição"],
        documentationLinks: ["https://vitest.dev/guide/mocking.html"],
      },
      // Adicionar mais padrões conforme necessário
    ];
  }

  private initializeKnowledgeBase(): void {
    // Base de conhecimento pode ser expandida com soluções conhecidas
    this.knowledgeBase.set("timeout_common", {
      category: ErrorCategory.TIMEOUT,
      severity: "medium",
      impact: "Pode indicar operações lentas",
      suggestions: ["Aumentar timeout", "Otimizar código"],
      relatedTests: [],
      possibleCauses: ["Operação assíncrona lenta"],
      quickFixes: ["Aumentar timeout"],
      documentationLinks: ["https://vitest.dev/config/#testtimeout"],
    });
  }
}

// Interfaces auxiliares
export interface ErrorGroup {
  category: ErrorCategory;
  pattern: string;
  errors: TestError[];
  contexts: ErrorContext[];
  frequency: number;
  severity: "critical" | "high" | "medium" | "low";
}

export interface ErrorGroupSummary {
  totalGroups: number;
  totalErrors: number;
  mostCommonCategory: ErrorCategory;
  severityDistribution: Record<string, number>;
  recommendations: string[];
}
