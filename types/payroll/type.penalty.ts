

import { PENALTY_METHOD, PENALTY_TYPE } from "../enum/enum.penalty";

export type PenaltyFieldPublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: PENALTY_TYPE;
  method: PENALTY_METHOD;
  fixedAmount: string | null;
};

export type NewPenaltyFieldDTO = {
  name: string;
  nameEng: string;
  type: PENALTY_TYPE;
  method: PENALTY_METHOD;
  fixedAmount: string | null;
};

export type PenaltyValuePublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: PENALTY_TYPE;
  amount: string;
  method: PENALTY_METHOD;
  fixedAmount: string | null;
  value: string;
};
