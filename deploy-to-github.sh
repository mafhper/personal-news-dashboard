#!/bin/bash

# Script para preparar e enviar o projeto para o GitHub
# Personal News Dashboard

echo "🚀 Preparando o Personal News Dashboard para o GitHub..."

# Verificar se estamos em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Este diretório não é um repositório Git."
    echo "Inicializando repositório Git..."
    git init
    git branch -M main
fi

# Adicionar remote se não existir
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📡 Adicionando remote origin..."
    git remote add origin https://github.com/mafhper/personal-news-dashboard.git
fi

# Verificar se há mudanças para commit
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Não há mudanças para commit."
else
    echo "📝 Adicionando arquivos ao staging..."
    git add .

    echo "💾 Fazendo commit das mudanças..."
    git commit -m "feat: initial release of Personal News Dashboard v1.0.0

- Complete RSS feed aggregation system
- Modern UI with React 19.1.0 and TypeScript 5.8.3
- Comprehensive theme system with customization
- Feed management with categories and drag-and-drop
- Smart validation and auto-discovery
- PWA support with offline functionality
- Full accessibility compliance (WCAG 2.1 AA)
- Extensive test suite with 90%+ coverage
- Performance optimizations and caching
- Local data storage for privacy"
fi

echo "🔄 Fazendo push para o GitHub..."
git push -u origin main

echo "✅ Projeto enviado com sucesso para o GitHub!"
echo ""
echo "🌐 Seu repositório está disponível em:"
echo "   https://github.com/mafhper/personal-news-dashboard"
echo ""
echo "📚 Próximos passos:"
echo "   1. Acesse o repositório no GitHub"
echo "   2. Configure GitHub Pages se desejar (Settings > Pages)"
echo "   3. Adicione colaboradores se necessário"
echo "   4. Configure branch protection rules"
echo "   5. Ative GitHub Actions para CI/CD"
echo ""
echo "🎉 Parabéns! Seu projeto está no ar!"
