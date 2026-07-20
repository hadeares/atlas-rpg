# Atlas das Cinzas v2.2.9 — Bíblia exclusiva do mestre

Correção incremental para a v2.2.8.

## Alteração principal

A Bíblia da campanha foi completamente fechada para usuários com função `PLAYER`.

A resposta da API para jogadores não contém mais:

- `worldBible`;
- `solarDecayStage`;
- premissa central completa;
- identidade do arquimago;
- nome e intenção do experimento;
- funcionamento do portal;
- Devorador de Sóis;
- estágios futuros;
- âncoras;
- regiões narrativas globais;
- facções globais;
- relíquias;
- atos da campanha;
- verdades e cronologia do mestre.

O fechamento acontece no backend. Portanto, os dados não ficam apenas escondidos visualmente: eles não são enviados ao navegador do jogador.

## Interface

- a aba `BÍBLIA` existe somente para mestres;
- o botão `Abrir Bíblia da campanha` continua exclusivo do mestre;
- caso uma sessão seja alterada de mestre para jogador enquanto a aba está aberta, a interface volta automaticamente para `RESUMO`;
- a Bíblia do mestre continua mostrando todo o material público e secreto.

## O que os jogadores continuam vendo

Jogadores continuam recebendo apenas informações descobertas durante a campanha:

- hexágonos conhecidos;
- lore pública conforme o nível de exploração;
- rumores revelados;
- locais encontrados;
- criaturas identificadas;
- posição do grupo;
- dia e período atuais.

## Banco e instalação

A correção não altera banco, usuários, campanhas, `.env` ou dependências.
