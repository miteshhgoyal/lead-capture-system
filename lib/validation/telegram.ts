import { z } from "zod";

export const TelegramPreviewSchema = z.object({
  text: z.string().trim().min(1, "Enter a message to preview").max(4000, "Messages are limited to 4000 characters"),
  style: z.string().trim().min(1, "Choose a message style").max(300, "Style can be at most 300 characters"),
});
