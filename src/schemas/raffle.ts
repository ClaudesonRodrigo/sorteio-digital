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
  soldCount?: number; // Novo campo para progresso na Home
}

export const RaffleSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  status: z.enum(["OPEN", "DRAWING", "FINISHED", "CANCELED"]),
  type: z.enum(["DEZENA", "CENTENA", "MILHAR"]),
  
  ticketPrice: z.coerce
  .number()
  .refine((val) => !isNaN(val), "Preço inválido")
  .positive("Preço deve ser maior que zero"),

  totalTickets: z.coerce
  .number()
  .refine((val) => Number.isInteger(val), "Deve ser um número inteiro")
  .positive("Quantidade inválida"),

  drawDate: z.string().min(1, "Data obrigatória"),
  luckyNumbers: z.array(z.any()).optional(),
});

export type RaffleFormData = z.infer<typeof RaffleSchema>;