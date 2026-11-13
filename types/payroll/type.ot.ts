

import { OT_METHOD, OT_TYPE } from "../enum/enum.ot";

export type OTFieldPublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: OT_TYPE;
  method: OT_METHOD;
  multiplier: string;
  fixedAmount: string | null;
};

export type NewOTFieldDTO = {
  name: string;
  nameEng: string;
  type: OT_TYPE;
  method: OT_METHOD;
  multiplier: string;
  fixedAmount: string | null;
};

export type OTValuePublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: OT_TYPE;
  amount: string;
  method: OT_METHOD;
  multiplier: string;
  fixedAmount: string | null;
  value: string;
};
