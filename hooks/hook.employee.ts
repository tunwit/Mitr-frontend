import {
  EMPLOYEE_ORDERBY,
  EMPLOYEE_SORTBY,
  EMPLOYEE_STATUS,
} from "@/types/enum/enum.employee";
import { useCurrentShop } from "./shop/useCurrentShop";
import { ApiResponse, PaginatedResponse } from "@/types/response";
import {
  ChangeAvatarDTO,
  EmployeeDetailedDTO,
  EmployeePublicDTO,
  EmployeeStatsDTO,
  EmployeeWithBranchDTO,
  NewEmployeeDTO,
  UpdateEmployeeDTO,
} from "@/types/type.employee";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchwithauth } from "@/utils/fetcher";

type CreateEmployeeVars = {
  payload: NewEmployeeDTO;
};

type UpdateEmployeeVars = {
  employeeId: number;
  payload: UpdateEmployeeDTO;
};

type ChangeAvatarVars = {
  employeeId: number;
  payload: ChangeAvatarDTO;
};

type DeleteEmployeeVars = {
  ids: number[];
};

interface useEmployeesProps {
  sortBy?: EMPLOYEE_SORTBY;
  orderBy?: EMPLOYEE_ORDERBY;
  search_query?: string;
  page?: number;
  limit?: number;
  status?: EMPLOYEE_STATUS | null;
  branchId?: number;
}

export const useEmployees = ({
  sortBy,
  orderBy,
  search_query,
  status,
  page,
  limit,
  branchId,
}: useEmployeesProps) => {
  const { id: shopId } = useCurrentShop();

  const queryParams = new URLSearchParams({
    ...(shopId && { shopId: shopId.toString() }),
    ...(search_query && { search: search_query }),
    ...(branchId && branchId !== -1 && { branchId: branchId.toString() }),
    ...(status && status !== null && { status: status }),
    ...(page && { page: page.toString() }),
    ...(limit && { limit: limit.toString() }),
    ...(sortBy && { sortBy: sortBy.toString().toLocaleUpperCase() }),
    ...(orderBy && { orderBy: orderBy.toString().toLocaleUpperCase() }),
  });

  return useQuery<PaginatedResponse<EmployeeWithBranchDTO[]>>({
    queryKey: [
      "employees",
      shopId,
      search_query,
      page,
      limit,
      branchId,
      status,
      sortBy,
      orderBy,
    ],
    enabled: !!shopId,
    queryFn: () => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/employees?${queryParams}`,
        method: "GET",
      });
    },
    placeholderData: keepPreviousData,
    // refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useEmployeeStats = () => {
  const { id: shopId } = useCurrentShop();
  const query = useQuery<ApiResponse<EmployeeStatsDTO>>({
    queryKey: ["employees", "stats", shopId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employees/stats`,
        method: "GET",
      }),
    enabled: shopId != null,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export const useEmployee = (employeeId: number) => {
  const { id: shopId } = useCurrentShop();
  const query = useQuery<ApiResponse<EmployeeDetailedDTO>>({
    queryKey: ["employees", "empid", shopId, employeeId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employees/${employeeId}`,
        method: "GET",
      }),
    enabled: shopId != null && employeeId != null && employeeId !== -1,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  return useMutation<EmployeePublicDTO, Error, CreateEmployeeVars>({
    mutationFn: ({ payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employees`,
        method: "POST",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"], exact: false });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  return useMutation<EmployeePublicDTO, Error, UpdateEmployeeVars>({
    mutationFn: ({ employeeId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employees/${employeeId}`,
        method: "PATCH",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"], exact: false });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  return useMutation<EmployeePublicDTO, Error, DeleteEmployeeVars>({
    mutationFn: ({ ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employees`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useChangeEmployeeAvatar() {
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  return useMutation<EmployeePublicDTO, Error, ChangeAvatarVars>({
    mutationFn: ({ payload, employeeId }) => {
      const formData = new FormData();
      if (payload.file) formData.append("file", payload.file);

      return fetchwithauth({
        endpoint: `/shops/${shopId}/employees/${employeeId}/avatar`,
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"], exact: false });
    },
  });
}
