# Relatório de Planejamento: Sistema de Rendas e UX

## 1. Implementação do Sistema de Rendas (Income)
Para garantir um controle financeiro completo, precisamos de um sistema para registrar entradas de dinheiro, que servirá de base para cálculos de saldo restante e economia.

### Arquitetura Sugerida
**Backend (Laravel):**
- Criar modelo `Income` (`App\Models\Income`).
- Tabela `incomes`:
  - `id` (bigint, PK)
  - `user_id` (foreign key)
  - `description` (string)
  - `amount` (decimal, 10,2)
  - `date` (date)
  - `is_fixed` (boolean) - *Diferencia salário de freelancers/extras*.
  - `category_id` (foreign key, nullable) - *Opcional, para categorizar fontes de renda*.
  - `timestamps`

**API (Rotas e Controladores):**
- `GET /api/incomes` (listar rendas do mês)
- `POST /api/incomes` (criar nova renda)
- `PUT /api/incomes/{id}` (editar)
- `DELETE /api/incomes/{id}` (excluir)

**Cálculo de Saldo (Dashboard/API):**
- O endpoint do Dashboard precisará calcular:
  - `Total Rendas (Mês Base) = Salário Fixo + Rendas Variáveis`
  - `Total Gastos = Soma de todas as contas (Pagas + Pendentes)`
  - `Saldo Previsto = Total Rendas - Total Gastos`
  - `Saldo Atual = Total Rendas - Contas Pagas`

### Front-end (React)
- **Nova Página:** `IncomesPage.jsx` (Listagem, semelhante a `BillsPage.jsx`).
- **DashboardPage.jsx (Atualização):**
  - O resumo de "Total do Mês" ganhará contexto.
  - O card de "Saldo" será o mais importante e ficará em destaque.
  - Um gráfico em barra comparando Rendas vs. Gastos (receita vs despesa).
- **Componente:** `IncomeModal.jsx` para adicionar/editar.

---

## 2. Sugestões Focadas em UX e Design Polido
Tendo concluído a refatoração base, o site já tem um perfil "premium". As próximas sugestões envolvem detalhes que encantam os usuários:

### Alertas e Feedback Sensitivo
Em vez de depender de loaders travando a tela, adotar:
- **Toasts (Notificações Flutuantes):** Para mensagens de sucesso como "Pagamento desfeito", "Conta excluída", um pequeno card temporário (como a biblioteca `sonner` ou `react-toastify`) aumenta muito a qualidade percebida.
- **Skeleton Loaders:** Substituir o `spinner` de carregamento por um esquema de blocos piscantes que imitam o layout que vai carregar, passando a impressão de um app mais rápido e nativo.

### Dashboard Interativo
O `Dashboard` refatorado já parece bom, mas ele pode agregar ainda mais:
- **Progresso de Gastos Mensais:** Um medidor de progresso circular mostrando a % do salário já comprometida. *(Isso depende do sistema de Income, sugerido acima)*.
- **Categorias Coloridas Uniformes:** Garantir que o gráfico de pizza adote o CSS Variable do tema em vez de cores sólidas para acompanhar Dark Mode adequadamente.

---

## 3. Escalabilidade e Manutenção
Pensando no futuro do repo:

### Componentização
- Isolar os Modal (Create, Edit) em um componente genérico reutilizável.
- Isolar as requisições API em Data Hooks (`useBills()`, `useDashboard()`) com `SWR` ou `React Query` para gerenciar estado, cache e refetch automático (isso evitaria ficar chamando `fetchBills()` manualmente a cada ação de Editar, Excluir, Pagar, Desfazer, melhorando muito a performance).

### Segurança e Autenticação
- Implementar um Timeout de Sessão sensível no Frontend (ex: deslogar após X horas ocioso).
- Revisão das rules do Laravel Request Validation para assegurar que limites de string ou valores negativos de `amount` não consigam sobrecarregar a base de dados.

---

### Resumo dos Próximos Passos Ativos
1. Criar o Backend (Model `Income`, Migration e Controller).
2. Adicionar o Hook/API Service do front-end para buscar "incomes".
3. Desenvolver a página Front-end para Cadastrar Rendas (variáveis e fixas).
4. Unificar Rendas e Despesas matematicamente no Dashboard.
