export type ScbSettings = {
  systemReferenceId: string;
};
export type ShopPaymentAccount = {
  id: string;
  label: string;
  accountNumber: string;
  isPrimary: boolean;
};
export type ScbRequest = {
  entryIds: number[];
  paymentDate: string;
  payrollService?: "PAY" | "PA2" | "PA3";
  smartService?: "SPN" | "SPS" | "SPN2" | "SPS2" | "SPN3" | "SPS3";
  feePayer: "OUR" | "BEN";
  fundingAccountId?: string;
  feeAccountId?: string;
};
export type ScbRecipient = {
  entryId: number;
  employeeId: number;
  name: string;
  accountHolder: string;
  bankName: string;
  bankCode: string | null;
  account: string;
  branchCode: string;
  amount: string | null;
  paid: boolean;
  service: string | null;
  issues: string[];
};
export type ScbPreview = {
  recipients: ScbRecipient[];
  groups: { service: string; count: number; total: string }[];
  issues: string[];
  ready: boolean;
  fingerprint: string;
  hasPaid: boolean;
};
