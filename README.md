<h1 align="center">
  <br>
  OrganizeLife
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

## Sobre o Projeto

OrganizeLife é uma aplicação web de gerenciamento pessoal focada em finanças e eventos. Com ela, você centraliza o controle das suas entradas, gastos, contas a pagar e compromissos em uma interface limpa e intuitiva, com suporte a tema claro e escuro.

A aplicação foi construída utilizando uma arquitetura SPA (Single Page Application). O backend em Laravel expõe uma API RESTful estruturada, enquanto o frontend em React consome essa API de maneira assíncrona, proporcionando uma experiência de uso fluida e sem recarregamento de páginas.

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| Dashboard | Visão geral das finanças com regra 50/30/20 automática e progresso de metas em tempo real |
| Economias | Criação de Caixinhas para metas de médio e longo prazo, com histórico de depósitos |
| Receitas | Cadastro de entradas financeiras e marcação de recebimento |
| Contas | Gerenciamento de despesas mensais e recorrentes com proteção contra dupla contagem |
| Calendário | Visualização unificada de eventos, vencimento de contas e previsão de receitas em agenda mensal |
| Categorias | Organização de gastos em grupos (Essenciais, Desejos ou Economias) para o Orçamento Inteligente |
| Carteiras | Separação física/simbólica dos saldos monetários |
| Perfil | Edição de dados pessoais, avatar (cor/imagem), tema e autenticação de dois fatores (2FA) |

---

## Stack Tecnológica

### Backend
- Laravel 12 — Framework PHP robusto para API RESTful, controle de acesso e regras de negócio
- MySQL / SQLite — Bancos de dados relacionais suportados
- Laravel Sanctum — Autenticação baseada em sessões com segurança Hashing e sem tokens expostos em localStorage
- 2FA por TOTP — Autenticação de dois fatores compatível com autenticadores (Google Authenticator, Authy, etc.)

### Frontend
- React 19 — Biblioteca de componentes declarativos para a interface reativa
- React Router DOM 7 — Roteamento dinâmico no cliente
- Recharts — Biblioteca de gráficos interativos para exibição histórica e estatística
- Lucide React — Conjunto de ícones vetoriais modernos e consistentes
- TailwindCSS 4 — Estilização moderna utilitária com compilação nativa
- Vite 7 — Bundler ultrarrapido de desenvolvimento e compilação para produção

---

## Sistema de Design (Warm Nights)

O OrganizeLife segue o guia estético Warm Nights, que foca em um design limpo, suave e focado no uso pessoal (ferramenta sofisticada e humana, e não uma planilha técnica ou dashboard de criptomoedas).

### Paleta de Cores (OKLCH System)
A estilização utiliza o sistema OKLCH para garantir misturas de cores consistentes e de alto contraste em ambos os temas:

- Primária (Marca / Ações): Areia Quente / Âmbar (Warm Sand)
  - Light Mode: Tons creme e areia suave para backgrounds e bordas
  - Dark Mode: Tons de carvão profundo (Obsidian) com realces âmbar
- Entrada / Sucesso: Verde Esmeralda Menta (Mint Emerald) — Utilizado em receitas, depósitos e renda prevista
- Saída / Perigo: Vermelho Carmim (Crimson Rose) — Utilizado em gastos, exclusões e alertas de limite
- Aviso / Pendência: Bronze Dourado (Warm Bronze) — Utilizado em contas com vencimento pendente

---

## Modificações Recentes no Projeto

As seguintes melhorias estruturais e correções visuais foram implementadas recentemente no OrganizeLife:

### Correções de Layout e Sobreposição
- Reestruturação da listagem de despesas em Contas: o container de ações rápidas e o valor esperado foram convertidos em elementos totalmente inline e distribuídos horizontalmente, impedindo a sobreposição de botões e textos.
- Ajuste das tags na descrição: o nome da despesa agora possui destaque principal no lado esquerdo, enquanto as tags de Categoria e os badges associados ficam perfeitamente ancorados à direita da coluna, mantendo o layout fixo em todas as linhas.

### Refatoração de Confirmações e UX
- Substituição de popups nativos do navegador (`window.confirm`, `window.alert`) por diálogos personalizados (`ConfirmDialog`), estilizados nativamente de acordo com a paleta do sistema.
- Correção de botões de exclusão: removidos gradientes com transparência quebrada nos botões dos modais de decisão, substituindo-os por cores sólidas de alto contraste que evitam que o texto seja visualmente cortado.

### Ajustes no Tema Claro e Visibilidade
- Distintivo de parcelas: o badge de parcelamento (ex: `Parcela 1/15`) agora calcula dinamicamente o contraste de fundo e texto no Light Mode usando `color-mix`, eliminando um sombreamento escuro e ilegível que existia anteriormente.
- Filtro de Categorias: o botão do filtro "Todas" foi ajustado com estilos em linha para impedir que receba o hover cinza bizarro herdado de estilos globais de botões.

### Ajustes de Cores no Dashboard
- Renda Prevista: o card e o seu valor foram restaurados para a cor verde semântica de entradas.
- Resultado Projetado: o balanço, quando positivo, foi padronizado com os tons de areia/âmbar primários da aplicação.
- Gráfico de Evolução de Gastos: as linhas de "Previsto" e "Pago" foram associadas a novas propriedades CSS dinâmicas (`--chart-expected` e `--chart-paid`). A linha de gastos previstos foi clareada no Dark Mode e escurecida no Light Mode para garantir a visibilidade adequada.
- Orçamento Inteligente: removido o texto obsoleto de "Total guardado" sob o progresso de metas e caixinhas.

### Governança e Limpeza
- Exclusão de arquivos obsoletos de páginas não utilizadas do frontend (`MonthlyBillsPage.jsx`, `RecurringBillsPage.jsx` e `EventsPage.jsx`).
- Atualização do `.gitignore` para omitir pastas de agentes locais (`.agents/`), arquivos de travas de ambiente (`skills-lock.json`), logs locais (`build_log.txt`, `build_output.txt`) e scripts locais de teste (`test_counts.php`).

---

## Como Rodar Localmente

### Pré-requisitos
- PHP >= 8.2
- Composer
- Node.js >= 18
- Banco de dados relacional (MySQL ou SQLite)

### 1. Instalação e Preparação
```bash
git clone https://github.com/Nicolas-Doneda/OrganizeLife.git
cd OrganizeLife
composer install
npm install
```

### 2. Configuração do Ambiente
```bash
cp .env.example .env
php artisan key:generate
```
Configure a conexão do banco de dados no arquivo `.env`.

### 3. Migração do Banco de Dados
```bash
php artisan migrate
```

### 4. Servidores de Desenvolvimento
Inicie os seguintes comandos em terminais separados:
```bash
# Terminal 1 - Laravel API
php artisan serve

# Terminal 2 - Frontend Vite HMR
npm run dev
```

---

## Licença

Distribuído sob a licença MIT.
