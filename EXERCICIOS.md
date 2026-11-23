# Exercícios — buscando filmes com Promises

São seis exercícios progressivos e um desafio final. Vamos buscar dados, reconhecer uma falha real de identificação e comparar `Promise.all()` com `Promise.allSettled()`.

## Preparação

Abra a demonstração pelo servidor HTTP indicado no README e use o **Console** das ferramentas de desenvolvimento do navegador. Não abra por `file://` nem execute os blocos diretamente no Node.js.

**Recarregue a página antes de cada exercício** e espere a execução terminar antes de iniciar outro. Copie cada bloco completo, incluindo as chaves `{ ... }`, que mantêm as declarações locais separadas.

As soluções executam uma função assíncrona imediatamente: `(async () => { ... })()`. O Console pode mostrar `Promise {<pending>}` ou outro resultado do bloco; aguarde os `console.log()` indicados.

Todos os exercícios usam **amostras locais servidas por HTTP**, sem consultar a API externa. As amostras foram obtidas da API; a origem e a captura estão documentadas no README. Ler esses arquivos não equivale a fazer uma nova consulta ao serviço público.

O helper `buscarFilme()` usa a API pública por padrão. Por isso, **todas as chamadas abaixo passam `{ origem: 'local' }` explicitamente**. As soluções não adicionam listeners nem alteram a interface.

### O detalhe dos IDs

A página disponibiliza duas listas:

- `IDS_ORIGINAIS`: os três IDs recebidos inicialmente. O segundo está incorreto.
- `IDS_VERIFICADOS`: os três IDs após conferência no catálogo, com o segundo corrigido.

Para **Grave of the Fireflies**, a diferença é:

| Lista | ID |
| --- | --- |
| Original, incorreto | `12cfb892-0ac0-4c5b-94af-521852e46d6a` |
| Verificado, correto | `12cfb892-aac0-4c5b-94af-521852e46d6a` |

O trecho `0ac0` foi corrigido para `aac0`. O arquivo local do ID errado não existe; com o servidor recomendado, sua leitura retorna HTTP 404. Não criamos um filme falso para fazer esse caso parecer bem-sucedido.

Os três filmes verificados, na ordem das listas, são **Castle in the Sky**, **Grave of the Fireflies** e **My Neighbor Totoro**.

## 1. Básico — buscar um filme local e acessar seus dados

**Objetivo:** aguardar uma busca antes de acessar o objeto retornado.

1. Pegue o primeiro ID de `IDS_VERIFICADOS`.
2. Busque o filme usando a origem local.
3. Confira o título e a correspondência entre o ID solicitado e o recebido.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const id = IDS_VERIFICADOS[0];
    const filme = await buscarFilme(id, { origem: 'local' });

    console.log(filme.title); // Castle in the Sky
    console.log(filme.id === id); // true
    console.log(typeof filme.title); // string
  })();
}
```

`buscarFilme()` retorna uma Promise. O `await` permite receber o objeto do filme antes de acessar `title` e `id`.

Dentro do helper, a leitura tem etapas diferentes: obter a resposta HTTP, verificar `response.ok`, interpretar o JSON e conferir o contrato mínimo dos dados. Um status HTTP de sucesso não garante, sozinho, JSON válido nem um objeto de filme com o ID esperado.

Se a solução falhar inesperadamente, confira o servidor HTTP, a pasta da página e a presença das amostras locais. Não troque silenciosamente a origem para esconder a falha.

</details>

## 2. Básico — comparar o ID original com o corrigido

**Objetivo:** distinguir um identificador incorreto de um problema com Promises.

1. Compare o segundo ID das duas listas.
2. Busque o ID original e trate o erro.
3. Consulte o nome e o status numérico do erro.
4. Busque o ID corrigido e confira o título.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const idOriginal = IDS_ORIGINAIS[1];
    const idCorrigido = IDS_VERIFICADOS[1];

    console.log(idOriginal === idCorrigido); // false
    console.log(idOriginal); // 12cfb892-0ac0-4c5b-94af-521852e46d6a
    console.log(idCorrigido); // 12cfb892-aac0-4c5b-94af-521852e46d6a

    try {
      await buscarFilme(idOriginal, { origem: 'local' });
      console.log('Inesperado: o arquivo do ID errado foi encontrado.');
    } catch (erro) {
      console.log(erro.name); // ErroHTTP
      console.log(erro.status); // 404
      console.log(typeof erro.status); // number
    }

    const filme = await buscarFilme(idCorrigido, { origem: 'local' });
    console.log(filme.title); // Grave of the Fireflies
    console.log(filme.id === idCorrigido); // true
  })();
}
```

Com o servidor recomendado, o arquivo ausente responde com HTTP 404. `fetch()` não rejeita automaticamente apenas por receber esse status; o helper verifica `response.ok` e lança um erro chamado `ErroHTTP`.

O `catch` trata a primeira falha, permitindo continuar a comparação com o ID corrigido. Não alteramos os arrays globais: escolhemos explicitamente qual identificador consultar.

Neste exercício, os status se referem ao servidor local. O comportamento observado na API externa e a correção do ID estão documentados no README.

</details>

## 3. Intermediário — criar um conjunto e aguardar com all

**Objetivo:** iniciar três buscas e preservar a ordem de entrada nos resultados.

1. Use `map()` sobre `IDS_VERIFICADOS` para obter um array de Promises.
2. Confira a quantidade de tarefas e seu tipo.
3. Aguarde o conjunto com `Promise.all()`.
4. Exiba os títulos e confirme a correspondência de cada posição com seu ID original.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const tarefas = IDS_VERIFICADOS.map((id) => {
      return buscarFilme(id, { origem: 'local' });
    });

    console.log(tarefas.length); // 3
    console.log(tarefas.every((tarefa) => tarefa instanceof Promise)); // true

    const filmes = await Promise.all(tarefas);

    console.log(filmes.map((filme) => filme.title).join(' | '));
    // Castle in the Sky | Grave of the Fireflies | My Neighbor Totoro

    console.log(filmes.every((filme, indice) => filme.id === IDS_VERIFICADOS[indice]));
    // true
  })();
}
```

As chamadas a `buscarFilme()` dentro de `map()` iniciam as operações. `Promise.all()` recebe as Promises que já foram criadas; ele não é o responsável por iniciar as requisições.

O `return` no callback de `map()` coloca cada Promise no array `tarefas`. Sem ele, esse callback retornaria `undefined` e o conjunto não representaria as buscas que queremos acompanhar.

Mesmo que as respostas terminem em outra ordem, o array entregue por `all()` mantém a ordem de entrada. Não usamos duração exata nem ordem de conclusão como condição do teste.

</details>

## 4. Intermediário — observar a falha de all e esperar o restante

**Objetivo:** entender que a rejeição do conjunto não cancela as demais buscas.

1. Crie as tarefas a partir de `IDS_ORIGINAIS`, incluindo o ID incorreto.
2. Aguarde `Promise.all()` e trate a falha HTTP 404.
3. Em `finally`, aguarde as mesmas tarefas com `Promise.allSettled()`.
4. Confira que as outras duas buscas puderam terminar com sucesso.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const tarefas = IDS_ORIGINAIS.map((id) => {
      return buscarFilme(id, { origem: 'local' });
    });

    try {
      const filmes = await Promise.all(tarefas);
      console.log('Inesperado: o conjunto inteiro concluiu.', filmes.length);
    } catch (erro) {
      console.log(erro.name); // ErroHTTP
      console.log(erro.status); // 404
      console.log('A rejeição de all foi tratada.');
    } finally {
      const finais = await Promise.allSettled(tarefas);
      console.log(finais.map((item) => item.status).join(' | '));
      // fulfilled | rejected | fulfilled
      console.log('Todas as tarefas foram acompanhadas até o fim.');
    }
  })();
}
```

`Promise.all()` rejeita quando observa a primeira rejeição. Isso não cancela as outras Promises nem desfaz seus resultados. A ausência de um array completo de filmes nesse fluxo não significa que todas as buscas falharam.

Em arquivos locais, as respostas podem ser muito rápidas: algumas tarefas talvez já tenham terminado quando o `catch` executar. Não dependemos dessa ordem de término para conferir o comportamento.

O `allSettled()` de `finally` acompanha **as mesmas Promises**, sem iniciar novas buscas. Essa espera adicional não muda a semântica de `all()`; apenas impede que o experimento termine deixando tarefas sem acompanhamento.

</details>

## 5. Avançado neste tema — associar cada resultado ao ID solicitado

**Objetivo:** ler corretamente o formato dos registros de `allSettled()`.

1. Busque os três IDs originais com `Promise.allSettled()`.
2. Acrescente a cada registro o ID da mesma posição no array de entrada.
3. Confira os estados na ordem original.
4. Nos sucessos, confira o ID do filme; na falha, confira o ID solicitado e seu erro.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const tarefas = IDS_ORIGINAIS.map((id) => {
      return buscarFilme(id, { origem: 'local' });
    });
    const resultados = await Promise.allSettled(tarefas);

    const associados = resultados.map((resultado, indice) => {
      return { idSolicitado: IDS_ORIGINAIS[indice], ...resultado };
    });

    console.log(associados.map((item) => item.status).join(' | '));
    // fulfilled | rejected | fulfilled

    console.log(associados[0].idSolicitado === associados[0].value.id); // true
    console.log(associados[1].idSolicitado); // 12cfb892-0ac0-4c5b-94af-521852e46d6a
    console.log(associados[1].reason.name); // ErroHTTP
    console.log(associados[1].reason.status); // 404
    console.log(associados[2].idSolicitado === associados[2].value.id); // true
  })();
}
```

`allSettled()` retorna registros na ordem de entrada. Um sucesso tem `{ status: 'fulfilled', value }`; uma falha tem `{ status: 'rejected', reason }`.

Usamos `...resultado` para copiar essas propriedades e acrescentamos `idSolicitado`. Isso permite identificar a tentativa mesmo quando não há objeto de filme no resultado.

Não tente ler `.value.title` em um registro rejeitado. Verifique primeiro `status` e use `reason` para investigar a falha. Uma Promise rejeitada não se transforma em filme apenas porque entrou no relatório de `allSettled()`.

</details>

## 6. Avançado neste tema — separar sucessos parciais e falhas

**Objetivo:** aproveitar os filmes recebidos sem esconder qual busca falhou.

1. Busque os IDs originais e mantenha a associação por ID.
2. Separe os filmes bem-sucedidos em um array.
3. Separe as falhas em outro array, com ID e erro original.
4. Confira dois sucessos, uma falha e os títulos disponíveis.

<details>
<summary>Ver solução, resultados e explicação</summary>

```js
{
  (async () => {
    const resultados = await Promise.allSettled(
      IDS_ORIGINAIS.map((id) => buscarFilme(id, { origem: 'local' }))
    );

    const associados = resultados.map((resultado, indice) => {
      return { idSolicitado: IDS_ORIGINAIS[indice], ...resultado };
    });

    const filmes = associados
      .filter((item) => item.status === 'fulfilled')
      .map((item) => item.value);

    const falhas = associados
      .filter((item) => item.status === 'rejected')
      .map((item) => ({ id: item.idSolicitado, erro: item.reason }));

    console.log(filmes.length); // 2
    console.log(falhas.length); // 1
    console.log(filmes.map((filme) => filme.title).join(' | '));
    // Castle in the Sky | My Neighbor Totoro

    console.log(falhas[0].id === IDS_ORIGINAIS[1]); // true
    console.log(falhas[0].erro.name); // ErroHTTP
    console.log(falhas[0].erro.status); // 404
    console.log(filmes.length + falhas.length === IDS_ORIGINAIS.length); // true
  })();
}
```

`filter()` escolhe os registros de cada estado e `map()` extrai o que precisamos. Os sucessos continuam na ordem relativa de entrada: primeiro Castle in the Sky, depois My Neighbor Totoro.

Guardar `{ id, erro }` nas falhas permite explicar o problema e, em outro fluxo, tentar novamente somente os IDs necessários. Não substituímos a falha por um objeto com título fictício.

Exibir dois filmes e uma mensagem de falha é uma decisão da aplicação. O relatório preserva as informações para que essa decisão seja explícita, em vez de sugerir que três filmes foram carregados.

</details>

## Desafio final — criar um relatório de carregamento reutilizável

**Objetivo:** criar `carregarFilmes(ids)` para acompanhar todas as tentativas e retornar um resumo confiável.

A função deve:

1. Usar somente a origem local.
2. Iniciar uma busca por ID e aguardar `Promise.allSettled()`.
3. Retornar `resultados`, com ID solicitado e registro de cada tentativa na ordem de entrada.
4. Retornar `sucessos`, contendo os filmes disponíveis, e `falhas`, contendo ID e erro de cada tentativa rejeitada.
5. Informar `total`, a quantidade de IDs solicitados.
6. Preservar o array recebido e tratar corretamente uma entrada vazia.

Teste estes casos:

| Entrada | Total | Sucessos | Falhas |
| --- | --- | --- | --- |
| `IDS_ORIGINAIS` | 3 | 2 | 1 |
| `IDS_VERIFICADOS` | 3 | 3 | 0 |
| `[]` | 0 | 0 | 0 |

<details>
<summary>Ver uma solução completa e explicada</summary>

```js
{
  (async () => {
    async function carregarFilmes(ids) {
      const idsSolicitados = [...ids];
      const tarefas = idsSolicitados.map((id) => {
        return buscarFilme(id, { origem: 'local' });
      });

      const finais = await Promise.allSettled(tarefas);
      const resultados = finais.map((resultado, indice) => {
        return { idSolicitado: idsSolicitados[indice], ...resultado };
      });

      const sucessos = resultados
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value);

      const falhas = resultados
        .filter((item) => item.status === 'rejected')
        .map((item) => ({ id: item.idSolicitado, erro: item.reason }));

      return { resultados, sucessos, falhas, total: idsSolicitados.length };
    }

    const ordemOriginal = IDS_ORIGINAIS.join(' | ');
    const originais = await carregarFilmes(IDS_ORIGINAIS);

    console.log(originais.total); // 3
    console.log(originais.sucessos.length); // 2
    console.log(originais.falhas.length); // 1
    console.log(originais.falhas[0].id === IDS_ORIGINAIS[1]); // true
    console.log(originais.falhas[0].erro.status); // 404
    console.log(originais.resultados.every((item, indice) => {
      return item.idSolicitado === IDS_ORIGINAIS[indice];
    })); // true

    const verificados = await carregarFilmes(IDS_VERIFICADOS);
    console.log(verificados.total); // 3
    console.log(verificados.sucessos.length); // 3
    console.log(verificados.falhas.length); // 0
    console.log(verificados.sucessos.map((filme) => filme.title).join(' | '));
    // Castle in the Sky | Grave of the Fireflies | My Neighbor Totoro

    const vazio = await carregarFilmes([]);
    console.log(vazio.total); // 0
    console.log(vazio.resultados.length); // 0
    console.log(vazio.sucessos.length); // 0
    console.log(vazio.falhas.length); // 0

    console.log(IDS_ORIGINAIS.join(' | ') === ordemOriginal); // true
  })();
}
```

A cópia `[...ids]` fixa a lista de IDs desta chamada sem alterar o array recebido. As tarefas e seus resultados usam essa mesma sequência para manter a associação por posição.

`Promise.allSettled([])` produz um relatório vazio. Nenhuma busca é iniciada; os filtros e mapeamentos também retornam arrays vazios, permitindo tratar esse caso sem um filme fictício ou uma falha inventada.

O relatório completo preserva os status; os arrays separados facilitam a apresentação dos filmes e dos problemas. As falhas mantêm os objetos de erro originais, em vez de guardar apenas um texto genérico.

Não acrescentamos `.catch(() => ({ title: 'Indisponível' }))` às buscas. Isso recuperaria a rejeição com um objeto aparentemente bem-sucedido e faria a contagem deixar de representar os resultados reais.

Os testes são sequenciais apenas para organizar a conferência dos três cenários. Dentro de cada chamada a `carregarFilmes()`, as buscas são iniciadas pelo `map()` antes de aguardar o conjunto.

</details>
