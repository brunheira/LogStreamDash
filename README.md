# RedisWatch 🔍

Um aplicativo web moderno e elegante para monitoramento e gerenciamento de logs Redis com interface sofisticada em tons de azul.

![RedisWatch](https://img.shields.io/badge/RedisWatch-v1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Powered-blue.svg)

## 🚀 Funcionalidades

### Dashboard de Logs
- **Visualização em tempo real** dos logs armazenados em instâncias Redis
- **Filtros avançados** por:
  - Intervalo de datas (com datepicker intuitivo)
  - Nível de log (error, warning, info, debug)
  - Serviços específicos
  - Busca textual em mensagens
- **Paginação inteligente** para grandes volumes de dados
- **Destaque visual** para diferentes níveis de log
- **Estatísticas em tempo real** (total de logs, erros 24h, warnings, taxa de sucesso)

### Gestão de Conexões Redis
- **CRUD completo** de conexões Redis
- **Teste de conectividade** em tempo real
- **Status visual** das conexões (conectado, conectando, erro)
- **Armazenamento seguro** de credenciais

### Interface Moderna
- **Tema escuro/claro** com alternância suave
- **Design responsivo** para desktop e mobile
- **Componentes shadcn/ui** com alta qualidade
- **Navegação intuitiva** entre seções
- **Feedback visual** em todas as interações

## 🛠️ Stack Tecnológica

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Banco de dados**: PostgreSQL com Drizzle ORM
- **UI**: TailwindCSS + shadcn/ui
- **Validação**: Zod
- **Estado**: TanStack Query
- **Roteamento**: Wouter

## 📋 Pré-requisitos

- Node.js 20+
- PostgreSQL 12+
- Redis (para as conexões que você vai monitorar)

## 🔧 Configuração do Projeto

### 1. Clone e instalação
```bash
git clone <repository-url>
cd rediswatch
npm install
```

### 2. Configuração do Banco de Dados

#### PostgreSQL
1. **Crie um banco PostgreSQL** ou use um serviço cloud (Supabase, Neon, etc.)
2. **Configure as variáveis de ambiente**:
```bash
# Crie um arquivo .env na raiz do projeto
DATABASE_URL="postgresql://usuario:senha@localhost:5432/rediswatch"
PGHOST="localhost"
PGPORT="5432"
PGUSER="seu_usuario"
PGPASSWORD="sua_senha"
PGDATABASE="rediswatch"
```

#### Executar migrações
```bash
# Aplicar o schema do banco
npm run db:push
```

### 3. Executar o projeto
```bash
# Desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:5000`

## 📊 Estrutura do Banco de Dados

### Tabela: `redis_connections`
```sql
CREATE TABLE redis_connections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port TEXT NOT NULL DEFAULT '6379',
  password TEXT,
  database TEXT DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_connected TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `logs`
```sql
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  connection_id TEXT NOT NULL,
  level TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSON
);
```

## 🔌 Configuração do Redis

### Instalar Redis localmente
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS
brew install redis

# Iniciar Redis
redis-server
```

### Configuração Redis para logs
Para que o RedisWatch monitore seus logs Redis, você precisará:

1. **Configurar sua aplicação** para enviar logs para o Redis
2. **Usar as conexões configuradas** no RedisWatch para acessar essas instâncias
3. **Implementar a coleta de logs** via API do RedisWatch

#### Exemplo de integração:
```javascript
// Exemplo de como enviar logs para a API do RedisWatch
const sendLogToRedisWatch = async (logData) => {
  await fetch('http://localhost:5000/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connectionId: '1', // ID da conexão Redis no RedisWatch
      level: 'error',    // error, warning, info, debug
      service: 'api-gateway',
      message: 'Descrição do log',
      metadata: { requestId: 'req_123', ip: '192.168.1.1' }
    })
  });
};
```

## 🚀 Deploy

### Variáveis de ambiente para produção
```bash
DATABASE_URL="sua_url_postgresql_producao"
NODE_ENV="production"
PORT="5000"
```

### Deploy em plataformas cloud
- **Vercel**: Configure as variáveis de ambiente no dashboard
- **Railway**: Conecte o repositório e configure as envs
- **Heroku**: Use Heroku Postgres e configure as variáveis

## 📱 Uso da Aplicação

### 1. Configurar conexões Redis
1. Acesse a seção "Conexões Redis"
2. Clique em "Nova Conexão"
3. Preencha os dados (host, porta, senha se necessário)
4. Teste a conexão
5. Salve

### 2. Monitorar logs
1. No Dashboard, visualize logs em tempo real
2. Use os filtros para encontrar logs específicos:
   - **Data**: Selecione um período específico
   - **Nível**: Filtre por error, warning, info, debug
   - **Serviço**: Escolha um serviço específico
   - **Busca**: Digite termos para buscar nas mensagens

### 3. Alternar temas
- Clique no ícone de sol/lua no cabeçalho
- Escolha entre: Claro, Escuro, ou Sistema

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Aplicar mudanças no schema do banco
npm run db:push

# Gerar migrações
npm run db:generate

# Executar em produção
npm start
```

## 🐛 Solução de Problemas

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais na `DATABASE_URL`
- Teste a conexão diretamente com `psql`

### Erro de conexão com Redis
- Verifique se o Redis está acessível no host/porta configurados
- Teste com `redis-cli -h host -p porta ping`
- Confirme se a senha está correta (se necessária)

### Logs não aparecem
- Verifique se a aplicação está enviando logs para a API
- Confirme se o `connectionId` nos logs corresponde ao ID da conexão

## 📝 API Endpoints

### Conexões Redis
- `GET /api/connections` - Listar todas as conexões
- `POST /api/connections` - Criar nova conexão
- `PUT /api/connections/:id` - Atualizar conexão
- `DELETE /api/connections/:id` - Remover conexão
- `POST /api/connections/:id/test` - Testar conexão

### Logs
- `GET /api/logs` - Listar logs (com filtros e paginação)
- `POST /api/logs` - Criar novo log
- `GET /api/logs/stats` - Estatísticas dos logs

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) pela biblioteca de componentes
- [Drizzle ORM](https://orm.drizzle.team/) pelo ORM TypeScript
- [Lucide React](https://lucide.dev/) pelos ícones elegantes
- [TailwindCSS](https://tailwindcss.com/) pelo framework CSS

---

Desenvolvido com ❤️ para monitoramento eficiente de logs Redis