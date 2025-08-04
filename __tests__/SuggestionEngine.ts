/**
 * SuggestionEngine.ts
 *
 * Sistema avançado de geração de sugestões de correção
 * Implementa base de conhecimento e matching de padrões para fornecer soluções contextuais
 */

import {
  TestError,
  ErrorCategory,
  ErrorAnalysis,
} from "./types/testOrchestrator";
import { ErrorContext } from "./ErrorAnalyzer";

export interface SuggestionPattern {
  pattern: RegExp;
  category: ErrorCategory;
  priority: number;
  suggestions: string[];
  quickFixes: string[];
  debuggingSteps: string[];
  preventionTips: string[];
}

export interface KnowledgeBaseEntry {
  errorSignature: string;
  category: ErrorCategory;
  commonCauses: string[];
  solutions: Solution[];
  relatedPatterns: string[];
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
}

export interface Solution {
  description: string;
  steps: string[];
  codeExample?: string;
  documentation?: string;
  confidence: number; // 0-1
}

export interface ContextualSuggestion {
  suggestion: string;
  reasoning: string;
  confidence: number;
  category: "immediate" | "investigation" | "prevention";
  estimatedEffort: "low" | "medium" | "high";
}

export class SuggestionEngine {
  private knowledgeBase: Map<string, KnowledgeBaseEntry> = new Map();
  private suggestionPatterns: SuggestionPattern[] = [];
  private contextualRules: Map<
    string,
    (context: ErrorContext) => ContextualSuggestion[]
  > = new Map();

  constructor() {
    this.initializeKnowledgeBase();
    this.initializeSuggestionPatterns();
    this.initializeContextualRules();
  }

  /**
   * Gera sugestões abrangentes para um erro específico
   */
  generateSuggestions(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): {
    immediate: ContextualSuggestion[];
    investigation: ContextualSuggestion[];
    prevention: ContextualSuggestion[];
    quickFixes: string[];
    debuggingSteps: string[];
  } {
    const allSuggestions = this.getAllSuggestions(error, context, category);

    return {
      immediate: allSuggestions.filter((s) => s.category === "immediate"),
      investigation: allSuggestions.filter(
        (s) => s.category === "investigation"
      ),
      prevention: allSuggestions.filter((s) => s.category === "prevention"),
      quickFixes: this.generateQuickFixes(error, context, category),
      debuggingSteps: this.generateDebuggingSteps(error, context, category),
    };
  }

  /**
   * Encontra soluções na base de conhecimento
   */
  findKnowledgeBaseSolutions(
    error: TestError,
    category: ErrorCategory
  ): KnowledgeBaseEntry[] {
    const solutions: KnowledgeBaseEntry[] = [];
    const errorSignature = this.generateErrorSignature(error);

    // Busca exata
    const exactMatch = this.knowledgeBase.get(errorSignature);
    if (exactMatch) {
      solutions.push(exactMatch);
    }

    // Busca por categoria
    for (const [signature, entry] of this.knowledgeBase.entries()) {
      if (entry.category === category && signature !== errorSignature) {
        solutions.push(entry);
      }
    }

    // Busca por padrões relacionados
    const relatedSolutions = this.findRelatedSolutions(error.message);
    solutions.push(...relatedSolutions);

    return solutions.slice(0, 3); // Limitar a 3 soluções mais relevantes
  }

  /**
   * Gera sugestões baseadas em padrões de erro
   */
  generatePatternBasedSuggestions(
    error: TestError,
    context: ErrorContext
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];
    const message = error.message.toLowerCase();

    for (const pattern of this.suggestionPatterns) {
      if (pattern.pattern.test(message)) {
        for (const suggestion of pattern.suggestions) {
          suggestions.push({
            suggestion,
            reasoning: `Padrão detectado: ${pattern.pattern.source}`,
            confidence: 0.8,
            category: "immediate",
            estimatedEffort: "medium",
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Gera sugestões contextuais baseadas no ambiente de teste
   */
  generateContextualSuggestions(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    // Sugestões baseadas no tipo de teste
    const testTypeSuggestions = this.getTestTypeSuggestions(context);
    suggestions.push(...testTypeSuggestions);

    // Sugestões baseadas na duração
    const durationSuggestions = this.getDurationBasedSuggestions(context);
    suggestions.push(...durationSuggestions);

    // Sugestões baseadas em tentativas
    const retrySuggestions = this.getRetryBasedSuggestions(context);
    suggestions.push(...retrySuggestions);

    // Sugestões baseadas na categoria do erro
    const categorySuggestions = this.getCategorySpecificSuggestions(
      category,
      context
    );
    suggestions.push(...categorySuggestions);

    return suggestions;
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
        fixes.push(
          `Aumentar timeout para ${Math.max(context.duration * 2, 10000)}ms`
        );
        fixes.push("Adicionar await antes de operações assíncronas");
        fixes.push("Verificar se há loops infinitos no código");
        break;

      case ErrorCategory.NETWORK_ERROR:
        fixes.push("Configurar mock para requisições de rede");
        fixes.push("Adicionar retry com backoff exponencial");
        fixes.push("Verificar configuração de proxy/firewall");
        break;

      case ErrorCategory.ASSERTION_FAILURE:
        if (error.expected && error.actual) {
          fixes.push(
            `Atualizar valor esperado de '${error.expected}' para '${error.actual}'`
          );
        }
        fixes.push("Verificar setup/teardown do teste");
        fixes.push("Adicionar logs para debug do estado");
        break;

      case ErrorCategory.MOCK_FAILURE:
        fixes.push("Limpar todos os mocks: vi.clearAllMocks()");
        fixes.push("Reconfigurar mock com estrutura correta");
        fixes.push("Verificar se mock está sendo chamado no contexto correto");
        break;

      case ErrorCategory.CONFIGURATION_ERROR:
        fixes.push("Verificar arquivo .env ou variáveis de ambiente");
        fixes.push("Validar configuração do vitest.config.ts");
        fixes.push("Reinstalar dependências: npm ci");
        break;

      case ErrorCategory.INTEGRATION_FAILURE:
        fixes.push("Verificar se serviços dependentes estão rodando");
        fixes.push("Validar configuração de endpoints");
        fixes.push("Testar componentes isoladamente primeiro");
        break;

      default:
        fixes.push("Executar teste individualmente para isolamento");
        fixes.push("Verificar logs detalhados do sistema");
    }

    return fixes.slice(0, 3);
  }

  /**
   * Gera passos de debugging estruturados
   */
  private generateDebuggingSteps(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): string[] {
    const steps: string[] = [];

    // Passos gerais
    steps.push("1. Reproduzir o erro executando apenas este teste");
    steps.push("2. Verificar logs completos e stack trace");

    // Passos específicos por categoria
    switch (category) {
      case ErrorCategory.TIMEOUT:
        steps.push("3. Adicionar logs para identificar onde o teste trava");
        steps.push("4. Verificar se há operações assíncronas sem await");
        steps.push("5. Monitorar uso de CPU/memória durante execução");
        break;

      case ErrorCategory.NETWORK_ERROR:
        steps.push("3. Verificar conectividade de rede");
        steps.push("4. Testar endpoints manualmente");
        steps.push("5. Verificar configuração de mocks de rede");
        break;

      case ErrorCategory.ASSERTION_FAILURE:
        steps.push("3. Comparar valores esperados vs recebidos");
        steps.push("4. Verificar estado do sistema antes da asserção");
        steps.push("5. Adicionar logs intermediários no teste");
        break;

      case ErrorCategory.MOCK_FAILURE:
        steps.push("3. Verificar configuração dos mocks");
        steps.push("4. Confirmar se mocks estão sendo chamados");
        steps.push("5. Validar estrutura de dados mockados");
        break;

      case ErrorCategory.CONFIGURATION_ERROR:
        steps.push("3. Verificar todas as variáveis de ambiente");
        steps.push("4. Validar arquivos de configuração");
        steps.push("5. Testar em ambiente limpo");
        break;
    }

    steps.push(`${steps.length + 1}. Consultar documentação relevante`);
    steps.push(
      `${steps.length + 1}. Buscar por issues similares no repositório`
    );

    return steps;
  }

  /**
   * Obtém todas as sugestões combinadas
   */
  private getAllSuggestions(
    error: TestError,
    context: ErrorContext,
    category: ErrorCategory
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    // Sugestões baseadas em padrões
    const patternSuggestions = this.generatePatternBasedSuggestions(
      error,
      context
    );
    suggestions.push(...patternSuggestions);

    // Sugestões contextuais
    const contextualSuggestions = this.generateContextualSuggestions(
      error,
      context,
      category
    );
    suggestions.push(...contextualSuggestions);

    // Sugestões da base de conhecimento
    const knowledgeBaseSolutions = this.findKnowledgeBaseSolutions(
      error,
      category
    );
    for (const solution of knowledgeBaseSolutions) {
      for (const sol of solution.solutions) {
        suggestions.push({
          suggestion: sol.description,
          reasoning: `Base de conhecimento: ${solution.errorSignature}`,
          confidence: sol.confidence,
          category: "investigation",
          estimatedEffort:
            solution.difficulty === "easy"
              ? "low"
              : solution.difficulty === "medium"
              ? "medium"
              : "high",
        });
      }
    }

    // Remover duplicatas e ordenar por confiança
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Limitar a 8 sugestões totais
  }

  // Métodos auxiliares
  private getTestTypeSuggestions(
    context: ErrorContext
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    if (context.category === "integration") {
      suggestions.push({
        suggestion:
          "Verificar se todos os serviços dependentes estão disponíveis",
        reasoning: "Teste de integração requer dependências externas",
        confidence: 0.9,
        category: "immediate",
        estimatedEffort: "medium",
      });
    }

    if (context.category === "performance") {
      suggestions.push({
        suggestion: "Executar profiling para identificar gargalos",
        reasoning:
          "Teste de performance indica possível problema de otimização",
        confidence: 0.8,
        category: "investigation",
        estimatedEffort: "high",
      });
    }

    return suggestions;
  }

  private getDurationBasedSuggestions(
    context: ErrorContext
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    if (context.duration > 30000) {
      suggestions.push({
        suggestion:
          "Otimizar operações lentas ou dividir teste em partes menores",
        reasoning: `Teste muito lento (${context.duration}ms)`,
        confidence: 0.7,
        category: "prevention",
        estimatedEffort: "high",
      });
    }

    return suggestions;
  }

  private getRetryBasedSuggestions(
    context: ErrorContext
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    if (context.retryCount > 0) {
      suggestions.push({
        suggestion: "Investigar condições de corrida ou dependências temporais",
        reasoning: `Teste falhou ${context.retryCount} vezes - indica instabilidade`,
        confidence: 0.9,
        category: "investigation",
        estimatedEffort: "high",
      });
    }

    return suggestions;
  }

  private getCategorySpecificSuggestions(
    category: ErrorCategory,
    context: ErrorContext
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    const categoryMap: Record<ErrorCategory, ContextualSuggestion[]> = {
      [ErrorCategory.TIMEOUT]: [
        {
          suggestion: "Implementar timeout progressivo para operações críticas",
          reasoning: "Timeouts podem indicar operações não otimizadas",
          confidence: 0.8,
          category: "prevention",
          estimatedEffort: "medium",
        },
      ],
      [ErrorCategory.NETWORK_ERROR]: [
        {
          suggestion: "Implementar circuit breaker para chamadas externas",
          reasoning: "Falhas de rede são comuns em ambientes distribuídos",
          confidence: 0.7,
          category: "prevention",
          estimatedEffort: "high",
        },
      ],
      [ErrorCategory.ASSERTION_FAILURE]: [
        {
          suggestion:
            "Implementar matchers customizados para validações complexas",
          reasoning: "Assertions complexas podem ser simplificadas",
          confidence: 0.6,
          category: "prevention",
          estimatedEffort: "medium",
        },
      ],
      [ErrorCategory.MOCK_FAILURE]: [
        {
          suggestion: "Criar factory de mocks para reutilização",
          reasoning: "Mocks complexos devem ser centralizados",
          confidence: 0.8,
          category: "prevention",
          estimatedEffort: "medium",
        },
      ],
      [ErrorCategory.CONFIGURATION_ERROR]: [
        {
          suggestion: "Implementar validação de configuração no startup",
          reasoning: "Configurações inválidas devem ser detectadas cedo",
          confidence: 0.9,
          category: "prevention",
          estimatedEffort: "low",
        },
      ],
      [ErrorCategory.INTEGRATION_FAILURE]: [
        {
          suggestion: "Implementar health checks para dependências",
          reasoning: "Integrações devem ser monitoradas continuamente",
          confidence: 0.8,
          category: "prevention",
          estimatedEffort: "high",
        },
      ],
      [ErrorCategory.PERFORMANCE_DEGRADATION]: [
        {
          suggestion: "Implementar benchmarks automatizados",
          reasoning: "Performance deve ser monitorada continuamente",
          confidence: 0.7,
          category: "prevention",
          estimatedEffort: "high",
        },
      ],
      [ErrorCategory.DEPENDENCY_ERROR]: [
        {
          suggestion: "Implementar verificação de dependências no CI",
          reasoning: "Dependências devem ser validadas automaticamente",
          confidence: 0.9,
          category: "prevention",
          estimatedEffort: "low",
        },
      ],
      [ErrorCategory.UNKNOWN]: [
        {
          suggestion: "Adicionar logging estruturado para facilitar debugging",
          reasoning: "Erros desconhecidos precisam de mais contexto",
          confidence: 0.6,
          category: "investigation",
          estimatedEffort: "medium",
        },
      ],
    };

    return categoryMap[category] || [];
  }

  private generateErrorSignature(error: TestError): string {
    // Gerar assinatura única baseada na mensagem de erro
    return error.message
      .toLowerCase()
      .replace(/\d+/g, "N")
      .replace(/"[^"]*"/g, '"STRING"')
      .replace(/'[^']*'/g, "'STRING'")
      .substring(0, 100);
  }

  private findRelatedSolutions(message: string): KnowledgeBaseEntry[] {
    const related: KnowledgeBaseEntry[] = [];
    const messageWords = message.toLowerCase().split(/\s+/);

    for (const [signature, entry] of this.knowledgeBase.entries()) {
      const signatureWords = signature.split(/\s+/);
      const commonWords = messageWords.filter((word) =>
        signatureWords.some((sw) => sw.includes(word) || word.includes(sw))
      );

      if (commonWords.length >= 2) {
        related.push(entry);
      }
    }

    return related.slice(0, 2);
  }

  private removeDuplicateSuggestions(
    suggestions: ContextualSuggestion[]
  ): ContextualSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter((suggestion) => {
      const key = suggestion.suggestion.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private initializeKnowledgeBase(): void {
    // Timeout errors
    this.knowledgeBase.set("test timed out after N ms", {
      errorSignature: "test timed out after N ms",
      category: ErrorCategory.TIMEOUT,
      commonCauses: [
        "Operação assíncrona não finalizada",
        "Loop infinito no código",
        "Timeout configurado muito baixo",
        "Dependência externa lenta",
      ],
      solutions: [
        {
          description: "Aumentar timeout do teste",
          steps: [
            "Identificar operação lenta",
            "Configurar timeout apropriado",
            "Adicionar timeout específico no teste",
          ],
          codeExample: "test('my test', async () => { ... }, 30000);",
          confidence: 0.9,
        },
        {
          description: "Otimizar operações assíncronas",
          steps: [
            "Identificar operações sem await",
            "Adicionar await apropriado",
            "Usar Promise.all para operações paralelas",
          ],
          confidence: 0.8,
        },
      ],
      relatedPatterns: ["timeout", "exceeded", "async"],
      difficulty: "medium",
      estimatedTime: "15-30 minutos",
    });

    // Network errors
    this.knowledgeBase.set("fetch failed", {
      errorSignature: "fetch failed",
      category: ErrorCategory.NETWORK_ERROR,
      commonCauses: [
        "Serviço externo indisponível",
        "Configuração de rede incorreta",
        "CORS bloqueando requisição",
        "Timeout de rede",
      ],
      solutions: [
        {
          description: "Configurar mock para requisições",
          steps: [
            "Identificar requisições de rede",
            "Criar mocks apropriados",
            "Configurar respostas esperadas",
          ],
          codeExample: "vi.mock('fetch', () => ({ json: () => mockData }));",
          confidence: 0.9,
        },
      ],
      relatedPatterns: ["network", "fetch", "request"],
      difficulty: "easy",
      estimatedTime: "10-15 minutos",
    });

    // Adicionar mais entradas conforme necessário
  }

  private initializeSuggestionPatterns(): void {
    this.suggestionPatterns = [
      {
        pattern: /cannot read property.*of undefined/i,
        category: ErrorCategory.ASSERTION_FAILURE,
        priority: 1,
        suggestions: [
          "Verificar se objeto não é null/undefined antes de acessar propriedade",
          "Adicionar validação de existência do objeto",
          "Usar optional chaining (?.) para acesso seguro",
        ],
        quickFixes: [
          "Adicionar verificação: if (obj && obj.property)",
          "Usar optional chaining: obj?.property",
        ],
        debuggingSteps: [
          "Verificar valor do objeto no momento do erro",
          "Adicionar logs antes do acesso à propriedade",
        ],
        preventionTips: [
          "Sempre validar objetos antes de usar",
          "Usar TypeScript para type safety",
        ],
      },
      {
        pattern: /expected.*to equal.*but received/i,
        category: ErrorCategory.ASSERTION_FAILURE,
        priority: 1,
        suggestions: [
          "Comparar valores esperados com recebidos",
          "Verificar se dados de teste estão atualizados",
          "Confirmar lógica de negócio não mudou",
        ],
        quickFixes: [
          "Atualizar valor esperado no teste",
          "Verificar setup do teste",
        ],
        debuggingSteps: [
          "Imprimir valores esperados e recebidos",
          "Verificar transformações de dados",
        ],
        preventionTips: [
          "Usar dados de teste mais estáveis",
          "Implementar testes de contrato",
        ],
      },
    ];
  }

  private initializeContextualRules(): void {
    // Regras contextuais podem ser adicionadas aqui
    this.contextualRules.set("integration_timeout", (context) => {
      if (context.category === "integration" && context.duration > 10000) {
        return [
          {
            suggestion: "Considerar usar mocks para dependências externas",
            reasoning: "Testes de integração lentos podem ser otimizados",
            confidence: 0.8,
            category: "prevention",
            estimatedEffort: "medium",
          },
        ];
      }
      return [];
    });
  }
}
