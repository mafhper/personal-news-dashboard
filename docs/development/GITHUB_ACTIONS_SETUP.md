# Como Configurar GitHub Actions

O arquivo de workflow do GitHub Actions não pôde ser enviado automaticamente devido às permissões do token. Siga estes passos para configurar manualmente:

## Opção 1: Via Interface Web do GitHub (Recomendado)

1. **Acesse seu repositório no GitHub**:
   https://github.com/mafhper/personal-news-dashboard

2. **Vá para a aba "Actions"**

3. **Clique em "New workflow"**

4. **Escolha "set up a workflow yourself"**

5. **Cole o conteúdo abaixo no editor**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint --if-present

      - name: Run tests
        run: npm run test:run

      - name: Build project
        run: npm run build

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '20.x'
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Use Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build for production
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: dist/
```

6. **Nomeie o arquivo como**: `ci.yml`

7. **Clique em "Commit changes"**

## Opção 2: Via Git com Token Atualizado

Se você quiser usar git, precisa atualizar seu token com a permissão `workflow`:

1. **Vá para GitHub Settings > Developer settings > Personal access tokens**
2. **Edite seu token atual ou crie um novo**
3. **Marque a opção "workflow"**
4. **Use o novo token para fazer push**

## O que o Workflow Faz

- ✅ **Testa em múltiplas versões do Node.js** (18.x e 20.x)
- ✅ **Executa todos os testes** automaticamente
- ✅ **Faz build do projeto** para verificar se compila
- ✅ **Gera relatórios de cobertura** (se configurado)
- ✅ **Roda em cada push e pull request**

## Benefícios

- **Qualidade garantida**: Código só é aceito se passar nos testes
- **Detecção precoce**: Problemas são encontrados antes do merge
- **Múltiplas versões**: Compatibilidade testada automaticamente
- **Feedback rápido**: Resultados em poucos minutos

## Próximos Passos

Após configurar o workflow:

1. **Faça um pequeno commit** para testar
2. **Verifique a aba Actions** para ver o resultado
3. **Configure branch protection** para exigir que os testes passem
4. **Adicione badges** no README se desejar

## Troubleshooting

Se o workflow falhar:

1. **Verifique os logs** na aba Actions
2. **Certifique-se** que `npm run test:run` funciona localmente
3. **Verifique** se todas as dependências estão no package.json
4. **Teste** o build local com `npm run build`
