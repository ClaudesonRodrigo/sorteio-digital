import { Raffle } from "@/schemas/raffle";

export interface FederalResult {
  concurso: number;
  data: string;
  dezenas: string[]; // Geralmente os 5 prêmios
}

/**
 * Busca o resultado do último concurso da Loteria Federal
 */
export const fetchFederalResult = async (): Promise<FederalResult | null> => {
  try {
    // API pública de loterias (exemplo estável)
    const response = await fetch("https://loteriascaixa-api.herokuapp.com/api/federal/latest");
    
    if (!response.ok) throw new Error("Falha ao buscar resultado da CEF");
    
    const data = await response.json();
    return {
      concurso: data.concurso,
      data: data.data,
      dezenas: data.dezenas, // Array com os 5 prêmios (ex: ["45876", "12345", ...])
    };
  } catch (error) {
    console.error("Erro na API de Loterias:", error);
    return null;
  }
};

/**
 * Extrai o número ganhador com base na regra de trás para frente
 */
export const extractWinnerNumber = (fullNumber: string, type: Raffle["type"]): string => {
  // Ex: fullNumber = "45876"
  switch (type) {
    case "DEZENA":  // Final 76
      return fullNumber.slice(-2);
    case "CENTENA": // Final 876
      return fullNumber.slice(-3);
    case "MILHAR":  // Final 5876
      return fullNumber.slice(-4);
    default:
      return fullNumber;
  }
};