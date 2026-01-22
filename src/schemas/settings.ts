import { z } from "zod"; // Importação correta entre chaves

export const SettingsSchema = z.object({
  siteName: z.string().min(1, "Nome do site é obrigatório"),
  contactPhone: z.string().min(1, "Telefone é obrigatório"),
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  pixName: z.string().min(1, "Nome do titular é obrigatório"),
  instagramUrl: z.string().optional(),
  whatsappMessage: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof SettingsSchema>;