import { RaffleSchema } from "@/hooks/useSettings";
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

export type RaffleFormData = z.infer<typeof RaffleSchema>;

export { RaffleSchema };
