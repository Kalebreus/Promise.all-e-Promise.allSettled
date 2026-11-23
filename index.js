const origem = document.getElementById('origem');
const idOriginal = document.getElementById('id-original');
const filmeUnico = document.getElementById('filme-unico');
const campoLimite = document.getElementById('limite-ms');
const estadoBusca = document.getElementById('estado-busca');
const faseBusca = document.getElementById('fase-busca');
const listaFilmes = document.getElementById('lista-filmes');
const listaFalhas = document.getElementById('lista-falhas');
const relatorio = document.getElementById('relatorio');
const logConsultas = document.getElementById('log-consultas');
const botoesBusca = document.querySelectorAll('[data-metodo]');
let emExecucao = false;

function descreverErro(erro) {
  if (erro.name === 'ErroHTTP') return 'HTTP ' + erro.status + ': o filme não foi carregado.';
  if (erro.name === 'TimeoutError') return erro.message;
  if (erro.name === 'ErroContrato') return erro.message;
  if (erro instanceof SyntaxError) return 'O corpo da resposta não é JSON válido.';
  return 'Falha na consulta: ' + erro.message + '. Confira o painel Network do navegador.';
}

function bloquearControles(bloqueado) {
  botoesBusca.forEach(function (botao) { botao.disabled = bloqueado; });
  origem.disabled = bloqueado;
  idOriginal.disabled = bloqueado;
  filmeUnico.disabled = bloqueado;
  campoLimite.disabled = bloqueado;
  document.getElementById('painel-resultados').setAttribute('aria-busy', String(bloqueado));
}

function renderizarFilmes(filmes) {
  const fragmento = document.createDocumentFragment();
  filmes.forEach(function (filme) {
    const item = document.createElement('li');
    item.className = 'filme';
    const cartao = document.createElement('article');
    const titulo = document.createElement('h3');
    titulo.textContent = filme.title;
    const original = document.createElement('p');
    original.textContent = filme.original_title || 'Título original não informado';
    const direcao = document.createElement('p');
    direcao.textContent = 'Direção: ' + (filme.director || 'Não informada');
    const ano = document.createElement('p');
    ano.textContent = 'Ano: ' + (filme.release_date || 'Não informado');
    const id = document.createElement('p');
    id.textContent = 'ID: ' + filme.id;
    cartao.append(titulo, original, direcao, ano, id);
    item.append(cartao);
    fragmento.append(item);
  });
  listaFilmes.replaceChildren(fragmento);
  document.getElementById('qtd-filmes').textContent = filmes.length;
}

function renderizarFalhas(falhas) {
  const fragmento = document.createDocumentFragment();
  falhas.forEach(function (falha) {
    const item = document.createElement('li');
    item.textContent = 'ID ' + falha.id + ' — ' + descreverErro(falha.reason);
    fragmento.append(item);
  });
  listaFalhas.replaceChildren(fragmento);
  document.getElementById('qtd-falhas').textContent = falhas.length;
}

function mostrarRelatorio(resultados, ids) {
  const legiveis = resultados.map(function (resultado, indice) {
    if (resultado.status === 'fulfilled') {
      return { id: ids[indice], status: resultado.status, title: resultado.value.title };
    }
    return { id: ids[indice], status: resultado.status, reason: descreverErro(resultado.reason) };
  });
  relatorio.textContent = JSON.stringify(legiveis, null, 2);
}

async function executarBusca(metodo) {
  if (emExecucao) return;
  const limiteMs = Number(campoLimite.value);
  if (!Number.isFinite(limiteMs) || limiteMs < 100 || limiteMs > 30000) {
    estadoBusca.dataset.estado = 'error';
    estadoBusca.textContent = 'Escolha um limite entre 100 e 30000 ms.';
    return;
  }

  const todosIds = idOriginal.checked ? IDS_ORIGINAIS : IDS_VERIFICADOS;
  const ids = metodo === 'um' ? [todosIds[Number(filmeUnico.value)]] : todosIds.slice();
  const opcoes = { origem: origem.value, limiteMs: limiteMs };
  emExecucao = true;
  bloquearControles(true);
  renderizarFilmes([]);
  renderizarFalhas([]);
  logConsultas.replaceChildren();
  relatorio.textContent = '';
  estadoBusca.dataset.estado = 'loading';
  estadoBusca.textContent = 'Carregando a partir de: ' + (opcoes.origem === 'api' ? 'API ao vivo.' : 'amostras locais.');
  faseBusca.textContent = 'As consultas foram iniciadas.';
  const inicio = performance.now();

  function registrar(texto) {
    const item = document.createElement('li');
    item.textContent = Math.round(performance.now() - inicio) + ' ms — ' + texto;
    logConsultas.append(item);
  }

  // map chama o helper para cada ID e produz as Promises das consultas.
  const tarefas = ids.map(async function (id) {
    registrar('pending: ' + id);
    try {
      const filme = await buscarFilme(id, opcoes);
      registrar('fulfilled: ' + id);
      return filme;
    } catch (erro) {
      registrar('rejected: ' + id);
      // Propagar a rejeição preserva sua semântica em all e allSettled.
      throw erro;
    }
  });
  let rejeitou = false;

  try {
    if (metodo === 'allSettled') {
      const resultados = await Promise.allSettled(tarefas);
      const filmes = [];
      const falhas = [];
      resultados.forEach(function (resultado, indice) {
        if (resultado.status === 'fulfilled') filmes.push(resultado.value);
        else falhas.push({ id: ids[indice], reason: resultado.reason });
      });
      renderizarFilmes(filmes);
      renderizarFalhas(falhas);
      mostrarRelatorio(resultados, ids);
      estadoBusca.dataset.estado = falhas.length === 0 ? 'success' : (filmes.length > 0 ? 'partial' : 'error');
      estadoBusca.textContent = 'Relatório completo: ' + filmes.length + ' filmes carregados e ' + falhas.length + ' falhas.';
    } else {
      // A consulta individual usa await diretamente; o lote usa Promise.all.
      const filmes = metodo === 'um' ? [await tarefas[0]] : await Promise.all(tarefas);
      renderizarFilmes(filmes);
      mostrarRelatorio(filmes.map(function (filme) {
        return { status: 'fulfilled', value: filme };
      }), ids);
      estadoBusca.dataset.estado = 'success';
      estadoBusca.textContent = filmes.length + ' filmes carregados com sucesso.';
    }
    registrar('Resultado do método disponível.');
  } catch (erro) {
    rejeitou = true;
    estadoBusca.dataset.estado = 'error';
    estadoBusca.textContent = 'O conjunto rejeitou: ' + descreverErro(erro);
    renderizarFalhas([{ id: erro.filmeId, reason: erro }]);
    registrar('Rejeição observada. Consultas já iniciadas continuam.');
    faseBusca.textContent = 'Aguardando a conclusão das outras consultas antes de liberar os controles.';
  } finally {
    // Drena as consultas pendentes; não cancela nem adia a rejeição de all.
    const finais = await Promise.allSettled(tarefas);
    if (rejeitou) {
      const falhas = [];
      finais.forEach(function (resultado, indice) {
        if (resultado.status === 'rejected') falhas.push({ id: ids[indice], reason: resultado.reason });
      });
      renderizarFalhas(falhas);
      mostrarRelatorio(finais, ids);
      // Neste modo, a decisão da interface é não exibir cartões se o conjunto falhar.
    }
    registrar('Todas as consultas iniciadas terminaram.');
    faseBusca.textContent = 'Consultas finalizadas. Você pode comparar outro cenário.';
    emExecucao = false;
    bloquearControles(false);
  }
}

botoesBusca.forEach(function (botao) {
  botao.addEventListener('click', function (evento) {
    executarBusca(evento.currentTarget.dataset.metodo);
  });
});

origem.addEventListener('change', function () {
  document.getElementById('descricao-origem').textContent = origem.value === 'api'
    ? 'Consulta externa ao serviço ghibliapi.vercel.app. A disponibilidade depende da rede e do serviço.'
    : 'Leitura de arquivos estáticos capturados em 23/11/2026. Estes dados não são uma nova consulta à API.';
});

let interacoes = 0;
document.getElementById('interagir').addEventListener('click', function () {
  interacoes = interacoes + 1;
  document.getElementById('contador').textContent = 'Interações: ' + interacoes;
});
document.getElementById('aviso-http').hidden = location.protocol !== 'file:';
