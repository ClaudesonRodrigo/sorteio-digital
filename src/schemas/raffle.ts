import { z } from "zod";

/**
 * Interface para as Cotas Premiadas (Prêmios Instantâneos).
 */
export interface LuckyNumber {
  number: string;
  prize: string;
  winnerPhone?: string;
}

/**
 * Interface para o que já existe no Banco (Sempre tem ID).
 */
export interface Raffle {
  id: string; 
  title: string;
  description: string;
  ticketPrice: number;
  drawDate: string;
  type: "DEZENA" | "CENTENA" | "MILHAR";
  totalTickets: number;
  status: "OPEN" | "DRAWING" | "FINISHED" | "CANCELED";
  luckyNumbers?: LuckyNumber[]; // Campo para Cotas Premiadas
}

/**
 * Schema para validação do formulário (O ID é gerado pelo Firebase depois).
 */
export const RaffleSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
  description: z.string().min(1, "A descrição é obrigatória"),
  ticketPrice: z.number().positive("O preço deve ser maior que zero"),
  drawDate: z.string().min(1, "A data do sorteio é obrigatória"),
  type: z.enum(["DEZENA", "CENTENA", "MILHAR"]),
  totalTickets: z.number().int(),
  status: z.enum(["OPEN", "DRAWING", "FINISHED", "CANCELED"]).default("OPEN"),
  luckyNumbers: z.array(z.object({
    number: z.string(),
    prize: z.string()
  })).optional(),
});