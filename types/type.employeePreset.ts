export type EmployeePresetDTO = {
  id: number;
  name: string;
  updatedAt: string;
  employees: {
    id: number;
    firstName: string;
    lastName: string;
    nickName: string;
    email: string;
    avatar: string | null;
    avatarUrl: string | null;
    branch: { id: number; name: string; nameEng: string };
  }[];
};

export type SaveEmployeePresetDTO = { name: string; employeeIds: number[] };
export type ApplyEmployeePresetDTO = {
  presetId: number;
  mode: "add" | "override";
};
