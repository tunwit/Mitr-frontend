import type { ScbSettings, ShopPaymentAccount } from "./type.scb";

export enum SEND_EMAIL_METHOD {
  SMTP = "SMTP",
  RESEND = "RESEND",
}

export type ShopPublicDTO = {
  id: number;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
};

export type ShopConfigDTO = ShopPublicDTO & {
  scbPaymentSettings: ScbSettings | null;
  paymentAccounts: ShopPaymentAccount[];
  taxId: string;
  avatar: string | null;
  avatarUrl: string | null;

  default_work_hours_per_day: number;
  default_workdays_per_month: number;

  send_email_method: SEND_EMAIL_METHOD;
  SMTPHost: string;
  SMTPPort: number;
  SMTPSecure: boolean;

  emailName: string | null;
  emailAddress: string | null;
  emailPassword: string | null;
};

export type NewShopDTO = {
  name: string;
  nameEng: string;
  address: string;
};

export type UpdateShopDataDTO = Partial<{
  scbPaymentSettings: ScbSettings;
  paymentAccounts: ShopPaymentAccount[];
  name: string;
  avatar: string | null;

  taxId: string;

  default_work_hours_per_day: number;
  default_workdays_per_month: number;
  SMTPHost: string;
  SMTPPort: number;
  SMTPSecure: boolean;

  send_email_method: SEND_EMAIL_METHOD;
  resend_api_key: string;

  emailName: string | null;
  emailAddress: string | null;
  emailPassword: string | null;
}>;

export type SMTPConfig = {
  SMTPHost: string;
  SMTPPort: number;
  SMTPSecure: boolean;

  emailAddress: string;
  emailPassword: string;
};

type SMTPConfigWithMethod = {
  send_email_method: SEND_EMAIL_METHOD.SMTP;
} & SMTPConfig;

export type ResendConfig = {
  resendApiKey: string;
};

type ResendConfigWithMethod = {
  send_email_method: SEND_EMAIL_METHOD.RESEND;
} & ResendConfig;

export type VerifyEmailDTO = SMTPConfigWithMethod | ResendConfigWithMethod;

export type VerifyEmailResult = { valid: boolean; error: string };

export type ChangePasswordDTO = {
  oldPassword: string;
  newPassword: string;
};

export type ChangeAvatarDTO = {
  file: File | null;
};
