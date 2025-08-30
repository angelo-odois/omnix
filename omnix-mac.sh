#!/bin/bash

echo "🚀 OmniX para Mac - Cliente Nativo"
echo "=================================="

cd /Users/ahspimentel/omnix/OmniXMac

# Verificar se existe
if [ ! -d ".build" ]; then
    echo "📦 Compilando pela primeira vez..."
    swift build
fi

# Parar instâncias anteriores
pkill -f "OmniXMac" 2>/dev/null || true
sleep 1

echo "🚀 Iniciando OmniX para Mac..."
echo ""
echo "📱 O app vai abrir com 3 opções:"
echo "   🖥️  Executar Localmente - Cliente para localhost:8505"  
echo "   🌐 Acessar Online - Cliente para omnix.odois.dev"
echo "   🔨 Modo Desenvolvedor - Ferramentas avançadas"
echo ""
echo "✨ Suporte a tela cheia: Ctrl+Cmd+F ou botão ⛶"
echo ""

# Executar app
./.build/debug/OmniXMac &

sleep 2

# Tentar ativar janela
osascript -e 'tell application "System Events" to tell process "OmniXMac" to set frontmost to true' 2>/dev/null

echo "✅ OmniX para Mac iniciado!"
echo ""
echo "🎯 Interface responsiva e tela cheia disponível"
echo "Para parar: pkill -f OmniXMac"