# Origem das amostras locais

Captura em **23/11/2026**, pela API comunitária https://ghibliapi.vercel.app/.

Os arquivos preservam campos selecionados das respostas reais: `id`, `title`, `original_title`, `director`, `producer`, `release_date`, `running_time` e `rt_score`. São amostras para praticar, não uma nova resposta do serviço nem um backend implementado neste repositório.

| Filme | Endpoint consultado | Resultado da conferência |
| --- | --- | --- |
| Castle in the Sky | https://ghibliapi.vercel.app/films/2baf70d1-42bb-4437-b551-e5fed5a87abe | HTTP 200 |
| Grave of the Fireflies, ID corrigido | https://ghibliapi.vercel.app/films/12cfb892-aac0-4c5b-94af-521852e46d6a | HTTP 200 |
| My Neighbor Totoro | https://ghibliapi.vercel.app/films/58611129-2dbc-4a81-a72f-77ddfc1b1b49 | HTTP 200 |
| ID original com erro de digitação | https://ghibliapi.vercel.app/films/12cfb892-0ac0-4c5b-94af-521852e46d6a | HTTP 404, corpo `{}` |

O catálogo https://ghibliapi.vercel.app/films confirmou o ID corrigido de Grave of the Fireflies. O erro está no segundo bloco: `0ac0` no material, `aac0` no catálogo.

Não há arquivo local para o ID incorreto. Com o servidor HTTP estático recomendado, esse caminho também retorna 404 e permite repetir a comparação entre `all` e `allSettled` sem depender do serviço externo.
