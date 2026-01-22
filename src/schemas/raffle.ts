import { z } from "zod";

export interface LuckyNumber {
  number: string;
  prize: string;
  winnerPhone?: string;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  ticketPrice: number;
  drawDate: string;
  type: "DEZENA" | "CENTENA" | "MILHAR";
  totalTickets: number;
  status: "OPEN" | "DRAWING" | "FINISHED" | "CANCELED";
  luckyNumbers?: LuckyNumber[];
}

export const RaffleSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  status: z.enum(["OPEN", "DRAWING", "FINISHED", "CANCELED"]),
  type: z.enum(["DEZENA", "CENTENA", "MILHAR"]),
  
  // Coerce resolve o erro de String vs Number dos inputs
  ticketPrice: z.coerce
    .number("Preço inválido" )
    .positive("Preço deve ser maior que zero"),

  totalTickets: z.coerce
    .number("Quantidade inválida")
    .int("Deve ser um número inteiro")
    .positive("Quantidade inválida"),

  drawDate: z.string().min(1, "Data obrigatória"),
  luckyNumbers: z.array(z.any()).optional(),
});

export type RaffleFormData = z.infer<typeof RaffleSchema>;