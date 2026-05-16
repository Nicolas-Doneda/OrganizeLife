<h1 align="center">
  <br>
  OrganizeLife
  <br>
</h1>

<p align="center">
  <strong>Sua vida financeira e sua agenda, organizadas em um so lugar.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## Sobre o Projeto

**OrganizeLife** e uma aplicacao web de gerenciamento pessoal focada em financas e eventos. Com ela, voce centraliza o controle das suas entradas, gastos, contas a pagar e compromissos em uma interface limpa e intuitiva, com suporte a tema claro e escuro.

O projeto foi construido com uma arquitetura **SPA (Single Page Application)**: o backend em **Laravel** expoe uma API RESTful, e o frontend em **React** consome essa API para oferecer uma experiencia fluida sem recarregamentos de pagina.

---

## Funcionalidades

| Modulo | Descricao |
|---|---|
| **Dashboard** | Visao geral das financas com regra 50/30/20 automatica e progresso de metas em tempo real |
| **Economias** | Crie "Caixinhas" para metas especificas, acompanhe o historico de depositos e o total acumulado |
| **Receitas** | Cadastre entradas de dinheiro e marque-as como recebidas |
| **Contas** | Gerencie contas mensais e recorrentes com protecao contra dupla contagem e cancelamento inteligente |
| **Calendario** | Visualize eventos, contas e receitas em uma agenda mensal |
| **Categorias** | Organize gastos em grupos Essenciais ou Desejos para alimentar o Orcamento Inteligente |
| **Carteiras** | Organize seu dinheiro em carteiras separadas com limite simbolico |
| **Perfil** | Gerencie seus dados, avatar (cor/imagem), tema e autenticacao de dois fatores (2FA) |
| **Tema** | Alterne entre visual claro, escuro ou esmeralda com um clique |

---

## Stack Tecnologica

### Backend
- **[Laravel 12](https://laravel.com/)** — Framework PHP para a API RESTful e autenticacao
- **MySQL / SQLite** — Banco de dados relacional
- **Laravel Sanctum** — Autenticacao stateful via cookies para SPAs
- **2FA por TOTP** — Autenticacao de dois fatores compativel com Google Authenticator

### Frontend
- **[React 19](https://react.dev/)** — Interface reativa baseada em componentes
- **[React Router DOM 7](https://reactrouter.com/)** — Navegacao client-side
- **[Recharts](https://recharts.org/)** — Graficos e visualizacoes financeiras
- **[Lucide React](https://lucide.dev/)** — Icones modernos e consistentes
- **[TailwindCSS 4](https://tailwindcss.com/)** — Estilizacao utilitaria
- **[Vite 7](https://vite.dev/)** — Bundler ultrarrapido com HMR

### Design
- **OKLCH Color System** — Paleta Emerald Forest com chroma contido
- **WebGL Generative Shaders** — Background aurora reativo ao cursor (zero dependencias)
- **Scroll-Driven Animations** — Parallax cinematografico com fallback progressivo
- **CSS Custom Properties** — Design tokens para temas dinamicos

---

## Como Rodar Localmente

### Pre-requisitos
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL ou SQLite

### 1. Clone o repositorio
```bash
git clone https://github.com/Nicolas-Doneda/OrganizeLife.git
cd OrganizeLife
```

### 2. Instale as dependencias
```bash
composer install
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
php artisan key:generate
```

Edite o arquivo `.env` com suas credenciais de banco de dados.

### 4. Execute as migrations
```bash
php artisan migrate
```

### 5. Inicie os servidores de desenvolvimento

Em dois terminais separados:
```bash
# Terminal 1 - Backend Laravel
php artisan serve

# Terminal 2 - Frontend Vite
npm run dev
```

Acesse a aplicacao em **http://localhost:8000**.

---

## Estrutura do Projeto

```
OrganizeLife/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/   # Controllers da API REST
│   │   └── Requests/          # Form Requests com validacao
│   └── Models/                # Modelos Eloquent
│       ├── User.php
│       ├── Income.php
│       ├── MonthlyBill.php
│       ├── RecurringBill.php
│       ├── Wallet.php
│       ├── Category.php
│       ├── Saving.php
│       ├── SavingDeposit.php
│       └── Event.php
├── resources/
│   └── js/
│       ├── app.jsx            # Ponto de entrada React + rotas
│       ├── pages/             # Paginas da aplicacao
│       ├── components/        # Componentes reutilizaveis
│       │   ├── landing/       # AuroraCanvas, MagneticButton
│       │   ├── layouts/       # Layout principal
│       │   └── ui/            # Modais, sidebars, widgets
│       ├── contexts/          # Context API (Auth, Theme)
│       ├── hooks/             # useSubmitGuard, useActionGuard
│       └── services/          # Chamadas a API com protecao anti-duplicate
├── routes/
│   └── api.php                # Rotas da API
└── database/
    └── migrations/            # Migrations do banco de dados
```

---

## Seguranca

### Autenticacao
A autenticacao e gerenciada pelo **Laravel Sanctum** com sessoes stateful, garantindo seguranca sem armazenar tokens no `localStorage`. O sistema suporta **autenticacao de dois fatores (2FA)** via aplicativos como Google Authenticator ou Authy.

### Protecao contra Requisicoes Duplicadas
O sistema implementa protecao em duas camadas:
- **Interceptor Axios** — Debounce global de 800ms para requisicoes mutantes (POST, PUT, PATCH, DELETE)
- **Hooks de UI** — `useSubmitGuard` e `useActionGuard` bloqueiam submissoes concorrentes no nivel do componente

---

## Licenca

Distribuido sob a licenca MIT.
