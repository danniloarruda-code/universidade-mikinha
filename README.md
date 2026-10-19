# Universidade da Mikinha

Jogo de matemática da Mikinha para o 3º e o 4º ano. Funciona no navegador e pode ser instalado como app (PWA).

## Rodar no computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173).

## Publicar

Todo `git push` na branch `main` publica sozinho no GitHub Pages, pelo workflow em `.github/workflows/deploy.yml`.

## Como o código está organizado

- `index.html`: telas do jogo (título, mapa, loja, trilha, professor, fase).
- `src/game.js`: o jogo (as ilhas, a dificuldade adaptativa e as telas).
- `src/storage.js`: onde o progresso é salvo. O jogo só fala com este módulo, então o salvamento na nuvem entra aqui sem mexer no jogo.
- `src/cloud.js`: salvamento na nuvem (Firebase). O pai ou a mãe entra com Google no Modo professor e o progresso fica em `familias/{uid}/perfis/mikinha`. A cópia mais nova sempre vence.
- `src/firebase-config.js`: configuração pública do projeto Firebase (não é segredo).
- `firestore.rules`: regras de segurança do banco. Cada conta só lê e grava os próprios dados. Se mudar este arquivo, cole o conteúdo novo na aba Regras do Firestore no console do Firebase.
- `src/main.js`: ponto de entrada; liga o app instalável (service worker) e carrega a nuvem.
- `public/`: ícones do app.

## Modo de teste

Abra com `#debug` no fim do endereço para expor o estado do jogo em `window.__g` (usado nos testes automáticos).
