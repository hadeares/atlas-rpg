# Migração para a versão 2

## Método recomendado

Extraia o projeto v2 em uma nova pasta e copie apenas seus arquivos de ambiente:

```powershell
Copy-Item "C:\caminho\projeto-antigo\apps\api\.env" ".\apps\api\.env"
Copy-Item "C:\caminho\projeto-antigo\apps\web\.env.local" ".\apps\web\.env.local"
```

No `.env`, use:

```env
DB_HOST=127.0.0.1
DB_PORT=5433
```

Depois:

```powershell
npm install
docker compose up -d postgres redis
npm run dev
```

O banco será atualizado automaticamente porque `DB_SYNCHRONIZE=true`.

## Sessão

A chave local mudou para `atlas-session-v2`. Faça login novamente.
