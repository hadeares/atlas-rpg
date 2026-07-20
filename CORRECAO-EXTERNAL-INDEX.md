# Correção incluída

Esta distribuição contém a correção do erro:

`DataTypeNotSupportedError: Data type "Object" in "CreatureTemplate.externalIndex" is not supported by "postgres" database.`

O campo `externalIndex` agora possui o tipo PostgreSQL `varchar(180)` declarado explicitamente.
