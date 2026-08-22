# 🚀 Guia Completo de Deploy do DeskFlow na VPS com Coolify

Este guia orienta passo a passo como colocar o **DeskFlow** em produção na sua VPS utilizando o **Coolify** (com SSL automático via Let's Encrypt, banco PostgreSQL persistente, Redis e proxy reverso Nginx).

---

## 📋 1. Requisitos Recomendados da VPS
- **Sistema Operacional:** Ubuntu 22.04 / 24.04 LTS ou Debian 12 (64-bit)
- **Recursos Mínimos:** 2 vCPU, 2 GB a 4 GB RAM, 20 GB SSD.
- **Portas Liberadas:** 80 (HTTP), 443 (HTTPS), 22 (SSH) e 8000 (painel do Coolify).

*(Se você ainda não instalou o Coolify na VPS, basta rodar o comando abaixo no terminal SSH da sua máquina):*
```bash
curl -fsSL https://cdn.coolify.io/coolify/install.sh | bash
```

---

## 🛠️ 2. Passo a Passo no Painel do Coolify

### Opção Recomendada: Deploy via Git Repository (Docker Compose)

1. Acesse o seu painel do Coolify (`http://IP-DA-SUA-VPS:8000`).
2. Clique no seu **Project** $\rightarrow$ selecione o **Environment** (ex: `production`).
3. Clique em **+ New Resource** $\rightarrow$ selecione **Public/Private Repository** (GitHub / GitLab / Git).
4. Conecte o repositório do seu **DeskFlow**.
5. No tipo de Build, escolha **Docker Compose**.
6. No campo **Docker Compose Location**, informe:
   ```text
   docker-compose.prod.yml
   ```

---

## 🔐 3. Configuração das Variáveis de Ambiente no Coolify

Na aba **Environment Variables** do seu recurso no Coolify, adicione as seguintes variáveis de produção:

```env
# Banco de Dados
DB_USER=deskflow
DB_PASS=sua_senha_super_segura_aqui_123!
DB_NAME=deskflow_db
DB_SYNCHRONIZE=true

# Segurança & Autenticação
JWT_SECRET=gerar_uma_chave_longa_e_segura_jwt_2026_abc123!
CORS_ORIGINS=*

# (Opcional) Configurações de E-mail SMTP para envio de notificações
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=suporte@seudominio.com
SMTP_PASS=senha_do_email
SMTP_FROM="DeskFlow Suporte <suporte@seudominio.com>"
```

---

## 🌐 4. Configuração do Domínio & Certificado SSL (HTTPS)

1. No seu provedor de DNS (Cloudflare, Registro.br, Hostinger, etc.), aponte um registro do tipo **A**:
   - **Nome / Host:** `deskflow` (ou `@` se for domínio raiz)
   - **Tipo:** `A`
   - **Valor:** `IP_DA_SUA_VPS`
   - *(Exemplo: `deskflow.suaempresa.com.br`)*

2. No painel do Coolify, no serviço **frontend**:
   - No campo **Domains / FQDN**, insira:
     ```text
     https://deskflow.suaempresa.com.br
     ```
   - O Coolify / Traefik irá gerar e renovar o certificado SSL **Let's Encrypt** automaticamente!

---

## 🚀 5. Inicializar o Deploy

1. Clique no botão **Deploy** no topo do painel do Coolify.
2. O Coolify irá:
   - Baixar o código do repositório.
   - Construir a imagem do backend NestJS com compilação de produção.
   - Construir a imagem do frontend Vue 3 / Vite e empacotar no Nginx.
   - Iniciar os contêineres do PostgreSQL 16 e Redis 7 com volumes persistentes.
   - Configurar o roteamento HTTPS com SSL automático.

---

## 👤 6. Primeiro Acesso e Cadastro do Administrador

Ao acessar `https://deskflow.suaempresa.com.br`:
1. Se for o primeiro acesso ao banco, o NestJS sincronizará as tabelas automaticamente (`DB_SYNCHRONIZE=true`).
2. Para criar ou popular o usuário inicial de Admin, você pode rodar o script no terminal do contêiner `deskflow_backend` no próprio painel do Coolify (**Execute Command**):
   ```bash
   node scripts/seed-admin.js
   ```
   *Ou cadastre o primeiro usuário diretamente na tela de login/registro inicial.*

---

## 💾 7. Persistência de Dados e Backups

Todos os dados são salvos em volumes Docker seguros gerenciados pelo Coolify:
- `deskflow_pgdata`: Dados do banco de dados PostgreSQL.
- `deskflow_redisdata`: Filas de background e sessões do Redis.
- `deskflow_uploads`: Anexos de chamados e imagens.

Você pode habilitar backups automáticos diários do banco diretamente na aba **Backups** do Coolify enviando para o S3 ou localmente!
