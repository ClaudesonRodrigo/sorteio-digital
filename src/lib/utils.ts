import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata o número do bilhete com zeros à esquerda
 * Baseado no total de números (Dezena, Centena ou Milhar)
 */
export function formatTicketNumber(num: number, totalTickets: number): string {
  // Define quantos dígitos o número deve ter
  // 100 -> 2 dígitos (00-99)
  // 1000 -> 3 dígitos (000-999)
  // 10000 -> 4 dígitos (0000-9999)
  const digits = totalTickets <= 100 ? 2 : totalTickets <= 1000 ? 3 : 4;
  return num.toString().padStart(digits, '0');
}