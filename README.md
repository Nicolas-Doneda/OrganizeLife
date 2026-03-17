<h1 align="center">
  <br>
  📋 OrganizeLife
  <br>
</h1>

<p align="center">
  <strong>Sua vida financeira e sua agenda, organizadas em um só lugar.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📖 Sobre o Projeto

**OrganizeLife** é uma aplicação web de gerenciamento pessoal focada em finanças e eventos. Com ela, você centraliza o controle das suas entradas, gastos, contas a pagar e compromissos em uma interface limpa e intuitiva, com suporte a tema claro e escuro.

O projeto foi construído com uma arquitetura **SPA (Single Page Application)**: o backend em **Laravel** expõe uma API RESTful, e o frontend em **React** consome essa API para oferecer uma experiência fluida sem recarregamentos de página.

---

## ✨ Funcionalidades

| Módulo | O que você pode fazer |
|---|---|
| 🏠 **Dashboard** | Visão geral das finanças: saldo, receitas, despesas e gráficos |
| 💰 **Receitas** | Cadastre entradas de dinheiro e marque-as como recebidas |
| 📄 **Contas** | Gerencie contas mensais e contas recorrentes com controle de status |
| 📅 **Calendário** | Visualize eventos, contas e receitas em uma agenda mensal |
| 🏷️ **Categorias** | Crie categorias personalizadas para organizar suas despesas |
| 👛 **Carteiras** | Organize seu dinheiro em carteiras separadas com limite simbólico |
| 👤 **Perfil** | Gerencie seus dados, senha e autenticação de dois fatores (2FA) |
| 🌗 **Tema** | Alterne entre visual claro e escuro com um clique |

---

## 🛠️ Stack Tecnológica

### Backend
- **[Laravel 12](https://laravel.com/)** — Framework PHP para a API RESTful e autenticação
- **MySQL / SQLite** — Banco de dados relacional
- **Laravel Sanctum** — Autenticação stateful via cookies para SPAs
- **2FA por TOTP** — Autenticação de dois fatores compatível com Google Authenticator

### Frontend
- **[React 19](https://react.dev/)** — Interface reativa baseada em componentes
- **[React Router DOM 7](https://reactrouter.com/)** — Navegação client-side
- **[Recharts](https://recharts.org/)** — Gráficos e visualizações financeiras
- **[Lucide React](https://lucide.dev/)** — Ícones modernos e consistentes
- **[TailwindCSS 4](https://tailwindcss.com/)** — Estilização utilitária
- **[Vite 7](https://vite.dev/)** — Bundler ultrarrápido com HMR

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL ou SQLite

### 1. Clone o repositório
```bash
git clone https://github.com/Nicolas-Doneda/OrganizeLife.git
cd OrganizeLife
```

### 2. Instale as dependências
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

Acesse a aplicação em **http://localhost:8000**.

---

## 🗂️ Estrutura do Projeto

```
OrganizeLife/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/   # Controllers da API REST
│   │   └── Requests/          # Form Requests com validação
│   └── Models/                # Modelos Eloquent
│       ├── User.php
│       ├── Income.php
│       ├── MonthlyBill.php
│       ├── RecurringBill.php
│       ├── Wallet.php
│       ├── Category.php
│       └── Event.php
├── resources/
│   └── js/
│       ├── app.jsx            # Ponto de entrada React + rotas
│       ├── pages/             # Páginas da aplicação
│       ├── components/        # Componentes reutilizáveis
│       ├── contexts/          # Context API (Auth, Theme)
│       └── services/          # Chamadas à API
├── routes/
│   └── api.php                # Rotas da API
└── database/
    └── migrations/            # Migrations do banco de dados
```

---

## 🔐 Autenticação

A autenticação é gerenciada pelo **Laravel Sanctum** com sessões stateful, o que garante segurança sem a necessidade de armazenar tokens no `localStorage`. O sistema também suporta **autenticação de dois fatores (2FA)** via aplicativos como Google Authenticator ou Authy.


