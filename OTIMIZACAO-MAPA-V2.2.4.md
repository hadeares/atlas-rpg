# Otimização do mapa v2.2.4

A v2.2.4 foi criada para campanhas grandes, especialmente mapas de raio 20 ou superior.

## Mudanças principais

### Canvas no lugar de milhares de elementos SVG

O mapa agora utiliza um único elemento Canvas. Hexágonos, contornos, marcadores e símbolos são desenhados diretamente no contexto 2D.

Durante zoom e arraste:

- o React não atualiza estado a cada movimento do ponteiro;
- o desenho é limitado por `requestAnimationFrame`;
- somente os hexágonos dentro da área visível são desenhados;
- detalhes são removidos automaticamente quando os hexágonos ficam pequenos;
- a resolução interna é limitada a no máximo 2x a densidade da tela.

### Consulta compacta do mapa

A API não carrega mais o campo JSON completo de lore para todos os hexágonos. A consulta seleciona somente:

- coordenadas;
- terreno e bioma;
- estado de descoberta;
- valores básicos do mapa;
- nome público;
- existência de lore;
- quantidade de visitas;
- última visita.

A lore completa continua persistida no PostgreSQL e é carregada apenas quando um hexágono é selecionado.

### Cache de fichas abertas

Depois que a ficha completa de um hexágono é carregada, ela fica no cache da sessão. Voltar ao mesmo hexágono não realiza outra requisição, salvo quando ele é atualizado.

### Compressão HTTP

Respostas maiores que 1 KB são comprimidas pela API.

## Medição com raio 20

Teste usando 1.261 hexágonos com lore completa:

- JSON completo das lores: aproximadamente 24,76 MB;
- resumo do mapa: aproximadamente 376,1 KB;
- resumo comprimido: aproximadamente 26,6 KB;
- redução antes da compressão: 98,52%.

A medida representa os dados serializados de uma campanha gerada para teste. O tamanho real pode variar conforme edições feitas pelo mestre.

## Arquivos alterados

- `apps/web/components/hex-map.tsx`;
- `apps/web/components/campaign-view.tsx`;
- `apps/web/app/globals.css`;
- `apps/api/src/hexes/hexes.service.ts`;
- `apps/api/src/main.ts`;
- arquivos de dependências e versões.
