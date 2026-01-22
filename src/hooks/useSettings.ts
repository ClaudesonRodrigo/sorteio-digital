"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { z } from "node_modules/zod/v4/classic/external.cjs";

export const useSettings = () => {
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    // Buscamos o documento único de configuração
    const unsub = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        setPixKey(doc.data().pixKey);
      }
    });
    return () => unsub();
  }, []);

  return { pixKey };
};
/**
 * SCHEMA DE ELITE - Versão Simplificada
 * Removidos os .default() para garantir que a inferência do useForm seja direta.
 */

export const RaffleSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  status: z.enum(["OPEN", "DRAWING", "FINISHED", "CANCELED"]),
  type: z.enum(["DEZENA", "CENTENA", "MILHAR"]),
  tticketPrice: z.coerce
    .number()
    .positive("Preço deve ser maior que zero"),

  totalTickets: z.coerce
    .number()
    .int("Deve ser um número inteiro")
    .positive("Quantidade inválida"),
  drawDate: z.string().min(1, "Data obrigatória"),
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
