import * as z from "zod";
export const ResendSchema = z.object({
  email: z.email().trim().toLowerCase(),
});