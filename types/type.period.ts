import { PAY_PERIOD_STATUS } from "./enum/enum.period";
import { CalculationContext } from "./type.calculation";
import { EmployeePaymentDTO } from "./type.employee";
import { EntryBreakDownDTO } from "./type.entry";
import { UserPublicDTO } from "./type.user";

export type PeriodPublicDTO = {
  id: number;
  name: string;
  status: PAY_PERIOD_STATUS;
  updatedAt: Date | null;
  start_period: string;
  end_period: string;
  work_hours_per_day: string;
  workdays_per_month: string;
  edited: boolean | null;
  finalized_at: Date | null;
  finalized_by: UserPublicDTO | null;
};

export type PeriodWithCountDTO = PeriodPublicDTO & {
  employeeCount: number;
  unpaidEmployeeCount: number;
};
export type PeriodSummaryDTO = PeriodWithCountDTO & CalculationContext;

export type PeriodFilterContextDTO = PeriodWithCountDTO &
  CalculationContext & {
    fields: {
      name: string;
      nameEng: string;
    }[];
  } & {
    breakdowns: EntryBreakDownDTO[];
  };

export type PeriodContextWithPaymentDTO = PeriodWithCountDTO &
  CalculationContext & {
    fields: {
      name: string;
      nameEng: string;
    }[];
  } & {
    breakdowns: EntryBreakDownDTO[];
  } & {
    paymentsByEntryId: Record<number, EmployeePaymentDTO>;
  };

export type PeriodWithBreakdownsDTO = PeriodWithCountDTO & {
  breakdowns: EntryBreakDownDTO[];
};

export type NewPeriodDTO = {
  name: string;
  start_period: string;
  end_period: string;
};

export type UpdatePeriodDTO = {
  name?: string | undefined;
  start_period?: string | undefined;
  end_period?: string | undefined;
  work_hours_per_day?: string | null | undefined;
  workdays_per_month?: string | null | undefined;
};

export type UnlockPeriodDTO = {
  password: string;
};

export type SendPayslipEmailDTO = {
  entryId: number;
  overrideEmail?: string | null | undefined;
}[];
