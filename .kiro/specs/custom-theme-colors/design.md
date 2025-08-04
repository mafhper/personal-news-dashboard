# Design Document

## Overview

Este documento descreve o design para implementação de 6 novos temas personalizados no Personal News Dashboard. O sistema utilizará a arquitetura existente de temas estendidos (ExtendedTheme) para criar presets específicos com as cores solicitadas pelo usuário. A implementação manterá compatibilidade com o sistema atual enquanto substitui os temas existentes pelos novos.

## Architecture

### Current Theme System

O sistema atual utiliza:

- **ExtendedTheme interface**: Define estrutura completa de temas com cores RGB, layout, densidade, etc.
- **ThemePreset interface**: Agrupa temas em categorias (light, dark, colorful, minimal)
- **themeUtils.ts**: Utilitários para validação, aplicação e manipulação de temas
- **useExtendedTheme hook**: Gerencia estado e persistência de temas
- **CSS Custom Properties**: Variáveis CSS para aplicação dinâmica de cores

### New Theme Integration

Os novos temas serão integrados como:

- **6 novos ThemePresets**: 3 na categoria 'dark' e 3 na categoria 'light'
- **Substituição dos presets existentes**: Manter apenas os 6 novos temas
- **Conversão de cores HEX para RGB**: Todas as cores fornecidas em HEX serão convertidas para formato RGB string
- **Manutenção da estrutura ExtendedTheme**: Preservar layout, densidade, bordas, sombras e animações

## Components and Interfaces

### Theme Definitions

#### Dark Themes Structure

```typescript
// Noite Urbana
{
  id: 'noite-urbana',
  name: 'Noite Urbana',
  description: 'Tema escuro urbano com azul médio e acentos âmbar',
  category: 'dark',
  theme: {
    id: 'noite-urbana',
    name: 'Noite Urbana',
    colors: {
      primary: '30 136 229',    // #1E88E5
      secondary: '30 30 30',    // Derived from surface
      accent: '255 193 7',      // #FFC107
      background: '18 18 18',   // #121212
      surface: '30 30 30',      // #1E1E1E
      text: '255 255 255',      // #FFFFFF
      textSecondary: '176 176 176', // #B0B0B0
      border: '75 85 99',       // Standard border
      success: '16 185 129',    // Standard success
      warning: '245 158 11',    // Standard warning
      error: '239 68 68',       // Standard error
    },
    layout: 'comfortable',
    density: 'medium',
    borderRadius: 'medium',
    shadows: true,
    animations: true,
  }
}
```

#### Light Themes Structure

```typescript
// Solar Clean
{
  id: 'solar-clean',
  name: 'Solar Clean',
  description: 'Tema claro limpo com azul clássico e laranja queimado',
  category: 'light',
  theme: {
    id: 'solar-clean',
    name: 'Solar Clean',
    colors: {
      primary: '25 118 210',    // #1976D2
      secondary: '245 245 245', // Derived from surface
      accent: '244 81 30',      // #F4511E
      background: '255 255 255', // #FFFFFF
      surface: '245 245 245',   // #F5F5F5
      text: '33 33 33',         // #212121
      textSecondary: '97 97 97', // #616161
      border: '209 213 219',    // Standard border
      success: '16 185 129',    // Standard success
      warning: '245 158 11',    // Standard warning
      error: '239 68 68',       // Standard error
    },
    layout: 'comfortable',
    density: 'medium',
    borderRadius: 'medium',
    shadows: true,
    animations: true,
  }
}
```

### Color Conversion Utility

```typescript
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r} ${g} ${b}`;
};
```

### Theme Preset Updates

O arquivo `services/themeUtils.ts` será atualizado para:

1. **Substituir defaultThemePresets**: Remover presets existentes e adicionar os 6 novos
2. **Manter utilitários de validação**: Preservar funções de contraste e acessibilidade
3. **Atualizar tema padrão**: Definir 'solar-clean' como tema padrão

### Component Integration

#### ThemeCustomizer Updates

- **Remover seletor de cores personalizadas**: Focar apenas nos 6 presets
- **Organizar por categoria**: Separar temas escuros e claros visualmente
- **Preview de cores**: Mostrar paleta de cores de cada tema
- **Descrições**: Adicionar descrições dos temas para melhor UX

#### CSS Custom Properties

As variáveis CSS serão atualizadas automaticamente via `applyThemeToDOM()`:

```css
:root {
  --color-primary: 30 136 229;
  --color-accent: 255 193 7;
  --color-background: 18 18 18;
  --color-surface: 30 30 30;
  --color-text: 255 255 255;
  --color-textSecondary: 176 176 176;
  /* ... outras variáveis */
}
```

## Data Models

### Complete Theme Definitions

#### Dark Themes

1. **Noite Urbana**: Primary #1E88E5, Accent #FFC107, Background #121212
2. **Verde Noturno**: Primary #43A047, Accent #FDD835, Background #0D0D0D
3. **Roxo Nebuloso**: Primary #8E24AA, Accent #FF4081, Background #101014

#### Light Themes

1. **Solar Clean**: Primary #1976D2, Accent #F4511E, Background #FFFFFF
2. **Verão Pastel**: Primary #EC407A, Accent #7E57C2, Background #FFF8F0
3. **Minimal Ice**: Primary #00ACC1, Accent #FF7043, Background #F0F4F8

### RGB Conversion Table

| Color   | HEX                   | RGB String  |
| ------- | --------------------- | ----------- |
| #1E88E5 | Blue Medium           | 30 136 229  |
| #FFC107 | Amber                 | 255 193 7   |
| #121212 | Almost Black          | 18 18 18    |
| #1E1E1E | Dark Gray             | 30 30 30    |
| #FFFFFF | White                 | 255 255 255 |
| #B0B0B0 | Light Gray            | 176 176 176 |
| #43A047 | Green Medium          | 67 160 71   |
| #FDD835 | Solar Yellow          | 253 216 53  |
| #0D0D0D | Deep Black            | 13 13 13    |
| #1B1F1D | Green-Gray Dark       | 27 31 29    |
| #F1F1F1 | Almost White          | 241 241 241 |
| #A8A8A8 | Medium Gray           | 168 168 168 |
| #8E24AA | Purple                | 142 36 170  |
| #FF4081 | Vibrant Pink          | 255 64 129  |
| #101014 | Blue-Gray Dark        | 16 16 20    |
| #1A1A23 | Slightly Blue Surface | 26 26 35    |
| #E0E0E0 | Very Light Gray       | 224 224 224 |
| #9C9C9C | Medium Gray           | 156 156 156 |
| #1976D2 | Classic Blue          | 25 118 210  |
| #F4511E | Burnt Orange          | 244 81 30   |
| #F5F5F5 | Light Gray            | 245 245 245 |
| #212121 | Almost Black          | 33 33 33    |
| #616161 | Dark Gray             | 97 97 97    |
| #EC407A | Hot Pink              | 236 64 122  |
| #7E57C2 | Soft Lilac            | 126 87 194  |
| #FFF8F0 | Light Beige           | 255 248 240 |
| #757575 | Medium Gray           | 117 117 117 |
| #00ACC1 | Cold Cyan             | 0 172 193   |
| #FF7043 | Coral Orange          | 255 112 67  |
| #F0F4F8 | Ice Blue Light        | 240 244 248 |
| #1C1C1C | Almost Black          | 28 28 28    |
| #5E5E5E | Medium Gray           | 94 94 94    |

## Error Handling

### Theme Validation

- **RGB Format Validation**: Verificar se todas as cores estão no formato "R G B"
- **Contrast Validation**: Garantir contraste mínimo WCAG AA (4.5:1)
- **Fallback Themes**: Usar tema padrão se validação falhar
- **Error Logging**: Registrar erros de aplicação de tema

### Accessibility Compliance

- **Automatic Contrast Fixing**: Usar `autoFixThemeAccessibility()` se necessário
- **WCAG AA Compliance**: Todos os temas devem atender padrões mínimos
- **Color Blindness Testing**: Validar temas com simulação de daltonismo

## Testing Strategy

### Unit Tests

1. **Theme Definition Tests**: Validar estrutura de cada tema
2. **Color Conversion Tests**: Testar conversão HEX para RGB
3. **Contrast Ratio Tests**: Verificar contraste de cada combinação
4. **Theme Application Tests**: Testar aplicação via `applyThemeToDOM()`

### Integration Tests

1. **Theme Switching Tests**: Testar mudança entre todos os 6 temas
2. **Persistence Tests**: Verificar salvamento no localStorage
3. **Component Rendering Tests**: Testar aplicação em todos os componentes
4. **Accessibility Tests**: Validar contraste em cenários reais

### Visual Regression Tests

1. **Theme Screenshots**: Capturar screenshots de cada tema
2. **Component Consistency**: Verificar aplicação consistente
3. **Responsive Testing**: Testar temas em diferentes tamanhos de tela

### Test Data

```typescript
const testThemes = [
  "noite-urbana",
  "verde-noturno",
  "roxo-nebuloso",
  "solar-clean",
  "verao-pastel",
  "minimal-ice",
];

const contrastRequirements = {
  textOnBackground: 4.5,
  textOnSurface: 4.5,
  accentOnBackground: 3.0,
  secondaryTextOnBackground: 4.5,
};
```

## Implementation Considerations

### Performance

- **CSS Custom Properties**: Mudanças instantâneas sem re-render
- **Theme Caching**: Cache de temas validados
- **Lazy Loading**: Carregar apenas tema ativo

### Backward Compatibility

- **Migration Strategy**: Mapear temas antigos para novos
- **Default Fallback**: 'solar-clean' como padrão seguro
- **Settings Migration**: Converter preferências existentes

### User Experience

- **Smooth Transitions**: Transições suaves entre temas
- **Preview Mode**: Visualizar tema antes de aplicar
- **Theme Descriptions**: Explicar características de cada tema
- **Category Organization**: Agrupar temas escuros e claros

This design ensures a seamless integration of the 6 new custom themes while maintaining the robustness and accessibility of the existing theme system.
