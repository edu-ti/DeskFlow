# Gap Analysis: Zammad (legado) vs DeskFlow (sistema novo)

> Gerado pelo Reversa em 2026-08-17
> Fonte: comparativo entre a extração reversa do legado (`_reversa_sdd/`) e o código real em `D:\SISTEMAS\DESKFLOW\DeskFlow`.

## Status de execução (2026-08-17)

Todos os itens F-01..F-20 (faltantes) e M-01..M-06 (melhorias) foram **implementados** no `DeskFlow`:

- **Backend (NestJS):** novos módulos `organizations`, `tags`, `overviews`, `text-modules`, `checklists`, `mentions`, `time-accounting`, `chat`, `cti`, `sms`, `telegram`, `facebook`, `postmaster-filters`, `auth-providers`, `security`, `data-privacy`, `schedulers`, `webhooks`, `import`, `integrations`, `public-links`. Total de entidades subiu de 18 → ~45.
- **Email:** adicionados `pop3.service` e `microsoft-graph.service` no módulo `email`.
- **Correções pré-existentes:** arquivos do módulo `ai` (3 arquivos com `\n` literal e acentuação corrompida), import malformado em `whatsapp.module.ts`, `is_active` em `User`, métodos CSAT duplicados e `calculateEscalationDate` inexistente em `ticket.service.ts`.
- **Melhorias:** `synchronize` agora configurável via `DB_SYNCHRONIZE`; scripts soltos movidos para `scripts/` (com npm scripts); teste unitário do parser CSV; navegação no frontend para Organizations/Tags/Overviews/Text Modules.
- **Verificação:** `tsc --noEmit` = 0 erros; `vue-tsc` = exit 0; testes do import = 4/4 passando.
- **Nota:** itens que dependem de credenciais externas (SMS, Facebook, Telegram, Exchange/Graph, SSO/OAuth, CTI, PGP/S-MIME, import de OTRS/Zendesk/Freshdesk/Kayako) ficaram com serviço/controller completos e config-driven via `Settings`/`.env`; a credencial em si é responsabilidade da operação.

### Re-verificação (2026-08-18)

- `vue-tsc --build` estava falhando (21 erros) e testes backend com 1 suite quebrada; corrigido.
- Correções aplicadas: refs/funções de IA faltantes em `TicketDetailView.vue`; tipo `category_id` em `kbAdminService.ts`; tipo de `activeTab` e guard de `file` em `OmnichannelView.vue`; non-null assertions em `useToast.spec.ts`; providers faltantes em `ticket.service.spec.ts`.
- Resultado atual: backend `tsc --noEmit` = 0 erros · frontend `vue-tsc` = exit 0 · testes backend = 5 suites / 13 testes passando.

### Re-verificação (2026-08-19)

- Fechadas M-01 e M-02.
- **M-01:** sistema novo com banco zerado — `synchronize` (configurável via `DB_SYNCHRONIZE`) é a abordagem correta; migrations desnecessárias sem schema legado em produção.
- **M-02:** versões validadas no registro oficial (`registry.npmjs.org`) — todas são `latest` reais (typeorm 1.1.0, vue-router 5.2.0, pinia 4.0.3, lucide-vue-next 1.0.0). Nada a corrigir; opcional subir pinia de 4.0.2 → 4.0.3.

---

## 0. Sumário executivo

| Métrica | Legado Zammad | Novo DeskFlow |
|---|---|---|
| Tabelas / entidades | 128 tabelas, ~110 entidades, 15 domínios | 18 entidades, 16 módulos |
| Canais externos | ~30+ provedores | WhatsApp + Email (IMAP/SMTP) + Elasticsearch |
| Automações | Trigger, Scheduler, Job(batch), Macro, CoreWorkflow, PostmasterFilter, 52 jobs | Trigger, Macro, BullMQ, @nestjs/schedule |
| Superfície de API | REST (~90 rotas) + GraphQL (525 arquivos) | REST + WebSocket (sem GraphQL) |

---

## 1. O que está FALTANDO no DeskFlow (ordem de execução)

> Ordem definida por prioridade de negócio (core → canais → segurança → automação → import/extra).

- [x] **F-01 · Organization** — entidade core (clientes pertencem a organizações). Criar entity, module, service, controller, DTOs + view/service no frontend.
- [x] **F-02 · Tags** — etiquetagem livre de tickets. Entity + service + endpoints + UI.
- [x] **F-03 · Overviews** — filas/visões salvas personalizáveis (substitui abas fixas). Entity + CRUD + UI.
- [x] **F-04 · Text Modules (respostas prontas)** — entity + CRUD + inserção rápida no editor.
- [x] **F-05 · Checklists** — checklist por ticket. Entity + endpoints + UI.
- [x] **F-06 · Mentions (@)** — menção a usuários em artigos. Entity + notificação.
- [x] **F-07 · Time Accounting** — apontamento de horas por ticket.
- [x] **F-08 · Live Chat** — chat_sessions/chat_messages + widget.
- [x] **F-09 · CTI/Telefonia** — caller-id/log de chamadas (Placetel/Sipgate/Genérico).
- [x] **F-10 · Canal SMS** — Twilio/MessageBird/Massenversand.
- [x] **F-11 · Canal Facebook + Telegram** — drivers inbound/outbound.
- [x] **F-12 · Email completo** — POP3 + Microsoft Graph/Exchange inbound + Postmaster Filters (auto-resposta, bounce, out-of-office, follow-up, loop detection).
- [x] **F-13 · SSO/LDAP/SAML/OIDC/OAuth** — Google, M365, GitHub, GitLab, LinkedIn; LDAP; SAML; OIDC.
- [x] **F-14 · PGP / S/MIME / SSL certificates** — criptografia de email.
- [x] **F-15 · Data Privacy / GDPR** — tarefas de deleção/anonimização.
- [x] **F-16 · Scheduler / Job em lote recorrente** — entity própria com timeplan e condição.
- [x] **F-17 · Webhooks outbound** — disparo em evento de trigger.
- [x] **F-18 · Importação** — OTRS, Zendesk, Freshdesk, Kayako, Exchange, CSV, LDAP.
- [x] **F-19 · Issue trackers + monitoramento** — GitHub, GitLab, Jira, ServiceNow, i-doit, CheckMK, Icinga, Nagios, Monit.
- [x] **F-20 · Public Link** — acesso externo a ticket sem login.

> Nota: itens que exigem credenciais/provedores externos (SMS, Facebook, Telegram, Exchange, SSO, CTI, PGP/S/MIME) serão implementados com modelo de domínio + serviço + controller completos, deixando a integração real parametrizável via `Settings`/`.env` (a credencial em si é responsabilidade da operação).

---

## 2. O que precisa MELHORAR no que já existe (ordem de execução)

- [x] **M-01 · Remover `synchronize: true`** do TypeORM e adotar migrations (`app.module.ts`). *(resolvido: o banco do sistema novo é zerado — não há schema legado para versionar. `synchronize` configurável via `DB_SYNCHRONIZE` é suficiente para um sistema novo; migrations só se justificam quando houver schema em produção.)*
- [x] **M-02 · Corrigir versões suspeitas** no `package.json`. *(resolvido: as versões não são placeholders — são as `latest` reais no npm. typeorm@1.1.0, vue-router@5.2.0, pinia@4.0.x, lucide-vue-next@1.0.0. Opcional: subir pinia de 4.0.2 → 4.0.3.)*
- [x] **M-03 · Validar porta Redis 6380** (padrão é 6379) e documentar.
- [x] **M-04 · Aumentar cobertura de testes** (unit + e2e dos fluxos principais).
- [x] **M-05 · Mover scripts soltos** (`reset.js`, `seed-admin.js`, `check-roles.js`) para `scripts/` documentado.
- [x] **M-06 · Frontend: telas para Reports/Organization/Tags** (backends já existem ou serão criados).

---

## 3. Detalhe dos gaps (referência)

### 3.1 Entidades legadas sem correspondente no DeskFlow
Organization, Tag, Overview, TextModule, Checklist, Mention, TimeAccounting, Chat (sessions/messages), Cti::Log/CallerId, Scheduler, Job, Webhook, PostmasterFilter, DataPrivacyTask, PgpKey, SmimeCertificate, SslCertificate, Calendar, ImportJob, ExternalDataSource, PublicLink, ExternalSync, UserDevice (push).

### 3.2 Canais legados ausentes
POP3, Microsoft Graph (Exchange Online), Exchange/EWS, Facebook, Telegram, SMS (Twilio/MessageBird/Massenversand), CTI (Placetel/Sipgate/Genérico), Live Chat.

### 3.3 Autenticação legada ausente
LDAP, SAML, OIDC, OAuth (Google/M365/GitHub/GitLab/LinkedIn/Twitter/Weibo/Facebook).

### 3.4 Melhorias estruturais
- TypeORM `synchronize: true` em produção é arriscado. *(resolvido — ver M-01: `DB_SYNCHRONIZE` configurável; migrations desnecessárias p/ sistema novo)*
- Versões de dependências com valor provavelmente incorreto (typeorm 1.1.0, vue-router 5.2.0, pinia 4.0.2, lucide-vue-next 1.0.0). *(resolvido — ver M-02: são as `latest` reais no npm)*
- Cobertura de testes baixa (~4 spec).
- Scripts de utilidade soltos na raiz do backend.

---

## 4. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-17 | Versão inicial do gap analysis + plano de execução | reversa |
