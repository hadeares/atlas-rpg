# Atlas das Cinzas — correção v2.2.7

## Lore procedural v4

- Mais marcos e rotas por terreno.
- Dez blocos de narração: aproximação, chegada, travessia, exploração, noite, acampamento, amanhecer, mau tempo, pós-conflito e descoberta do marco.
- Cinco detalhes visuais, cinco sonoros, quatro odores e quatro sensações táteis por hexágono.
- Sete características locais, cinco recursos, cinco espécies de flora, cinco de fauna, três ameaças, três NPCs, quatro lendas, seis rumores, seis encontros-base e seis pistas.
- Novos desafios de terreno, descobertas, cultura local, ganchos de aventura e padrões cósmicos.
- Separação de informações públicas e segredos do mestre mantida pela API.
- Hexágonos antigos são enriquecidos automaticamente para o schema v4 sem apagar títulos e textos editados manualmente.

## Gerador de encontros em modal

- O botão de encontro abre um modal central.
- O modo principal gera um monstro de horror cósmico personalizado.
- Seleção de nível 1 a 20, quantidade, intensidade, possibilidade de combate, arquétipo e origem.
- Opção de salvar a criatura gerada no catálogo da campanha.
- O encontro permanece secreto e não altera o tempo ou o mundo ao ser gerado.

## Monstros cósmicos

Arquétipos:

- caçador furtivo;
- brutamontes;
- controlador;
- artilharia;
- enxame;
- entidade dominante.

Origens:

- Ferida;
- Vazio;
- Sonho;
- Cristal;
- Tempo;
- Parasita;
- Abismo.

Cada ficha pode conter:

- aparência modular completa;
- CA, PV, atributos, resistências e sentidos escalados pelo nível;
- ataques corpo a corpo e poderes de origem;
- ações bônus, reações e ações lendárias;
- fases de combate para ameaças elevadas;
- comportamento, táticas, fraqueza, sinais e recompensas;
- texto longo pronto para narração.

## Instalação

Extraia esta pasta dentro da raiz do projeto v2.2.6 e execute:

```powershell
PowerShell -ExecutionPolicy Bypass -File ".\atlas-correcao-v2.2.7-lore-horror-cosmico\aplicar-correcao-v2.2.7.ps1"
npm run dev
```

Não execute `docker compose down -v`.
