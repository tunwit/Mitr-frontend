import {
  COMPEN_FIELD_DEFINATION_TYPE,
} from "../enum/enum.compensation";

export type CompensationFieldPublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: COMPEN_FIELD_DEFINATION_TYPE;
  shopId: number;
};

export type NewCompensationFieldDTO = {
  name: string;
  nameEng: string;
  type: COMPEN_FIELD_DEFINATION_TYPE;
};

export type CompensationValuePublicDTO = {
  id: number;
  code: string;
  name: string;
  nameEng: string;
  type: COMPEN_FIELD_DEFINATION_TYPE;
  amount: string;
};
