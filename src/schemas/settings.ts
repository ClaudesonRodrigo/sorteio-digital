import { z } from "zod";

// 1. Definimos a interface manualmente para controle total
export interface Settings {
  pixKey: string;
  whatsappNumber: string;
  adminName: string;
  maintenanceMode: boolean; // Sem 'undefined' ou 'optional'
}

// 2. O Schema valida se os dados seguem a interface
export const SettingsSchema = z.object({
  pixKey: z.string().min(1, "A chave Pix é obrigatória"),
  whatsappNumber: z.string().min(1, "O WhatsApp é obrigatório"),
  adminName: z.string().min(1, "O nome do admin é obrigatório"),
  maintenanceMode: z.boolean(),
});