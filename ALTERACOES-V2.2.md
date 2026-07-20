# Alterações da v2.2

## Encontros

- gerador manual e secreto por hexágono;
- nenhum encontro automático ao avançar o tempo;
- categorias, intensidade, combate e relação com a lore configuráveis;
- histórico persistente;
- estados de rascunho até conclusão;
- texto público e conteúdo secreto separados;
- ficha completa das criaturas;
- exclusão protegida para encontros ativos.

## Criaturas

- nova tabela `creature_templates`;
- sincronização em segundo plano do catálogo SRD;
- catálogo-base offline;
- geração procedural padrão, aleatória, cósmica e infectada;
- seleção por nome, tipo e ND;
- criatura-base opcional para variantes cósmicas ou infectadas;
- criação de ficha personalizada;
- importação em lote de até 1.000 fichas JSON.

## Simulação

- passagem do tempo sem mudanças globais agressivas;
- clima local gradual;
- efeitos temporários;
- encontros apenas quando solicitados pelo mestre.

## Interface

- aba Encontros apenas para mestres;
- configuração completa em uma tela;
- sincronização do catálogo;
- ficha visual;
- copiar texto de narração;
- criação e importação de criaturas personalizadas.

## Compatibilidade

- mantém campanhas e usuários da v2.1 ao conectar no mesmo PostgreSQL;
- TypeORM cria as estruturas novas com `DB_SYNCHRONIZE=true`;
- nenhum volume precisa ser apagado.
