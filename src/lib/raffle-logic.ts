/**
 * Extrai o número vencedor com base no resultado da Federal
 * Ex: Resultado "2586"
 * Dezena (2 dígitos) -> "86"
 * Centena (3 dígitos) -> "586"
 * Milhar (4 dígitos) -> "2586"
 */
export const extractWinner = (federalResult: string, type: 'DEZENA' | 'CENTENA' | 'MILHAR'): string => {
  // Remove espaços ou caracteres extras
  const cleanResult = federalResult.trim();
  
  switch (type) {
    case 'DEZENA':
      return cleanResult.slice(-2);
    case 'CENTENA':
      return cleanResult.slice(-3);
    case 'MILHAR':
      return cleanResult.slice(-4);
    default:
      return cleanResult;
  }
};

/**
 * Formata o número com zeros à esquerda
 * Ex: (5, 3) -> "005"
 */
export const formatTicketNumber = (num: number, totalTickets: number): string => {
  const digits = totalTickets <= 100 ? 2 : totalTickets <= 1000 ? 3 : 4;
  return num.toString().padStart(digits, '0');
};