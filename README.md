# AppFisio

Um sistema completo para fisioterapeutas gerenciarem pacientes, exercícios e rotinas de tratamento.

## 🚀 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express, Prisma ORM
- **Banco de Dados**: SQLite (ou o configurado no `.env`)

## 📂 Estrutura do Projeto

- `/frontend`: Interface do usuário, estilos e scripts do lado do cliente.
- `/backend`: API, modelos de dados (Prisma) e lógica do servidor.

## 🛠️ Como rodar o projeto

### Backend
1. Entre na pasta `backend`: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env`
4. Execute as migrações: `npx prisma migrate dev`
5. Inicie o servidor: `npm start` (ou `node src/index.js`)

### Frontend
Basta abrir o arquivo `frontend/pages/intro/primeira_pagina.html` no seu navegador ou usar uma extensão como Live Server.

---
*Desenvolvido para facilitar o acompanhamento fisioterapêutico.*
