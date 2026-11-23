# Buscando múltiplos filmes com Promise.all e Promise.allSettled (API Studio Ghibli)

Esta aula independente usa a **API comunitária Studio Ghibli** para aprender a buscar filmes e combinar consultas, tanto no sucesso total quanto na falha parcial.

O projeto usa HTML e JavaScript, sem instalação de pacotes. A origem padrão é a API ao vivo, mas as requisições só começam após um clique. Um modo explícito com três amostras locais permite repetir os exercícios sem depender do serviço externo.

Depois do guia, avance para [exercícios com soluções](./EXERCICIOS.md) e [documentação, sites e canais](./RECURSOS.md).

## 1. A base para acompanhar a aula

Noções usadas nesta aula:

- **Objeto:** reúne dados, como `{ id: '...', title: 'My Neighbor Totoro' }`. `filme.title` acessa uma propriedade.
- **Array:** mantém uma sequência, como uma lista de IDs. Os índices começam em zero.
- **Função:** reúne instruções e pode devolver um resultado com `return`.
- **`map()`:** chama uma função para cada item e cria outro array com os valores retornados.
- **Promise:** representa o resultado futuro de uma operação. Começa pendente (`pending`) e pode cumprir (`fulfilled`) ou rejeitar (`rejected`).
- **`async` e `await`:** uma função `async` sempre retorna uma Promise. Dentro dela, `await` aguarda seu resultado; uma rejeição pode ser tratada com `try/catch`.

Enquanto a função espera uma consulta em `await`, o navegador pode atender outros eventos. Código pesado ainda pode bloquear a página: aqui estudamos espera por operações de entrada e saída.

## 2. Executar a demonstração

Tenha **Python 3** e um navegador atual instalados. No terminal, entre na pasta que contém `index.html` e execute:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Se o Python 3 estiver disponível como `python`, use:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abra **http://127.0.0.1:8000** e mantenha o terminal aberto. Para encerrar o servidor, pressione `Ctrl+C` nesse terminal.

**Use HTTP; não abra `index.html` com um duplo clique por `file://`.** Até as amostras locais são lidas por `fetch()` e precisam ser servidas. O servidor entrega arquivos estáticos; este projeto não implementa um backend.

Abra as ferramentas de desenvolvimento do navegador, normalmente com `F12`. Use **Console** para os exemplos e **Network/Rede** para observar URL, status HTTP e duração. Os trechos abaixo são para o Console dessa página, não para executar diretamente no Node.js. Recarregue antes de cada exemplo e copie o bloco completo.

## 3. Conferir os dados antes de programar

O serviço usado é `https://ghibliapi.vercel.app/`, com consultas no formato `GET /films/{id}`. Em **23/11/2026**, a conferência por HTTPS identificou um erro de digitação no ID do segundo filme:

| Filme ou tentativa | ID | Resultado observado na API |
| --- | --- | --- |
| Castle in the Sky | `2baf70d1-42bb-4437-b551-e5fed5a87abe` | HTTP 200 |
| Grave of the Fireflies, original incorreto | `12cfb892-0ac0-4c5b-94af-521852e46d6a` | HTTP 404, corpo `{}` |
| Grave of the Fireflies, corrigido | `12cfb892-aac0-4c5b-94af-521852e46d6a` | HTTP 200 |
| My Neighbor Totoro | `58611129-2dbc-4a81-a72f-77ddfc1b1b49` | HTTP 200 |

O catálogo `/films` confirmou **`aac0` no lugar de `0ac0`**. Esse registro descreve a conferência nessa data; a rede e o serviço podem apresentar outros resultados no futuro.

Em `config.js`, `IDS_ORIGINAIS` preserva exatamente a lista recebida. `IDS_VERIFICADOS` contém a correção e é a lista padrão da página. A caixa **“Reproduzir o ID incorreto da aula”** permite comparar o caso de falha.

As amostras em `dados/` preservam apenas campos selecionados das respostas reais. O modo local não consulta a API externa e não contém arquivo para o ID incorreto: com o servidor recomendado, essa tentativa retorna 404. Leia a [origem das amostras](./dados/README.md). Uma falha da API **não é substituída automaticamente** por uma amostra local.

## 4. Começar com uma consulta individual

A função `buscarFilme(id, opcoes)` de `api.js` faz uma consulta. Seu fluxo é:

1. Validar os argumentos e escolher a URL da API ou do arquivo local.
2. Aguardar `fetch(url, ...)`, que fornece um objeto `Response`.
3. Conferir `resposta.ok`. Um HTTP 404 não faz o `fetch()` rejeitar automaticamente; o helper lança `ErroHTTP` nesse caso.
4. Aguardar `resposta.json()`, que transforma o corpo JSON em um valor JavaScript.
5. Conferir se recebeu um objeto com o `id` solicitado e um `title` não vazio. Se não, lançar `ErroContrato`.
6. Executar `return filme`, cumprindo a Promise com esse objeto.

Experimente a primeira busca usando explicitamente a origem local:

```js
{
  (async () => {
    try {
      const filme = await buscarFilme(IDS_VERIFICADOS[0], { origem: 'local' });
      console.log(filme.title); // Castle in the Sky
      console.log(filme.id === IDS_VERIFICADOS[0]); // true
    } catch (erro) {
      console.error(erro.name, erro.message);
    }
  })();
}
```

O Console pode mostrar uma Promise pendente antes das mensagens. A função assíncrona imediatamente executada permite usar `await`; as chaves externas separam as declarações deste experimento.

Sem a opção `origem`, o helper usa a **API ao vivo**. Por isso, todos os exemplos de código deste guia passam `{ origem: 'local' }`. Para explorar a rede externa, escolha API ao vivo na interface.

## 5. Buscar o conjunto com Promise.all

Exemplo:

```js
{
  (async () => {
    const tarefas = IDS_VERIFICADOS.map((id) => {
      return buscarFilme(id, { origem: 'local' });
    });

    try {
      const filmes = await Promise.all(tarefas);
      console.log(filmes.map((filme) => filme.title));
      // ['Castle in the Sky', 'Grave of the Fireflies', 'My Neighbor Totoro']
    } catch (erro) {
      console.error(erro.name, erro.message);
    } finally {
      await Promise.allSettled(tarefas);
    }
  })();
}
```

**As chamadas dentro de `map()` iniciam as buscas.** `Promise.all()` recebe as Promises já criadas e acompanha o conjunto. O `return` do callback coloca cada Promise no array `tarefas`; esquecê-lo faz esse callback devolver `undefined`.

As consultas independentes podem ficar em andamento ao mesmo tempo: é concorrência de entrada e saída, sem executar cálculos JavaScript em paralelo em vários núcleos.

Se todas cumprirem, `all()` cumpre com um array de filmes **na ordem dos IDs de entrada**, mesmo que as respostas terminem em outra ordem. Se uma rejeitar, o agregado rejeita ao observar essa rejeição: é o comportamento chamado de *fail-fast*.

Troque `IDS_VERIFICADOS` por `IDS_ORIGINAIS` para incluir o ID incorreto. O `catch` recebe o erro HTTP 404, mas isso **não cancela** as outras consultas nem significa que todas falharam. O `finally` acompanha as mesmas tarefas com `allSettled()` até o fim, sem iniciar novas requisições e sem alterar quando `all()` rejeitou.

## 6. Aproveitar resultados parciais com Promise.allSettled

Quando cada resultado é útil, acompanhe todos os desfechos:

```js
{
  (async () => {
    const ids = IDS_ORIGINAIS;
    const tarefas = ids.map((id) => buscarFilme(id, { origem: 'local' }));
    const resultados = await Promise.allSettled(tarefas);

    const resumo = resultados.map((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        return { id: ids[indice], status: resultado.status, titulo: resultado.value.title };
      }
      return { id: ids[indice], status: resultado.status, erro: resultado.reason.message };
    });

    console.table(resumo);
    // Estados na ordem de entrada: fulfilled, rejected, fulfilled.
  })();
}
```

O array contém um registro por entrada:

- Sucesso: `{ status: 'fulfilled', value: filme }`.
- Falha: `{ status: 'rejected', reason: erro }`.

Confira `status` antes de acessar `value`. O vínculo `ids[indice]` identifica a consulta mesmo quando não existe um filme no resultado. Não use simplesmente `JSON.stringify(erro)` para explicar uma falha: propriedades como `message` normalmente não aparecem nessa serialização. Extraia `erro.message`, como no exemplo.

`allSettled()` não transforma uma busca rejeitada em sucesso; sua Promise agregada cumpre com o relatório depois que todas as entradas terminam. Essa distinção permite exibir dois filmes e informar a terceira tentativa malsucedida.

## 7. Comparar os cenários na interface

Selecione **amostras locais** e siga esta sequência:

| Cenário | Ação | Comportamento esperado desta página |
| --- | --- | --- |
| IDs verificados | Buscar um filme | Exibe o filme selecionado. |
| IDs verificados | Buscar com `Promise.all` | Exibe os três filmes. |
| IDs verificados | Buscar com `Promise.allSettled` | Exibe os três filmes e três registros de sucesso. |
| ID incorreto marcado | Buscar com `Promise.all` | Informa a rejeição; não exibe cartões. |
| ID incorreto marcado | Buscar com `Promise.allSettled` | Exibe dois filmes e informa uma falha. |

**Não exibir cartões quando `all()` falha é uma decisão desta interface**, não uma obrigação da API ou das Promises. No `finally`, a página aguarda todas as tarefas, atualiza o relatório final e libera os controles; no modo `all`, mantém os cartões vazios após uma rejeição.

Observe o registro de execução e experimente **“Interagir durante a consulta”**. Na origem local, as respostas podem terminar rápido demais para perceber a espera. Evite concluir que a ordem de término é fixa. Depois compare os mesmos cenários com a API ao vivo, observando as respostas atuais no painel Network.

## 8. Entender as falhas e o tempo limite

Cada chamada tem um `AbortController` e um limite próprio de **8000 ms** por padrão. Ao vencer o prazo, o helper aborta aquela consulta e apresenta `TimeoutError`; o temporizador é limpo no `finally`. Isso é diferente de `Promise.all()` cancelar o lote: ele não faz esse cancelamento.

Na interface, o limite varia de 100 a 30000 ms. Um valor pequeno não garante timeout.

| Erro | O que investigar |
| --- | --- |
| `ErroHTTP` | O status, disponível em `erro.status`, como 404. |
| `ErroContrato` | JSON recebido sem o ID ou título esperado. |
| `SyntaxError` | Corpo que não pôde ser interpretado como JSON. |
| `TypeError` na consulta | Conexão, URL, CORS ou outras restrições; não atribua toda falha de rede a CORS. |
| `TimeoutError` | Prazo da consulta excedido. |

O helper também valida seus argumentos antes da requisição. A interface apresenta campos retornados pela API usando `textContent`, para tratá-los como texto ao construir os cartões.

## 9. Praticar e avançar

Em [EXERCICIOS.md](./EXERCICIOS.md), há seis exercícios e um desafio final, com soluções e resultados esperados: da consulta individual até uma função que separa sucessos e falhas preservando ordem e IDs.

Use [RECURSOS.md](./RECURSOS.md) para consultar a documentação e escolher sites e canais reais. Como apoio opcional, desenhe no Excalidraw três linhas de tempo: início, cumprimento/rejeição e momento em que o agregado termina. Se usar IA, peça: “Explique por que `Promise.all` não cancela outras consultas e me faça uma pergunta antes de mostrar a solução”. Confira a resposta no código e na documentação.

## Arquivos do estudo

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` e `styles.css` | Estrutura, controles e apresentação da demonstração. |
| `config.js` | IDs originais, verificados e URL-base. |
| `api.js` | Consulta individual, validação, erros e timeout. |
| `index.js` | Combinação das Promises, estados da interface e relatório. |
| `dados/*.json` | Três amostras: Castle in the Sky, Grave of the Fireflies e My Neighbor Totoro. |
| [dados/README.md](./dados/README.md) | Origem, campos preservados e conferência dos IDs. |
| [EXERCICIOS.md](./EXERCICIOS.md) e [RECURSOS.md](./RECURSOS.md) | Prática com soluções e fontes para continuar estudando. |

O HTML carrega `config.js`, `api.js` e `index.js` nessa ordem, com `defer`, disponibilizando configurações e helper antes de conectar os botões.

## Verificação do material

No Chromium, foram conferidos os cenários locais de consulta individual, três sucessos, falha do ID original e exibição parcial. Também foram executadas as sete soluções dos exercícios. Respostas controladas permitiram verificar a rejeição antecipada de `all` sem cancelamento das demais consultas, o timeout, JSON inválido e dados fora do contrato.

As consultas HTTPS reais pelo cliente do terminal confirmaram HTTP 200 para os três IDs verificados e HTTP 404 para o ID original incorreto. No Chromium deste ambiente, as consultas externas foram limitadas por `ERR_CERT_AUTHORITY_INVALID`; os testes controlados da interface não são apresentados como uma execução completa da API ao vivo nesse navegador. A interface mantém essa falha visível e permite escolher explicitamente as amostras locais.
