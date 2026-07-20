# Atlas das Cinzas v2.2.3

## Correções

- A seleção do mapa não depende mais do evento `click` do SVG.
- Um clique curto seleciona o hexágono no `pointerup`.
- Arrastar acima de quatro pixels movimenta o mapa sem trocar a seleção.
- Respostas antigas de carregamento não podem sobrescrever uma seleção mais recente.
- A travessia funciona mesmo quando não existe encontro aleatório automático.
- O painel usa “Travessia concluída” quando `visit.encounter` não está presente.
- Clima e visibilidade são exibidos somente quando recebidos.

## Névoa de guerra

- Campanhas novas começam apenas com o hexágono inicial mapeado.
- Todos os demais hexágonos começam desconhecidos.
- Mover o grupo revela somente o hexágono de destino como atravessado.
- Hexágonos vizinhos não são mais marcados como avistados.
- Na primeira inicialização, hexágonos avistados automaticamente e nunca visitados retornam para desconhecido.
- Hexágonos atravessados, explorados, mapeados e o ponto inicial são preservados.
- A API continua removendo terreno, lore e segredos dos hexágonos desconhecidos para jogadores.

## Arte do mapa

O mapa recebeu ilustrações vetoriais leves para:

- planícies;
- florestas;
- florestas densas;
- colinas;
- montanhas;
- pântanos;
- regiões alagadas;
- ruínas;
- campos devastados;
- regiões contaminadas.

As artes são SVG incorporado, não precisam de internet e não adicionam arquivos pesados. Na visão do jogador, nenhuma arte aparece em hexágonos desconhecidos.
