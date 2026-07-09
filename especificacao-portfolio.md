# Especificação — Portfólio de Jornalismo

**Projeto:** Portfólio pessoal com CMS próprio para estudante de jornalismo
**Stack:** React 18 + TypeScript + Vite · Supabase (Auth, Postgres, Storage) · Vercel
**Modelo:** single-user (um editor autenticado), página pública aberta
**Data da especificação:** 03/07/2026

---

## 1. Visão geral

Sistema em duas partes:

1. **Página pública** — portfólio visual clean (referência: Figma Sites, estilo aprovado no protótipo `portfolio-clean.jsx`). Lê conteúdo publicado direto do Supabase; toda alteração feita na admin reflete automaticamente.
2. **Área admin** (`/admin`) — protegida por Supabase Auth. CRUD de projetos e categorias, uploads, carta de apresentação, caixa de mensagens do formulário de contato e geração de relatório PDF (protótipo `admin-prototipo.jsx`).

---

## 2. Design tokens (aprovados)

```css
--bg:     #F5F6F8;   /* fundo geral */
--card:   #FFFFFF;   /* cartões e painéis */
--ink:    #1F2937;   /* texto principal */
--sub:    #4B5563;   /* texto secundário */
--muted:  #6B7280;   /* metadados */
--line:   #E5E7EB;   /* bordas */
--slate:  #3F4A5C;   /* botões / ação primária */
--slate-h:#2F3949;   /* hover */
```

- Fonte única: **Inter** (400/500/600/700).
- Cantos: 10px (inputs/botões), 14px (cards), 18px (foto do hero).
- Sombras sutis; hover de card com elevação leve (`translateY(-2px)`).
- Badges de status: Publicado `#ECFDF5/#0E7A4E`, Rascunho `#FEF6E7/#B45309`.
- Cada categoria tem cor própria vinda de `categories.color`.
- Acessibilidade: focus visível em todos os interativos; `prefers-reduced-motion` respeitado.

---

## 3. Banco de dados (já criado no Supabase)

Arquivo base: `portfolio-schema.sql`. Resumo:

| Tabela | Papel | Observações |
|---|---|---|
| `categories` | Categorias dinâmicas | `name`, `slug`, `color`, `sort_order` |
| `projects` | Projetos do portfólio | `status` (`draft`/`published`), `featured`, `category_id` FK, `cover_path`, `outlet`, `external_url`, `published_at` |
| `project_files` | Anexos por projeto | cascade delete; `downloadable` controla botão de download |
| `site_settings` | Linha única (id=1) | perfil, bio, foto, banner, `social_links` jsonb |

**Complementos pendentes de execução** (aprovados na conversa):

```sql
alter table public.site_settings add column personal_statement text;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
create policy "messages_anon_insert" on public.contact_messages
  for insert to anon, authenticated with check (true);
create policy "messages_auth_read" on public.contact_messages
  for select to authenticated using (true);
create policy "messages_auth_update" on public.contact_messages
  for update to authenticated using (true) with check (true);
create policy "messages_auth_delete" on public.contact_messages
  for delete to authenticated using (true);
```

**RLS (resumo):** `anon` lê apenas conteúdo publicado (em `project_files`, via `exists` no projeto pai); `authenticated` tem CRUD completo. Sem tenant_id — single-user.

**Storage:** buckets `public-assets` (foto, banner, capas) e `project-files` (anexos), ambos públicos; escrita apenas autenticada. Migração futura para signed URLs possível sem mudança de schema.

---

## 4. Rotas

| Rota | Página | Acesso |
|---|---|---|
| `/` | Home pública (hero, projetos, carta, contato) | pública |
| `/projeto/:id` | Detalhe do projeto (conteúdo longo, anexos, link original) | pública |
| `/admin/login` | Login (Supabase Auth, email+senha) | pública |
| `/admin` | Redireciona para `/admin/projetos` | autenticada |
| `/admin/projetos` | Lista + busca | autenticada |
| `/admin/projetos/novo` e `/admin/projetos/:id` | Formulário | autenticada |
| `/admin/categorias` | CRUD de categorias | autenticada |
| `/admin/mensagens` | Caixa de entrada | autenticada |
| `/admin/configuracoes` | Perfil, carta, foto, banner | autenticada |

Proteção: componente `RequireAuth` que verifica sessão do Supabase e redireciona para login.

---

## 5. Página pública — estrutura aprovada

1. **Navbar fixa branca** — logo "Portfólio" + categorias como menu (dados de `categories`, ordenadas por `sort_order`) + link Contato. Clicar numa categoria filtra os projetos e rola até a seção.
2. **Hero** — nome grande, subtítulo, bio, botão "Carta de Apresentação"; foto de perfil grande arredondada (Storage) à direita. Banner opcional (`banner_path`).
3. **Projetos** — grid de cards (categoria em caps discreto, título, resumo, veículo, data). Somente `status = 'published'`. Destaques podem vir primeiro (`featured desc, published_at desc`). Card com capa quando `cover_path` existir.
4. **Carta de Apresentação** — bloco branco de leitura, texto de `site_settings.personal_statement`, parágrafos separados por linha em branco.
5. **Contato** — blocos de email/localização à esquerda; formulário (nome, email, mensagem) à direita → INSERT em `contact_messages` com feedback de sucesso.
6. **Footer** simples.

---

## 6. Área admin — estrutura aprovada

Sidebar fixa (colapsa para ícones em telas pequenas): Projetos, Categorias, Mensagens (com contador de não lidas), Configurações.

**Projetos (lista):** tabela com busca por título, badge de status, estrela de destaque, contagem de anexos, ações Editar/Excluir (excluir com confirmação; anexos caem via cascade + remover objetos do Storage).

**Projetos (formulário):** duas colunas —
- Esquerda: título*, resumo, veículo, data de publicação, link original, dropzone de anexos (multi-arquivo → `project-files`, registro em `project_files`).
- Direita: categoria (select de `categories`), status, checkbox destaque, upload de capa (→ `public-assets`).
- React Hook Form; na edição, carregar registro e aplicar o padrão `useEffect` + `reset(dados)`.

**Categorias:** lista com swatch de cor, contagem de projetos, renomear inline, excluir (FK é `on delete set null` — projetos ficam "sem categoria", exibir aviso), adicionar com nome + cor.

**Mensagens:** lista com não lidas destacadas, marcar como lida (`update read = true`).

**Configurações:** nome, subtítulo, bio, carta de apresentação (textarea grande), email, cidade, redes sociais, upload de foto e banner. Salva em `site_settings` (sempre `update ... where id = 1`).

---

## 7. Relatório PDF

Botão "Baixar portfólio (PDF)" na navbar pública e na admin.

- **Abordagem:** rota `/relatorio` que renderiza versão para impressão (capa com foto/nome/contato + projetos publicados agrupados por categoria, com veículo, data e link) e dispara `window.print()` em nova aba — mesmo padrão já validado no ACALASYS. CSS `@media print` dedicado.
- Alternativa client-side (`jsPDF`/`react-pdf`) fica como evolução se precisar de download direto sem diálogo de impressão.

---

## 8. Padrões técnicos e cuidados

- **Cliente Supabase** único em `src/lib/supabase.ts`, tipos gerados via `supabase gen types typescript`.
- **Queries públicas:** join simples `projects` ↔ `categories` é seguro aqui (leitura pública, sem RLS cruzada); não há necessidade do padrão de queries separadas usado nos projetos multi-tenant.
- **Uploads:** nome de arquivo = `crypto.randomUUID()` + extensão original (evita colisão e problemas de acento); guardar `file_name` original para o download. Limitar tamanho no client (ex.: 50 MB) e validar mime.
- **Botões em formulários:** sempre `type="button"` exceto o submit (lição do ACALASYS).
- **Datas:** `published_at` é `date` — exibir com `Intl.DateTimeFormat('pt-BR')`, sem conversão de timezone.
- **Env vars (Vercel):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **SEO básico:** title/description dinâmicos, og:image com a foto de perfil.

---

## 9. Ordem de implementação sugerida

1. Bootstrap Vite + TS + Router + cliente Supabase + tokens de design (CSS vars globais).
2. Rodar SQL complementar (seção 3) e conferir policies no painel.
3. Auth: login + `RequireAuth` + logout.
4. Admin Categorias (CRUD mais simples — valida o pipeline inteiro).
5. Admin Projetos (lista → formulário → uploads).
6. Admin Configurações + Mensagens.
7. Página pública (home, detalhe do projeto, formulário de contato).
8. Relatório PDF.
9. Deploy Vercel + domínio próprio.

Referências visuais aprovadas: `portfolio-clean.jsx` (pública) e `admin-prototipo.jsx` (admin).
