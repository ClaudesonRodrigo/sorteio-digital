import { z } from "zod";

export const PartnerSchema = z.object({
  id: z.string(), // O slug que vai na URL (ex: midinho)
  name: z.string().min(1, "O nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  active: z.boolean().default(true),
  totalSales: z.number().default(0),
  createdAt: z.any().optional(),
});

export type Partner = z.infer<typeof PartnerSchema>;