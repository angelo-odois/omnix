# OmniX - Plataforma de Atendimento WhatsApp Business

## 📋 Sobre

OmniX é uma plataforma SaaS completa para gerenciamento de atendimento via WhatsApp Business, com suporte multi-tenant, integração com APIs de terceiros e sistema de pagamento.

## 🚀 Tecnologias

### Backend
- Node.js + TypeScript
- Express.js
- JWT Authentication
- Nodemailer (SMTP)
- Integração Salvy API (números virtuais)
- Integração WAHA API (WhatsApp)
- Integração Stripe (pagamentos)

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)
- React Query (data fetching)
- React Router DOM

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 20+
- npm ou yarn
- Docker (opcional)

### Setup

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/omnix.git
cd omnix
```

2. **Configure as variáveis de ambiente**

Backend:
```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais
```

Frontend:
```bash
cd ../frontend
cp .env.example .env
# Configure VITE_API_BASE_URL
```

3. **Instale as dependências**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. **Execute o projeto**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse:
- Frontend: http://localhost:5175
- Backend: http://localhost:3000

## 🐳 Docker

### Build
```bash
./build.sh
```

### Run com Docker Compose
```bash
docker-compose up -d
```

## 📦 Deploy

Consulte [README_DEPLOY.md](README_DEPLOY.md) para instruções detalhadas de deploy com Coolify.

### URLs de Produção
- Frontend: https://omnix.odois.dev
- API: https://api-omnix.odois.dev
- Webhooks: https://hook-omnix.odois.dev

## 🔐 Funcionalidades

- ✅ Autenticação JWT + Magic Link/OTP
- ✅ Multi-tenant com isolamento completo
- ✅ Gerenciamento de roles (Super Admin, Admin, Gestor, Operador)
- ✅ Integração WhatsApp via WAHA
- ✅ Números virtuais via Salvy
- ✅ Pagamentos via Stripe
- ✅ Sistema de webhooks
- ✅ Chat em tempo real
- ✅ Dashboard com métricas

## 📁 Estrutura do Projeto

```
omnix/
├── backend/
│   ├── src/
│   │   ├── routes/        # Rotas da API
│   │   ├── services/      # Lógica de negócio
│   │   ├── middlewares/   # Middlewares
│   │   └── types/         # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── services/     # Serviços de API
│   │   ├── store/        # Estado global
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── build.sh
└── deploy.sh
```

## 🧪 Usuários de Teste (Desenvolvimento)

- **Super Admin**: admin@omnix.com.br / OmniX@2024
- **Admin Tenant**: ahspimentel@gmail.com / 123456
- **Gestor**: gestor@empresa-demo.com / 123456
- **Operador**: maria@empresa-demo.com / 123456

## 📝 Licença

Propriedade privada - Todos os direitos reservados

## 👥 Equipe

Desenvolvido pela equipe OmniX

---

Para mais informações, consulte a documentação completa ou entre em contato com o suporte.
