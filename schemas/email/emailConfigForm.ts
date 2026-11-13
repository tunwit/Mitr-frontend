import { z } from "zod";

const sender = {
  emailName: z.string().max(255).regex(/^[^\r\n]*$/),
  emailAddress: z.string().trim().email().max(255),
};

export const SMTPEmailConfigForm = z.object({
  ...sender,
  SMTPHost: z.string().trim().min(1).max(50),
  SMTPPort: z.number().int().min(1).max(65535),
  SMTPSecure: z.boolean(),
  emailPassword: z.string().max(255).optional(),
});

export const ResendEmailConfigForm = z.object({
  ...sender,
  resend_api_key: z.string().trim().max(255).optional(),
});
