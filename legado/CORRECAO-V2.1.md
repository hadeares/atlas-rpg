# Atlas das Cinzas v2.1

Esta atualização corrige a listagem de campanhas no PostgreSQL e esclarece o cadastro de usuários.

## Alterações

- Corrigida a consulta que causava `membership.id must appear in the GROUP BY clause`.
- Cadastro público renomeado para conta de usuário.
- Toda conta padrão pode ser jogador ou mestre dependendo da campanha.
- Quem cria uma campanha torna-se mestre somente nela.
- O primeiro cadastro da instalação continua sendo administrador.
- Textos do painel administrativo foram ajustados para separar perfil global e função da campanha.
