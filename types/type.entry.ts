import type { OT_METHOD, OT_TYPE } from "./enum/enum.ot";
import type { PENALTY_METHOD, PENALTY_TYPE } from "./enum/enum.penalty";
import type { SalaryPaymentMethod } from "./enum/enum.employee";
import { CompensationValuePublicDTO } from "./payroll/type.compensation";
import { OTValuePublicDTO } from "./payroll/type.ot";
import { PenaltyValuePublicDTO } from "./payroll/type.penalty";
import { CalculationContext } from "./type.calculation";

export type EntryPublicDTO = {
  id: number;
  salary: string;
  note: string | null;
  employee: EmployeeSnapshotDTO;
  payslipSent: boolean | null;
  paidAt: Date | null;
};

export type EmployeeSnapshotDTO = {
  id: number;
  avatar?: string | null;
  email: string;
  snapshot: {
    firstName: string;
    lastName: string;
    nickName: string;
    branch: {
      id: number;
      name: string;
      nameEng: string;
    };
  };
};

export type EntryWithTotalDTO = EntryPublicDTO & CalculationContext;

export type PayrollItemsDTO = {
  earnings: CompensationValuePublicDTO[];
  deductions: CompensationValuePublicDTO[];
  non_calculated: CompensationValuePublicDTO[];
  ots: OTValuePublicDTO[];
  penalties: PenaltyValuePublicDTO[];
};

export type EntrySummaryDTO = {
  earningTotal: number;
  deductionTotal: number;
  overtimeTotal: number;
  penaltyTotal: number;
  netTotal: number;
};

export type EntryBreakDownDTO = {
  entry: EntryPublicDTO;
  currentPreferredPaymentMethod: SalaryPaymentMethod | null;
  currentSocialSecurityCoverage: boolean | null;
  items: PayrollItemsDTO;
  calculation: CalculationContext;
};

export type NewEntryDTO = {
  employeeIds: number[];
};

export type UpdatePaidDTO = {
  entryId: number;
  paid: boolean;
};

export type LineChange<Key extends "amount" | "value"> =
  | ({ id: number } & Record<Key, string | null>)
  | ({ fieldId: number } & Record<Key, string>);

type OneOffRate<Salary, Fixed> =
  | { type: Salary }
  | { type: Fixed; fixedAmount: string };

export type OneOffPayrollLine = { requestId: string; name: string } & (
  | { group: "earnings" | "deductions" | "non_calculated"; amount: string }
  | { group: "ots"; value: string; method: OT_METHOD; multiplier: string; rate: OneOffRate<OT_TYPE.BASEDONSALARY, OT_TYPE.CONSTANT> }
  | { group: "penalties"; value: string; method: PENALTY_METHOD; rate: OneOffRate<PENALTY_TYPE.BASEDONSALARY, PENALTY_TYPE.CONSTANT> }
);

export type UpdateBreakDownDTO = {
  oneOffLine?: OneOffPayrollLine;
  entry: { salary?: string; note?: string };
  items: {
    earnings?: LineChange<"amount">[];
    deductions?: LineChange<"amount">[];
    non_calculated?: LineChange<"amount">[];
    ots?: LineChange<"value">[];
    penalties?: LineChange<"value">[];
  };
};
