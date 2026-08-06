// Regra de cobrança do estacionamento rotativo:
//
//  - Hora mínima: sempre cobra pelo menos 1 hora (valorPrimeiraHora).
//  - Depois da 1ª hora, cada hora adicional custa valorHoraAdicional.
//  - Tolerância: se o tempo que passou da última hora cheia for MENOR OU IGUAL
//    a toleranciaMinutos, essa fração não é cobrada. Se for MAIOR, cobra mais
//    uma hora cheia.
//    Exemplo com tolerância de 40 min: ficou 1h35 -> paga 1h (35 <= 40).
//                                       ficou 1h45 -> paga 2h (45 > 40).
//
// O valor final pode ainda receber um desconto manual (a critério do operador).

export function calcularPermanencia(entrada, saida) {
  const ms = new Date(saida) - new Date(entrada);
  const minutosTotais = Math.max(0, Math.round(ms / 60000));
  return minutosTotais;
}

export function calcularValor(minutosTotais, config) {
  const {
    valor_primeira_hora,
    valor_hora_adicional,
    tolerancia_minutos,
  } = config;

  if (minutosTotais <= 60) {
    return {
      horasCobradas: 1,
      valor: valor_primeira_hora,
    };
  }

  const minutosApos1Hora = minutosTotais - 60;
  let horasAdicionaisCheias = Math.floor(minutosApos1Hora / 60);
  const restoMinutos = minutosApos1Hora % 60;

  if (restoMinutos > tolerancia_minutos) {
    horasAdicionaisCheias += 1;
  }

  const valor =
    valor_primeira_hora + horasAdicionaisCheias * valor_hora_adicional;

  return {
    horasCobradas: 1 + horasAdicionaisCheias,
    valor,
  };
}

export function formatarDuracao(minutosTotais) {
  const h = Math.floor(minutosTotais / 60);
  const m = minutosTotais % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}
