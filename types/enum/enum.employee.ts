export enum EMPLOYEE_STATUS {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PARTTIME = "PARTTIME",
}

export const SALARY_PAYMENT_METHODS = ["cash", "bank_transfer"] as const;
export type SalaryPaymentMethod = (typeof SALARY_PAYMENT_METHODS)[number];

export enum EMPLOYEE_SORTBY {
  NAME = "NAME",
  SALARY = "SALARY",
  CREATEDAT = "CREATEDAT",
}

export enum EMPLOYEE_ORDERBY {
  ASC = "ASC",
  DES = "DES",
}
export enum GENDER {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}
