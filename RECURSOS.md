# Recursos para buscar múltiplos filmes com Promises

**Aula: Buscando múltiplos filmes com Promise.all e Promise.allSettled — API Studio Ghibli.**

**Conferência: 23/11/2026.** Os níveis indicados abaixo são sugestões de estudo. Conhecer arrays, funções, objetos e uma requisição simples com `fetch` ajuda a acompanhar a prática.

## Documentação e API da prática

| Fonte e links consultados | Idioma | Nível sugerido | Por que é útil |
| --- | --- | --- | --- |
| [Studio Ghibli API — documentação do projeto comunitário](https://ghibliapi.vercel.app/) | Inglês | Iniciante com noções de HTTP | Apresenta os recursos do serviço e as consultas por ID. A documentação informa que as consultas dispensam autenticação e apresenta um exemplo de `GET /films/{id}`. |
| MDN — [Promise.all em português](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) e [em inglês](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) | Português e inglês | Intermediário inicial | Confira a agregação de várias buscas: a Promise resultante cumpre com os valores quando todas cumprem e rejeita na primeira rejeição. O array de resultados mantém a ordem das entradas. |
| MDN — [Promise.allSettled em português](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) e [em inglês](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) | Português e inglês | Intermediário inicial | Explica como aguardar todos os desfechos e obter um objeto de resultado para cada busca. A versão em inglês ajuda a conferir a diferença entre rejeitar o resultado agregado e acompanhar falhas individuais. |
| [MDN — Usando Fetch](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API/Using_Fetch) | Português, com alguns trechos em inglês | Iniciante a intermediário | Explica as requisições e a leitura da resposta. Confira `response.ok`: um status HTTP 404 não faz o `fetch` rejeitar automaticamente a Promise. |

A API usada neste exercício é um projeto comunitário sobre os filmes do Studio Ghibli. Sua documentação descreve esse serviço; este repositório registra o estudo do código consumidor. Para a prática, bastam campos de identificação e apresentação, como `id`, `title`, `director` e `release_date`, sem reproduzir sinopses extensas.

## IDs fornecidos, correção e resultado da conferência

Estas foram as respostas observadas em consultas HTTPS ao serviço na data acima:

| ID e consulta | Resultado observado | Uso no estudo |
| --- | --- | --- |
| [2baf70d1-42bb-4437-b551-e5fed5a87abe](https://ghibliapi.vercel.app/films/2baf70d1-42bb-4437-b551-e5fed5a87abe) | HTTP 200 — `Castle in the Sky` | Consulta de sucesso. |
| [12cfb892-0ac0-4c5b-94af-521852e46d6a](https://ghibliapi.vercel.app/films/12cfb892-0ac0-4c5b-94af-521852e46d6a) | HTTP 404 — corpo `{}` | Permite observar uma falha HTTP entre as buscas. Não deve ser tratado como um filme válido com título preenchido. |
| [12cfb892-aac0-4c5b-94af-521852e46d6a](https://ghibliapi.vercel.app/films/12cfb892-aac0-4c5b-94af-521852e46d6a) — ID corrigido | HTTP 200 — `Grave of the Fireflies` | Consulta de sucesso ao filme pretendido, confirmado no catálogo e na consulta individual. |
| [58611129-2dbc-4a81-a72f-77ddfc1b1b49](https://ghibliapi.vercel.app/films/58611129-2dbc-4a81-a72f-77ddfc1b1b49) | HTTP 200 — `My Neighbor Totoro` | Consulta de sucesso. |

O [catálogo de filmes](https://ghibliapi.vercel.app/films) e a consulta individual confirmaram o ID correto de `Grave of the Fireflies`: o segundo grupo do UUID é `aac0`, em vez do `0ac0` enviado originalmente. Essa correção mantém o mesmo filme pretendido.

Em `config.js`, `IDS_ORIGINAIS` preserva os valores recebidos e `IDS_VERIFICADOS` contém o ID corrigido, usado por padrão. A opção da demonstração para reproduzir o erro original permite comparar o caso com três buscas de sucesso e o caso com uma falha HTTP. As capturas dos três filmes e a data de verificação estão descritas em [dados/README.md](./dados/README.md).

O resultado acima registra consultas em 23/11/2026; a execução permite observar a resposta atual do serviço.

## O que observar nos resultados

- Antes de ler e usar os dados, confira `response.ok`. Se o status não representar sucesso, lance um erro na função de busca para que a Promise daquela tarefa rejeite.
- Com `Promise.all`, uma rejeição faz o resultado agregado rejeitar. Isso não cancela as outras requisições já iniciadas, conforme a [referência em inglês](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).
- Com `Promise.allSettled`, cada posição contém `status: 'fulfilled'` com `value`, ou `status: 'rejected'` com `reason`. Assim, a aplicação pode apresentar os filmes obtidos e informar qual busca falhou.
- Um HTTP 200 com dados inesperados também precisa ser tratado pelo código consumidor: confira se o objeto contém os campos necessários antes de exibi-lo.

## Canais em português

Estes links levam aos próprios canais. As recomendações específicas relacionadas ao assunto estão na tabela de aulas abaixo.

| Canal | Idioma | Nível sugerido | Como aproveitar |
| --- | --- | --- | --- |
| [Hashtag Dev](https://www.youtube.com/channel/UCOp4xQHR-g_xJKSI9F3bGcw) | Português | Iniciante a intermediário | Reforce primeiro a requisição individual e o tratamento de Promises antes de combinar várias consultas. |
| [Edu Pretel Desenvolvimento](https://www.youtube.com/@edupreteldesenvolvimento) | Português | Intermediário inicial; varia conforme a série | O canal é indicado na descrição da própria aula de `Promise.all` abaixo. Use essa aula como complemento sobre agregação e rejeição. |

## Videoaulas específicas verificadas

| Aula e canal | Idioma | Nível sugerido | Relação com esta prática |
| --- | --- | --- | --- |
| [Aprenda Fetch API em 12 Minutos (com Exemplos Práticos)](https://www.youtube.com/watch?v=CisMh-qrd5c) — Hashtag Dev | Português | Iniciante com noções de funções | O conteúdo indexado inclui `fetch`, Promises, `.json()`, `response.ok` e tratamento de erros. Ajuda a preparar a função que consulta um filme. |
| [Aprenda Promises em JavaScript em 12 Minutos (de Forma Simples!)](https://www.youtube.com/watch?v=Diaw04CJiAU) — Hashtag Dev | Português | Iniciante com noções de funções | Reforça sucesso e falha com `resolve` e `reject`, além de `.then()` e `.catch()`. É uma base para entender o resultado de cada busca. |
| [56:Promise all - Como rodar várias tarefas ao mesmo tempo no JS](https://www.youtube.com/watch?v=xs4XzJZrN0o) — Edu Pretel Desenvolvimento, Cursos de TI | Português | Intermediário inicial | Apresenta arrays de Promises, leitura dos resultados e tratamento da primeira rejeição. Compare com a documentação de `allSettled` para analisar todos os desfechos. |

A abertura direta das páginas de vídeo falhou na ferramenta; títulos, autores e URLs foram conferidos pelos metadados do YouTube na busca, sem teste de reprodução.

## Roteiro de estudo

1. Abra a documentação comunitária e identifique a URL-base, a rota `/films/{id}` e os campos necessários para apresentar um filme.
2. Consulte um ID de sucesso com `fetch`, confira o status HTTP e leia o JSON. Compare o ID original de `Grave of the Fireflies`, com `0ac0`, ao ID corrigido, com `aac0`, e observe a diferença entre HTTP 404 e HTTP 200.
3. Organize a consulta em uma função assíncrona que retorne os dados necessários e lance um erro quando a resposta HTTP ou os dados forem inadequados.
4. Transforme o array de IDs em um array de Promises chamando a função de busca para cada ID. Aguarde com `Promise.all` e observe o resultado agregado.
5. Repita usando `Promise.allSettled`. Associe cada posição ao ID de entrada, apresente os sucessos e examine o motivo da falha individual.
6. Registre quando faz sentido exigir o sucesso de todas as buscas e quando a interface deve aproveitar resultados parciais. Compare também a ordem em que as respostas chegam com a ordem das entradas.
