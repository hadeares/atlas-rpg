# Atlas das Cinzas v2.2.4

Sistema web para campanhas de D&D 5e com exploração hexagonal, sobrevivência, horror cósmico, lore persistente e ferramentas secretas do mestre.

## Otimização extrema do mapa na v2.2.4

A renderização SVG foi substituída por Canvas 2D. O mapa não cria mais milhares de elementos no DOM e não provoca re-renderizações do React durante o arraste.

A API também deixou de carregar a lore completa de todos os hexágonos para montar o mapa. Em um teste com raio 20, o conteúdo serializado caiu de aproximadamente 24,76 MB para 376,1 KB antes da compressão e cerca de 26,6 KB após compressão HTTP. A lore completa é carregada apenas no clique e fica em cache durante a sessão.

Outras otimizações:

- desenho limitado por `requestAnimationFrame`;
- descarte de hexágonos fora da tela;
- nível de detalhe automático conforme o zoom;
- cache das fichas de hexágono já abertas;
- limite de densidade do Canvas para evitar uso excessivo de GPU;
- compressão das respostas da API.

Consulte `OTIMIZACAO-MAPA-V2.2.4.md` para os detalhes técnicos.

## Novidade principal da v2.2

A versão 2.2 adiciona um gerador manual de encontros que não interfere automaticamente na passagem do tempo. O mestre escolhe quando gerar, preparar, ativar, concluir, ignorar ou excluir um encontro.

O encontro é criado usando o contexto do hexágono selecionado:

- terreno e bioma;
- período atual;
- clima local;
- perigo e influência cósmica;
- lore, rumores, monstros e horror do hexágono;
- tamanho e nível médio do grupo;
- tipo, intensidade e preferência de combate escolhidos pelo mestre.

## Criaturas

O sistema possui três fontes de criaturas:

### Catálogo SRD

Na primeira inicialização, a API tenta sincronizar em segundo plano as criaturas disponíveis no banco SRD 5e da API pública configurada. A sincronização não bloqueia o uso do projeto.

- fichas mecânicas completas;
- busca por nome, tipo e ND;
- CA, PV, atributos, deslocamentos, resistências e imunidades;
- habilidades, ações, reações e ações lendárias quando disponíveis;
- descrição adaptada para uso na campanha;
- texto de aparição para narrar;
- comportamento, táticas, sinais e recompensas sugeridas.

### Criaturas originais

O Atlas gera criaturas originais compatíveis com o hexágono e com o ND escolhido.

Modos disponíveis:

- padrão;
- aleatória;
- cósmica;
- infectada.

### Criaturas personalizadas

O mestre pode:

- cadastrar uma criatura por JSON;
- importar até 1.000 fichas em um catálogo JSON;
- selecionar uma criatura personalizada em encontros;
- utilizar uma ficha existente como base para uma variante cósmica ou infectada.

Use somente material que você tenha autorização para importar.

## Limite do conteúdo oficial

O projeto inclui e sincroniza conteúdo mecânico disponibilizado no SRD. Criaturas proprietárias que não fazem parte do SRD não são distribuídas pelo projeto. Elas podem ser cadastradas manualmente pelo mestre caso ele possua autorização para usar esses dados.

## Gerador de encontros

O mestre encontra a aba **Encontros** ao selecionar um hexágono.

É possível configurar:

- encontro completamente aleatório;
- criatura;
- monstro;
- horror;
- social;
- viajante;
- facção;
- descoberta;
- vestígio;
- perigo natural;
- clima;
- recurso;
- ruína;
- rumor;
- consequência.

Também é possível escolher:

- intensidade;
- chance de combate;
- relação com a lore;
- origem da criatura;
- criatura-base opcional;
- quantidade de criaturas;
- ND desejado;
- nível médio do grupo;
- tamanho do grupo;
- orientação livre do mestre.

## Conteúdo gerado no encontro

Cada encontro pode conter:

- título;
- texto pronto para narrar;
- resumo secreto do mestre;
- verdade da situação;
- objetivo e comportamento;
- sinais;
- pistas;
- testes sugeridos com CDs;
- complicações;
- formas de resolver sem combate;
- consequências;
- recompensas;
- conexão com a lore;
- avaliação de perigo;
- participantes;
- ficha completa de cada criatura.

## Privacidade do mestre

Todos os endpoints de encontros e catálogo exigem acesso de mestre na campanha.

Jogadores não recebem:

- encontros em rascunho ou preparados;
- fichas secretas;
- verdade do encontro;
- fraquezas;
- táticas;
- consequências futuras;
- histórico secreto.

O texto público pode ser copiado pelo mestre e narrado na mesa. Gerar um encontro não revela nada e não altera o mundo.

## Estados dos encontros

- Rascunho;
- Preparado;
- Ativo;
- Concluído;
- Ignorado;
- Cancelado.

Um encontro só entra em cena quando o mestre o ativa. Encontros ativos precisam ser concluídos ou cancelados antes de serem excluídos.

## Passagem do tempo

Os períodos oficiais são:

1. Manhã;
2. Tarde;
3. Anoitecer;
4. Noite.

Avançar o tempo não gera encontros automaticamente.

A passagem atualiza apenas:

- calendário;
- clima local gradual;
- efeitos temporários;
- eventos que o mestre programou;
- histórico da campanha.

O mundo não destrói assentamentos, movimenta monstros importantes ou espalha o horror sem ação explícita do mestre.

## Recursos existentes

- mapa hexagonal com zoom e arraste;
- campanhas com raio de 3 a 40;
- até 4.921 hexágonos;
- geração determinística por semente;
- lore persistente em todos os hexágonos;
- movimento do grupo;
- exploração e névoa de guerra;
- CRUD de campanhas;
- cadastro público de usuários;
- CRUD administrativo de usuários;
- membros por campanha como Mestre ou Jogador;
- visão escura do jogador;
- informações secretas filtradas pela API;
- edição e regeneração da lore;
- encontros secretos persistentes;
- catálogo de criaturas SRD, originais e personalizadas;
- variedade de bioma por terreno e deduplicação regional de nomes de marco/monstro;
- clima dinâmico da campanha visível na barra superior;
- filtro de mapa por perigo e bioma (mestre);
- colaboração em tempo real via WebSocket (substitui o polling para jogadores conectados);
- rolador de dados compartilhado com histórico ao vivo;
- rastreador de iniciativa/combate por encontro;
- log de sessão (histórico legível de eventos da campanha) para o mestre;
- exportação de hexágono em PDF via impressão do navegador;
- entrada em campanha por código de convite.

## Requisitos

- Node.js 22 recomendado;
- npm 10 ou superior;
- Docker Desktop.

## Instalação nova no Windows

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.local.example apps/web/.env.local
docker compose up -d postgres redis
npm run dev
```

Acesse:

```text
http://localhost:3000
```

Cadastro:

```text
http://localhost:3000/register
```

API:

```text
http://localhost:3333/api/health
```

## Configuração do banco

O PostgreSQL do Docker é publicado na porta 5433 para evitar conflito com instalações locais.

`apps/api/.env`:

```env
PORT=3333
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=troque-esta-chave-por-uma-chave-grande
JWT_EXPIRES_IN=7d
DB_HOST=127.0.0.1
DB_PORT=5433
DB_NAME=atlas_das_cinzas
DB_USER=atlas
DB_PASSWORD=atlas
DB_SYNCHRONIZE=true
REDIS_URL=redis://localhost:6379
SRD_API_BASE_URL=https://www.dnd5eapi.co
SRD_SYNC_ON_START=true
```

`docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

## Usar o banco existente da v2.1

1. Pare os processos Node da v2.1.
2. Não execute `docker compose down -v`.
3. Extraia a v2.2 em outra pasta.
4. Copie os arquivos `.env` da v2.1 ou configure a mesma conexão.
5. Mantenha os containers antigos ativos.
6. Execute `npm install` e `npm run dev` na v2.2.

Com `DB_SYNCHRONIZE=true`, o TypeORM cria as tabelas e colunas novas sem apagar campanhas anteriores. Faça um backup antes de atualizar um banco importante.

## Sincronizar o catálogo SRD

A sincronização ocorre automaticamente quando `SRD_SYNC_ON_START=true`.

Também pode ser iniciada pela aba **Encontros**, usando o botão **Sincronizar SRD**.

Caso a internet esteja indisponível:

- a API continua iniciando;
- o mapa e as campanhas funcionam;
- o gerador usa o catálogo original interno;
- a sincronização pode ser repetida depois.

## Formato para importar catálogo personalizado

```json
[
  {
    "name": "Nome da criatura",
    "statBlock": {
      "source": "CUSTOM",
      "theme": "STANDARD",
      "size": "Médio",
      "type": "Monstruosidade",
      "alignment": "Sem alinhamento",
      "armorClass": 13,
      "hitPoints": 30,
      "hitDice": "4d8 + 12",
      "speed": { "walk": "9 m" },
      "abilities": { "str": 14, "dex": 12, "con": 16, "int": 6, "wis": 12, "cha": 7 },
      "savingThrows": {},
      "skills": {},
      "damageVulnerabilities": [],
      "damageResistances": [],
      "damageImmunities": [],
      "conditionImmunities": [],
      "senses": ["visão no escuro 18 m"],
      "languages": ["—"],
      "challengeRating": 2,
      "challengeLabel": "2",
      "experiencePoints": 450,
      "proficiencyBonus": 2,
      "traits": [],
      "actions": [],
      "bonusActions": [],
      "reactions": [],
      "legendaryActions": [],
      "description": "Descrição da criatura.",
      "narration": "Texto pronto para narrar.",
      "signs": ["rastros recentes"],
      "behavior": "Defende território.",
      "tactics": "Embosca alvos isolados.",
      "weakness": "Luz forte.",
      "rewards": ["componentes raros"]
    }
  }
]
```

## Comandos

```powershell
npm run dev
npm run build
npm run db:up
npm run db:down
npm run db:logs
```

## Validação da entrega

A versão foi validada com:

- build de produção do NestJS;
- build de produção do Next.js;
- verificação TypeScript;
- geração de criaturas padrão, aleatórias, cósmicas e infectadas;
- fichas com CA, PV, ações e narração;
- proteção das rotas por função de mestre.

## Atualização v2.2.3

Esta versão corrige a seleção e a travessia no mapa, altera a névoa de guerra para revelar somente o hexágono visitado e adiciona ilustrações vetoriais por terreno.

### Regra de descoberta

- O ponto inicial começa mapeado.
- Todos os outros hexágonos começam desconhecidos.
- A travessia marca somente o destino como atravessado.
- Explorar o hexágono atual o marca como explorado.
- O sistema não revela automaticamente os seis vizinhos.
- Jogadores não recebem os dados secretos de regiões desconhecidas.

### Visual do mapa

As ilustrações de floresta, montanha, colina, água, pântano, ruínas e corrupção são desenhadas em SVG no próprio mapa. Elas funcionam offline e acompanham o zoom.

## Deploy em produção

A recomendação é hospedar o **web** (Next.js) na Vercel e a **API** (NestJS + Postgres + Redis) em um servidor separado com Docker.

### Web na Vercel

1. Importe o repositório na Vercel apontando o **Root Directory** para `apps/web`.
2. Defina a variável de ambiente `NEXT_PUBLIC_API_URL` (por ambiente: Preview e Production) apontando para a URL pública da API, por exemplo `https://api.seu-dominio.com/api`.
3. Build command e output ficam com o padrão do Next.js (`next build`), sem necessidade de configuração adicional.

### API em servidor com Docker

O `apps/api/Dockerfile` é multi-stage e deve ser buildado a partir da **raiz do monorepo** (porque a API faz parte de um workspace npm):

```powershell
docker build -f apps/api/Dockerfile -t atlas-api .
```

Para subir API + Postgres + Redis juntos em um servidor (VPS, por exemplo), use o `docker-compose.prod.yml`:

```powershell
Copy-Item .env.prod.example .env.prod
# edite .env.prod com WEB_ORIGIN (domínio da Vercel), JWT_SECRET forte e senha do banco
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Isso inicia o Postgres e o Redis apenas na rede interna do compose (não expostos ao host) e publica a API na porta `3333`. Coloque um proxy reverso (Nginx, Caddy, Traefik) na frente para TLS e o domínio público.

A API expõe um WebSocket (`/realtime`, usado pela colaboração em tempo real e pelo rolador de dados). Garanta que o proxy reverso repasse os cabeçalhos `Upgrade`/`Connection` para essa rota (em Nginx, `proxy_set_header Upgrade $http_upgrade;` e `proxy_set_header Connection "upgrade";`); a maioria dos PaaS já suporta isso nativamente.

No boot, a API roda as migrations automaticamente (`DB_RUN_MIGRATIONS=true` já configurado no compose de produção). Para produção **não** use `DB_SYNCHRONIZE=true` — o schema é controlado por migrations versionadas em `apps/api/src/database/migrations`.

### Migrations do banco

```powershell
npm run migration:generate   # gera uma nova migration comparando entidades x banco
npm run migration:run        # aplica migrations pendentes
```

Ambos os scripts usam `apps/api/src/database/data-source.ts`, que lê as mesmas variáveis `DB_*` do `.env`.

### CI

O workflow `.github/workflows/ci.yml` roda `npm ci`, `lint`, `typecheck` e `build` das duas apps em cada push/PR para `main`.

### Checklist antes de publicar

- `JWT_SECRET` real e forte (a API recusa subir em `NODE_ENV=production` com o valor de exemplo ou chaves curtas).
- `WEB_ORIGIN` na API apontando para o domínio exato da Vercel (CORS).
- `DB_SYNCHRONIZE=false` e migrations aplicadas.
- `npm run lint`, `npm run typecheck` e `npm run build` passando localmente antes do deploy.
