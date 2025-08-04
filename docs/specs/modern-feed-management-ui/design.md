# Design Document

## Overview

Este documento descreve o design para modernizar a interface do gerenciamento de feeds e configurações do Personal News Dashboard. O objetivo é criar uma experiência mais moderna, intuitiva e visualmente atraente, utilizando Material-UI e Lucide React, mantendo a compatibilidade com o sistema de notificações existente e corrigindo os problemas de teste.

## Architecture

### Component Architecture

A arquitetura seguirá o padrão de componentes existente, mas com melhorias na apresentação visual e na experiência do usuário:

```
components/
├── FeedManager.tsx (modernizado)
├── ThemeCustomizer.tsx (modernizado)
├── FavoritesModal.tsx (modernizado)
├── FeedCategoryManager.tsx (modernizado)
├── ui/ (novos componentes Material-UI)
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Tabs.tsx
│   └── IconButton.tsx
└── icons/ (componentes Lucide React organizados)
    ├── FeedIcons.tsx
    ├── ActionIcons.tsx
    └── StatusIcons.tsx
```

### Design System Integration

- **Material-UI Components**: Utilizaremos componentes Material-UI customizados para manter consistência visual
- **Lucide React Icons**: Substituição gradual dos ícones SVG inline por componentes Lucide React
- **Tailwind CSS**: Mantido como sistema de estilização principal, com classes customizadas para Material-UI
- **Design Tokens**: Baseado no design.md existente, com paleta de cores e espaçamentos consistentes

## Components and Interfaces

### 1. Enhanced FeedManager Component

**Melhorias visuais:**

- Cards Material-UI para cada feed com elevação sutil
- Ícones Lucide React para status de validação
- Layout em grid responsivo
- Indicadores visuais de progresso para descoberta de feeds
- Botões de ação com ícones e tooltips

**Interface atualizada:**

```typescript
interface EnhancedFeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
  articles?: Article[];
}

interface FeedCardProps {
  feed: FeedSource;
  validation?: FeedValidationResult;
  onEdit: (url: string) => void;
  onRemove: (url: string) => void;
  onRetry: (url: string) => void;
  isSelected?: boolean;
  onSelect?: (url: string) => void;
}
```

### 2. Modern UI Components

**Card Component:**

```typescript
interface CardProps {
  children: React.ReactNode;
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}
```

**Button Component:**

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### 3. Icon System

**Lucide React Integration:**

```typescript
// icons/FeedIcons.tsx
export const FeedIcons = {
  RSS: () => <Rss className="w-4 h-4" />,
  Valid: () => <CheckCircle className="w-4 h-4 text-green-500" />,
  Invalid: () => <XCircle className="w-4 h-4 text-red-500" />,
  Loading: () => <Loader2 className="w-4 h-4 animate-spin" />,
  Discovery: () => <Search className="w-4 h-4" />,
};

// icons/ActionIcons.tsx
export const ActionIcons = {
  Add: () => <Plus className="w-4 h-4" />,
  Edit: () => <Edit2 className="w-4 h-4" />,
  Delete: () => <Trash2 className="w-4 h-4" />,
  Retry: () => <RefreshCw className="w-4 h-4" />,
  Export: () => <Download className="w-4 h-4" />,
  Import: () => <Upload className="w-4 h-4" />,
};
```

## Data Models

### Enhanced Feed Display Model

```typescript
interface FeedDisplayData {
  feed: FeedSource;
  validation?: FeedValidationResult;
  discoveryProgress?: {
    status: string;
    progress: number;
  };
  isSelected: boolean;
  lastValidated?: Date;
  articleCount?: number;
}
```

### UI State Management

```typescript
interface FeedManagerUIState {
  activeTab: "feeds" | "categories" | "settings";
  viewMode: "grid" | "list";
  searchQuery: string;
  statusFilter: "all" | "valid" | "invalid" | "unchecked";
  sortBy: "name" | "status" | "lastUpdated";
  selectedFeeds: Set<string>;
  isSelectMode: boolean;
  showBulkActions: boolean;
}
```

## Error Handling

### Notification System Integration

**Correção do problema de teste:**

- Todos os componentes que usam `useNotificationReplacements` devem ser envolvidos pelo `NotificationProvider` nos testes
- Criação de um helper de teste para facilitar o setup

**Test Helper:**

```typescript
// __tests__/helpers/NotificationTestWrapper.tsx
export const NotificationTestWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

export const renderWithNotifications = (component: React.ReactElement) => {
  return render(component, { wrapper: NotificationTestWrapper });
};
```

### Enhanced Error States

**Visual Error Indicators:**

- Cards com bordas vermelhas para feeds inválidos
- Ícones de status com tooltips explicativos
- Mensagens de erro contextuais
- Botões de ação para resolução de problemas

## Testing Strategy

### Test Structure Improvements

**1. Correção dos testes existentes:**

- Envolver todos os testes do FeedManager com NotificationProvider
- Atualizar mocks para incluir novos componentes Material-UI
- Adicionar testes para novos componentes UI

**2. Novos testes para componentes UI:**

```typescript
// __tests__/ui/Card.test.tsx
describe("Card Component", () => {
  it("should render with correct elevation", () => {
    // Test implementation
  });

  it("should handle click events", () => {
    // Test implementation
  });
});
```

**3. Integration Tests:**

- Testes de integração para fluxo completo de gerenciamento de feeds
- Testes de acessibilidade para novos componentes
- Testes de responsividade

### Accessibility Testing

**WCAG 2.1 Compliance:**

- Contraste de cores adequado
- Navegação por teclado
- Labels apropriados para leitores de tela
- Indicadores de foco visíveis

## Visual Design Specifications

### Color Palette (baseado no design.md)

```css
:root {
  /* Primary Colors */
  --color-primary: 59 130 246; /* blue-500 */
  --color-primary-hover: 37 99 235; /* blue-600 */

  /* Success/Valid */
  --color-success: 34 197 94; /* green-500 */
  --color-success-bg: 240 253 244; /* green-50 */

  /* Error/Invalid */
  --color-error: 239 68 68; /* red-500 */
  --color-error-bg: 254 242 242; /* red-50 */

  /* Warning */
  --color-warning: 245 158 11; /* amber-500 */
  --color-warning-bg: 255 251 235; /* amber-50 */

  /* Neutral */
  --color-gray-50: 249 250 251;
  --color-gray-100: 243 244 246;
  --color-gray-200: 229 231 235;
  --color-gray-600: 75 85 99;
  --color-gray-800: 31 41 55;
}
```

### Typography Scale

```css
.text-display {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.2;
}

.text-heading {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.3;
}

.text-subheading {
  font-size: 1.125rem; /* 18px */
  font-weight: 500;
  line-height: 1.4;
}

.text-body {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem; /* 12px */
  font-weight: 400;
  line-height: 1.4;
}
```

### Spacing System

```css
.space-xs {
  margin: 0.25rem;
} /* 4px */
.space-sm {
  margin: 0.5rem;
} /* 8px */
.space-md {
  margin: 1rem;
} /* 16px */
.space-lg {
  margin: 1.5rem;
} /* 24px */
.space-xl {
  margin: 2rem;
} /* 32px */
```

### Component Specifications

**Feed Card Design:**

- Padding: 24px
- Border radius: 12px
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
- Border: 1px solid var(--color-gray-200)
- Hover: Elevação sutil e border color change

**Button Specifications:**

- Primary: bg-blue-600, hover:bg-blue-700
- Secondary: bg-gray-200, hover:bg-gray-300
- Danger: bg-red-600, hover:bg-red-700
- Height: 40px (md), 32px (sm), 48px (lg)
- Border radius: 8px

**Input Fields:**

- Height: 40px
- Border: 1px solid var(--color-gray-300)
- Border radius: 8px
- Focus: ring-2 ring-blue-500
- Padding: 12px 16px

## Implementation Phases

### Phase 1: Foundation Components

- Criar componentes UI base (Card, Button, Input, etc.)
- Integrar Lucide React icons
- Configurar sistema de design tokens

### Phase 2: FeedManager Modernization

- Atualizar FeedManager com novos componentes
- Implementar layout em grid responsivo
- Adicionar indicadores visuais de status

### Phase 3: Test Fixes and Enhancement

- Corrigir todos os testes com NotificationProvider
- Adicionar testes para novos componentes
- Implementar testes de acessibilidade

### Phase 4: Additional Components

- Modernizar ThemeCustomizer
- Atualizar FavoritesModal
- Melhorar FeedCategoryManager

### Phase 5: Polish and Optimization

- Refinamentos visuais
- Otimizações de performance
- Documentação de componentes
