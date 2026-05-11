# 🎓 UniPlanner — Backend + Frontend

Planner universitário completo com Node.js, MongoDB e frontend integrado.

## 📁 Estrutura

```
uniplanner/
├── config/
│   └── db.js                 # Conexão MongoDB
├── controllers/
│   ├── taskController.js     # CRUD completo de tarefas
│   ├── subjectController.js  # CRUD de matérias
│   └── eventController.js    # CRUD de eventos
├── models/
│   ├── Task.js
│   ├── Subject.js
│   └── Event.js
├── routes/
│   ├── taskRoutes.js
│   ├── subjectRoutes.js
│   └── eventRoutes.js
├── services/
│   └── priorityService.js    # Cálculo de prioridade das tarefas
├── public/
│   └── index.html            # Frontend completo
├── server.js
├── package.json
└── .env.example
```

## ⚙️ Configuração

1. Crie um arquivo `.env` baseado no `.env.example`:
```env
MONGO_URI=mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/uniplanner?retryWrites=true&w=majority
PORT=3001
```

2. Instale as dependências:
```bash
npm install
```

3. Rode o projeto:
```bash
npm start        # produção
npm run dev      # desenvolvimento com nodemon
```

4. Acesse: http://localhost:3001

## 🔗 Rotas da API

### Tasks
| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/tasks` | Lista tarefas (com prioridade) |
| GET | `/api/tasks?completed=false` | Filtra pendentes |
| POST | `/api/tasks` | Cria tarefa |
| PUT | `/api/tasks/:id` | Edita tarefa |
| PUT | `/api/tasks/:id/complete` | Marca como concluída |
| DELETE | `/api/tasks/:id` | Deleta tarefa |

### Subjects
| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/subjects` | Lista matérias |
| POST | `/api/subjects` | Cria matéria |
| PUT | `/api/subjects/:id` | Edita matéria |
| DELETE | `/api/subjects/:id` | Deleta matéria |

### Events
| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/events` | Lista eventos |
| POST | `/api/events` | Cria evento |
| PUT | `/api/events/:id` | Edita evento |
| DELETE | `/api/events/:id` | Deleta evento |

## 📦 Body dos endpoints

### POST /api/tasks
```json
{
  "title": "Trabalho de Cálculo",
  "description": "Capítulos 3 e 4",
  "dueDate": "2025-06-10T23:59:00",
  "difficulty": 4,
  "subject": "<id_da_materia>"
}
```

### POST /api/subjects
```json
{
  "name": "Cálculo II",
  "teacher": "Prof. Silva",
  "schedule": "Seg/Qua 10h",
  "color": "#7c6fef"
}
```

### POST /api/events
```json
{
  "title": "Prova de Física",
  "date": "2025-06-15",
  "time": "14:00",
  "type": "prova",
  "description": "Capítulos 1-5"
}
```

## 🔒 MongoDB Atlas

1. Crie uma conta em https://cloud.mongodb.com
2. Crie um cluster gratuito (M0)
3. Em **Database Access**: crie um usuário com senha
4. Em **Network Access**: adicione seu IP (ou `0.0.0.0/0` para liberar tudo)
5. Em **Connect**: copie a connection string e cole no `.env`

## 🔔 Notificações

### Email (Nodemailer + Gmail)
1. Ative "Senhas de app" na sua conta Google (myaccount.google.com → Segurança → Senhas de app)
2. Adicione no `.env`:
```
EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx   # Senha de app gerada pelo Google
EMAIL_TO=destinatario@gmail.com
```

### Web Push (VAPID)
1. Gere as chaves rodando:
```bash
node -e "const wp=require('web-push'); wp.generateVAPIDKeys().then(k=>console.log(k))"
```
2. Adicione no `.env`:
```
VAPID_PUBLIC_KEY=chave_publica_aqui
VAPID_PRIVATE_KEY=chave_privada_aqui
VAPID_EMAIL=mailto:seuemail@gmail.com
```
3. No app, vá em **Perfil → Notificações → Ativar Push**

### Cron Jobs automáticos
- **08:00 todo dia** — verifica tarefas vencendo em 24h e envia email + push
- **Toda hora** — push se alguma tarefa vence em 1h
- **Segunda às 07:00** — envia resumo semanal por email

### Rotas de teste
```
POST /api/notifications/test-email     → testa email de alerta
POST /api/notifications/test-weekly    → testa resumo semanal
POST /api/notifications/test-push      → testa push notification
```
