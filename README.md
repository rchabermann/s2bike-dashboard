# S2 Bike — Meta Ads Dashboard

Dashboard de performance de campanhas Meta Ads integrado ao Google Sheets, com atualização automática diária via Vercel Cron Jobs.

---

## Stack

- **Next.js 14** (App Router, SSG + ISR)
- **Recharts** para gráficos
- **Tailwind CSS** para estilos
- **Vercel Cron Jobs** para atualização automática

---

## Como funciona

1. A planilha do Google Sheets é exportada como CSV (pública, sem autenticação)
2. O Next.js busca os dados no build (SSG) e regenera a cada hora (ISR)
3. O Cron Job do Vercel chama `/api/revalidate` todo dia às 8h UTC, forçando refetch da planilha

---

## Pré-requisitos

- **Google Sheets deve estar público**: Arquivo → Compartilhar → Qualquer pessoa com o link → Leitor

---

## Deploy no Vercel

### 1. Instalar dependências localmente (opcional, para testar)

```bash
npm install
npm run dev
```

### 2. Fazer deploy no Vercel

```bash
# Instale a CLI do Vercel se não tiver
npm i -g vercel

# Na pasta do projeto
vercel

# Para produção
vercel --prod
```

Ou conecte o repositório GitHub diretamente no painel do Vercel (recomendado).

### 3. Configurar variável de ambiente (opcional, para segurança)

No painel do Vercel → Settings → Environment Variables:

```
CRON_SECRET = uma_senha_secreta_qualquer
```

Isso protege o endpoint `/api/revalidate` de ser chamado por terceiros.

### 4. Verificar o Cron Job

No painel do Vercel → seu projeto → Cron Jobs, você verá o job configurado para rodar todo dia às 8h UTC (5h no horário de Brasília).

---

## Atualizar a planilha de dados

Basta atualizar o ID da planilha em `lib/sheets.ts`:

```ts
const SHEET_ID = "SEU_SHEET_ID_AQUI";
```

O ID é a parte da URL entre `/d/` e `/edit`:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
```

---

## Estrutura do projeto

```
s2bike-dashboard/
├── app/
│   ├── globals.css        # Estilos globais + variáveis CSS
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Dashboard principal
│   └── api/
│       └── revalidate/
│           └── route.ts   # Endpoint do Cron Job
├── components/
│   ├── KPICard.tsx        # Cards de métricas
│   ├── SpendChart.tsx     # Gráfico investimento + impressões
│   ├── ConversationsChart.tsx  # Gráfico cliques + conversas
│   ├── CPMChart.tsx       # Gráfico CPM e CPC
│   └── AdPerformanceTable.tsx  # Tabela por anúncio
├── lib/
│   └── sheets.ts          # Fetch + parsing da planilha
├── vercel.json            # Configuração do Cron Job
└── next.config.js
```

---

## Colunas esperadas na planilha

| Coluna | Conteúdo |
|--------|----------|
| A | Reach (Alcance) |
| B | Impressions |
| C | Frequency |
| D | Amount Spent |
| E | CPM |
| F | Link Clicks |
| G | CTR |
| H | CPC |
| I | Messaging Conversations Started |
| J | Cost per Messaging Conversation |
| K | Campaign Name |
| L | Ad Set Name |
| M | Ad Name |
| N | Day (formato YYYY-MM-DD) |
