# 🗂️ Arquivo de Evidências Jurídicas

App **mobile-first** para o usuário manter um arquivo pessoal de evidências (fotos, vídeos, áudios, links, documentos), cada uma com **nome, descrição e data do fato**, e **compartilhar em modo somente-leitura** com juízes, advogados etc. via **link + QR code**, WhatsApp ou e-mail.

- **Front-end:** React + TypeScript + Vite + Tailwind → hospedado no **GitHub Pages** (link estático)
- **Back-end:** **Supabase** — Auth (login/senha/troca), Postgres e Storage de mídia
- **Captura:** câmera e microfone do celular **e** upload de arquivos do dispositivo

---

## 1. Configurar o Supabase

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Em **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique **Run**.
   Isso cria as tabelas, o RLS (segurança por usuário), o bucket público `media` e a função de compartilhamento.
3. Em **Settings → API**, copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. (Opcional) Em **Authentication → Providers → Email**, você pode desligar "Confirm email"
   para testar mais rápido, ou deixar ligado para exigir confirmação por e-mail.
5. Em **Authentication → URL Configuration**:
   - **Site URL:** `https://SEU-USUARIO.github.io/evidencias-juridicas/`
   - **Redirect URLs:** adicione `https://SEU-USUARIO.github.io/evidencias-juridicas/**` e `http://localhost:5173/**`
     (o `/**` é curinga; o `localhost` é para o desenvolvimento).
6. **Recuperação de senha por código (importante):** a tela "Recuperar senha" usa um **código de 6 dígitos**
   em vez de link, porque filtros de e-mail (ex.: *Safe Links* do Outlook/Office365) pré-abrem links e consomem
   o token de uso único, fazendo o link chegar "expirado". Para o código chegar no e-mail, edite o template em
   **Authentication → Emails → Reset Password** e inclua o token, por exemplo:

   ```html
   <h2>Redefinir senha</h2>
   <p>Use este código para criar uma nova senha:</p>
   <p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   ```

   > Deixe **apenas o código** (`{{ .Token }}`) no template. Se mantiver o link `{{ .ConfirmationURL }}` junto,
   > o cliente pode clicar nele e cair no fluxo antigo (sujeito ao problema do Safe Links).

> A chave `anon` é **pública** e pode ir no front-end — o RLS é quem protege os dados.
> **Nunca** exponha a chave `service_role`.

## 2. Rodar localmente

```bash
npm install
cp .env.example .env      # e preencha com sua URL e anon key
npm run dev
```

Abra o endereço que o Vite mostrar (ex.: `http://localhost:5173`).

## 3. Publicar no GitHub Pages

1. Crie um repositório no GitHub chamado **`evidencias-juridicas`** e faça o push:
   ```bash
   git init
   git add .
   git commit -m "primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/evidencias-juridicas.git
   git push -u origin main
   ```
2. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
4. Cada `git push` na branch `main` publica automaticamente. O site fica em:
   `https://SEU-USUARIO.github.io/evidencias-juridicas/`

> Se usar **outro nome de repositório**, ajuste `VITE_BASE` em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
> para `/NOME-DO-REPO/`.

---

## Como o compartilhamento funciona

- Em **Compartilhar**, o usuário gera um link com um **token** aleatório e um **QR code**.
- Qualquer pessoa com o link vê as evidências em **somente leitura**, sem precisar de conta.
- A leitura pública passa pela função `get_shared_archive` (SQL), que só devolve dados de tokens válidos.
- O usuário pode **revogar** um link a qualquer momento.

## Estrutura

```
src/
  auth/            Contexto de autenticação (sessão do usuário)
  components/      UI, Layout, captura de mídia, visualizador, rota protegida
  lib/             Cliente Supabase e camadas de dados (evidências, mídia, share)
  pages/           Login, cadastro, recuperar/nova senha, conta,
                   dashboard, editor/detalhe de evidência, compartilhar, view público
supabase/schema.sql  Schema + RLS + Storage + função de compartilhamento
.github/workflows/   Deploy automático no GitHub Pages
```

## Observações de segurança (MVP)

- O bucket de mídia é **público para leitura** (necessário para o link compartilhado exibir as mídias).
  Os caminhos dos arquivos usam UUID (não-adivinháveis), mas quem tiver a URL direta de um arquivo consegue abri-lo.
  Para um nível mais alto de sigilo, é possível evoluir para **URLs assinadas** (signed URLs) com expiração.
- Todo o resto (listar/criar/editar/excluir) é protegido por **RLS**: cada usuário só acessa o que é dele.
