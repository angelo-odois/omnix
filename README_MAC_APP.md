# 📱 OmniX para Mac

Cliente nativo macOS para a plataforma OmniX de atendimento WhatsApp Business.

## 🚀 Como Executar

```bash
cd /Users/ahspimentel/omnix
./omnix-mac.sh
```

## 📋 Funcionalidades

### 🖥️ **Três Modos de Uso**
- **Executar Localmente**: Cliente para desenvolvimento local
- **Acessar Online**: Cliente direto para omnix.odois.dev  
- **Modo Desenvolvedor**: Ferramentas para desenvolvimento

### 🎯 **Experiência Nativa**
- Interface SwiftUI moderna
- WebView integrada para localhost e produção
- Suporte completo à tela cheia
- Responsivo (800x600 até 4K+)

### 🔧 **Modo Desenvolvedor**
- **Sistema**: Logs e monitoramento em tempo real
- **APIs**: Testador integrado de endpoints
- **Frontend**: Controles para npm run dev
- **Backend**: Ferramentas para servidor

## ⌨️ **Atalhos**
- `Ctrl + Cmd + F` - Tela cheia
- Botão **⛶** - Toggle tela cheia
- **ESC** - Sair da tela cheia

## 📁 **Estrutura do Projeto Mac**

```
OmniXMac/
├── Package.swift          # Configuração Swift Package Manager
├── Sources/
│   └── main.swift        # App completo (1000+ linhas)
└── .build/              # Binários compilados
```

## 🛠️ **Desenvolvimento**

### Compilar:
```bash
cd OmniXMac
swift build
```

### Executar:
```bash
./.build/debug/OmniXMac
```

### Distribuir:
```bash
swift build -c release
# Executável em .build/release/OmniXMac
```

## 📱 **Requisitos**
- macOS 13.0+ (Ventura)
- Swift 6.1+
- Para modo local: Node.js + npm

## ✅ **Status**
- ✅ Cliente nativo funcional
- ✅ Interface responsiva
- ✅ Suporte tela cheia
- ✅ WebView integrada
- ✅ Modo desenvolvedor completo
- ✅ Pronto para distribuição

---
© 2024 OmniX - Plataforma WhatsApp Business