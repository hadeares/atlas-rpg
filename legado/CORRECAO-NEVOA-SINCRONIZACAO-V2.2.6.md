# Atlas das Cinzas v2.2.6

## Névoa de guerra sem revelar o formato do mapa

A visão de jogador não recebe mais os hexágonos desconhecidos. Isso impede que o contorno, o raio e a largura total da campanha sejam deduzidos pela grade escura.

Para jogadores, a API também oculta:

- seed da campanha;
- raio do mapa;
- quantidade total de hexágonos;
- coordenadas e dados de hexágonos desconhecidos.

Uma tentativa de consultar diretamente um hexágono desconhecido retorna que ele ainda não é conhecido pelo grupo.

## Visão do mestre

O mestre continua vendo toda a região para administrar a campanha:

- hexágonos nunca percorridos aparecem em cinza;
- hexágonos atravessados aparecem com o terreno revelado e contorno claro;
- hexágonos explorados ou mapeados recebem contorno dourado;
- a posição do grupo continua marcada em azul.

## Atualização automática dos jogadores

A tela dos jogadores verifica uma rota leve de estado a cada 1,5 segundo. Enquanto a campanha não muda, somente alguns campos pequenos são transferidos.

Quando o mestre move o grupo, explora um local, avança o período ou altera a descoberta de um hexágono, a versão da campanha muda. A tela do jogador então:

- atualiza dia e período;
- atualiza a posição do grupo;
- baixa novamente apenas o resumo dos hexágonos conhecidos;
- abre automaticamente o hexágono atual;
- centraliza o mapa na nova posição.

Ao retornar para uma aba que estava em segundo plano, a verificação acontece imediatamente.

## Banco de dados

Nenhuma migração ou recriação do banco é necessária. Campanhas existentes funcionam com a nova regra.
