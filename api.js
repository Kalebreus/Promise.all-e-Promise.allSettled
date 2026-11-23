// Uma consulta individual. A composição com all/allSettled acontece no chamador.
async function buscarFilme(id, opcoes = {}) {
  const origem = opcoes.origem === undefined ? 'api' : opcoes.origem;
  const limiteMs = opcoes.limiteMs === undefined ? 8000 : opcoes.limiteMs;

  if (typeof id !== 'string' || id.trim() === '') {
    throw new TypeError('O ID do filme precisa ser uma string não vazia.');
  }
  if (origem !== 'api' && origem !== 'local') {
    throw new TypeError('Use origem api ou local.');
  }
  if (!Number.isFinite(limiteMs) || limiteMs <= 0) {
    throw new RangeError('O limite precisa ser um número positivo em milissegundos.');
  }

  const url = origem === 'local'
    ? './dados/' + encodeURIComponent(id) + '.json'
    : BASE_API + encodeURIComponent(id);

  // Cada filme tem seu próprio controlador e seu próprio prazo.
  const controlador = new AbortController();
  let prazoVencido = false;
  const timer = setTimeout(function () {
    prazoVencido = true;
    controlador.abort();
  }, limiteMs);

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controlador.signal
    });

    if (!resposta.ok) {
      const erro = new Error('A consulta do filme retornou HTTP ' + resposta.status + '.');
      erro.name = 'ErroHTTP';
      erro.status = resposta.status;
      throw erro;
    }

    const filme = await resposta.json();
    if (filme === null || typeof filme !== 'object' || Array.isArray(filme) ||
        filme.id !== id || typeof filme.title !== 'string' || filme.title.trim() === '') {
      const erro = new Error('A resposta não contém o ID e o título esperados para o filme.');
      erro.name = 'ErroContrato';
      throw erro;
    }

    return filme;
  } catch (erro) {
    if (prazoVencido && erro.name === 'AbortError') {
      const timeout = new Error('A consulta excedeu o limite de ' + limiteMs + ' ms.');
      timeout.name = 'TimeoutError';
      timeout.filmeId = id;
      throw timeout;
    }

    // Propriedade adicionada pelo helper para identificar a consulta que falhou.
    erro.filmeId = id;
    throw erro;
  } finally {
    clearTimeout(timer);
  }
}
