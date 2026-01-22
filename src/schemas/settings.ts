import { z } from "zod";

// 1. O Schema valida se os dados seguem as regras de negócio
export const SettingsSchema = z.object({
  pixKey: z.string().min(1, "A chave Pix é obrigatória"),
  whatsappNumber: z.string().min(1, "O WhatsApp é obrigatório"),
  adminName: z.string().min(1, "O nome do admin é obrigatório"),
  maintenanceMode: z.boolean(),
});

// 2. Exportamos o tipo inferido diretamente do Schema para evitar erros de importação
export type Settings = z.infer<typeof SettingsSchema>;