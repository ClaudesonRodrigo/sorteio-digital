import { z } from "zod";

/**
 * =========================
 * COTAS PREMIADAS
 * =========================
 */
export interface LuckyNumber {
  number: string;
  prize: string;
  winnerPhone?: string;
}

/**
 * =========================
 * MODELO DO BANCO (Firestore)
 * =========================
 */
export interface Raffle {
  id: string;
  title: string;
  description: string;
  ticketPrice: number;
  drawDate: string; // ISO string
  type: "DEZENA" | "CENTENA" | "MILHAR";
  totalTickets: number;
  status: "OPEN" | "DRAWING" | "FINISHED" | "CANCELED";
  luckyNumbers?: LuckyNumber[];
}

/**
 * =========================
 * SCHEMA DO FORMULÁRIO
 * (sem ID, sem campos de sistema)
 * =========================
 */
export const RaffleSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),

  description: z.string().min(1, "Descrição obrigatória"),

  status: z.enum(
    ["OPEN", "DRAWING", "FINISHED", "CANCELED"]
  ).default("OPEN"),

  type: z.enum(
    ["DEZENA", "CENTENA", "MILHAR"]
  ).default("DEZENA"),

  ticketPrice: z
    .number("Preço inválido")
    .positive("Preço deve ser maior que zero"),

  totalTickets: z
    .number("Quantidade inválida")
    .int("Deve ser um número inteiro")
    .positive("Quantidade inválida"),

  // HTML datetime-local → string
  drawDate: z.string().min(1, "Data obrigatória"),

  // Campo opcional no formulário
  luckyNumbers: z
    .array(
      z.object({
        number: z.string().min(1, "Número obrigatório"),
        prize: z.string().min(1, "Prêmio obrigatório"),
        winnerPhone: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * =========================
 * TIPO DO FORMULÁRIO
 * =========================
 */
export type RaffleFormData = z.infer<typeof RaffleSchema>;
