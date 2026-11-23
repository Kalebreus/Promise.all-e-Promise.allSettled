// IDs exatamente como foram enviados no material da aula.
const IDS_ORIGINAIS = [
  '2baf70d1-42bb-4437-b551-e5fed5a87abe',
  '12cfb892-0ac0-4c5b-94af-521852e46d6a',
  '58611129-2dbc-4a81-a72f-77ddfc1b1b49'
];

// Correção confirmada no catálogo da API em 23/11/2026:
// Grave of the Fireflies usa aac0 no segundo bloco, em vez de 0ac0.
const IDS_VERIFICADOS = [
  IDS_ORIGINAIS[0],
  '12cfb892-aac0-4c5b-94af-521852e46d6a',
  IDS_ORIGINAIS[2]
];

const NOMES_FILMES = [
  'Castle in the Sky',
  'Grave of the Fireflies',
  'My Neighbor Totoro'
];

const BASE_API = 'https://ghibliapi.vercel.app/films/';
