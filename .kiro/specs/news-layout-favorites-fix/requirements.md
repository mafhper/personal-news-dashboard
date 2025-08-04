# Requirements Document

## Introduction

Esta especificação define correções específicas para a interface do usuário do Personal News Dashboard, focando em dois problemas identificados: o alinhamento vertical dos posts na seção "Últimas Notícias" e a ausência de funcionalidade de favoritos na notícia principal e nas últimas notícias.

## Requirements

### Requirement 1

**User Story:** Como usuário que visualiza a seção "Últimas Notícias", quero que cada postagem seja centralizada verticalmente em seu container, para que a apresentação visual seja mais equilibrada e profissional.

#### Acceptance Criteria

1. WHEN o usuário visualiza a seção "Últimas Notícias" THEN cada item deve estar centralizado verticalmente em seu container
2. WHEN há diferentes alturas de conteúdo entre os itens THEN todos devem manter o alinhamento vertical consistente
3. WHEN o usuário redimensiona a janela THEN o alinhamento vertical deve ser mantido em todas as resoluções
4. WHEN há 5 itens na seção "Últimas Notícias" THEN todos devem ter espaçamento vertical uniforme
5. IF o conteúdo de um item é menor que o espaço disponível THEN deve ser centralizado verticalmente no espaço alocado

### Requirement 2

**User Story:** Como usuário que consome notícias, quero poder favoritar a notícia principal (featured article), para que eu possa salvá-la para leitura posterior.

#### Acceptance Criteria

1. WHEN o usuário visualiza a notícia principal THEN deve haver um botão de favoritar visível
2. WHEN o usuário clica no botão de favoritar THEN o artigo deve ser adicionado aos favoritos
3. WHEN o artigo já está favoritado THEN o botão deve mostrar o estado ativo (coração preenchido)
4. WHEN o usuário clica no botão de favoritar de um artigo já favoritado THEN deve ser removido dos favoritos
5. IF o usuário passa o mouse sobre o botão THEN deve haver feedback visual (hover state)

### Requirement 3

**User Story:** Como usuário que consome notícias, quero poder favoritar as notícias da seção "Últimas Notícias", para que eu possa salvá-las para leitura posterior.

#### Acceptance Criteria

1. WHEN o usuário visualiza a seção "Últimas Notícias" THEN cada item deve ter um botão de favoritar
2. WHEN o usuário clica no botão de favoritar THEN o artigo deve ser adicionado aos favoritos
3. WHEN o artigo já está favoritado THEN o botão deve mostrar o estado ativo (coração preenchido)
4. WHEN o usuário clica no botão de favoritar de um artigo já favoritado THEN deve ser removido dos favoritos
5. IF o usuário passa o mouse sobre o botão THEN deve haver feedback visual (hover state)

### Requirement 4

**User Story:** Como usuário que gerencia favoritos, quero que os favoritos adicionados da notícia principal e das últimas notícias apareçam no modal de favoritos, para que eu possa acessá-los de forma consistente.

#### Acceptance Criteria

1. WHEN o usuário favorita a notícia principal THEN ela deve aparecer no modal de favoritos
2. WHEN o usuário favorita um item das "Últimas Notícias" THEN ele deve aparecer no modal de favoritos
3. WHEN o usuário abre o modal de favoritos THEN deve ver todos os artigos favoritados de todas as seções
4. WHEN o usuário remove um favorito do modal THEN o botão correspondente na interface deve refletir o estado atualizado
5. IF o usuário exporta favoritos THEN devem incluir artigos de todas as seções (principal, últimas notícias, top stories)

### Requirement 5

**User Story:** Como usuário que interage com a interface, quero que os botões de favoritar tenham posicionamento e design consistentes, para que a experiência seja uniforme em todas as seções.

#### Acceptance Criteria

1. WHEN o usuário visualiza diferentes seções THEN os botões de favoritar devem ter design visual consistente
2. WHEN o usuário interage com botões de favoritar THEN todos devem ter o mesmo comportamento de hover e click
3. WHEN os botões estão no estado ativo THEN devem usar a mesma cor e ícone em todas as seções
4. WHEN os botões estão no estado inativo THEN devem usar a mesma cor e ícone em todas as seções
5. IF há limitações de espaço THEN o posicionamento deve ser adaptado mantendo a funcionalidade
