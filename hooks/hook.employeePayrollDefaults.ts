import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { EmployeePayrollDefaultsDTO } from "@/types/type.employee";
import { ApiResponse } from "@/types/response";
import { fetchwithauth } from "@/utils/fetcher";

export function useEmployeePayrollDefaults(employeeId: number, enabled = true) {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();
  const queryKey = ["employee-payroll-defaults", shopId, employeeId];
  const endpoint = `/shops/${shopId}/employees/${employeeId}/payroll-defaults`;
  const list = useQuery<ApiResponse<EmployeePayrollDefaultsDTO>>({
    queryKey,
    enabled: enabled && !!shopId && employeeId > 0,
    queryFn: () => fetchwithauth({ endpoint, method: "GET" }),
    refetchOnWindowFocus: false,
  });
  const save = useMutation<
    ApiResponse<EmployeePayrollDefaultsDTO>,
    Error,
    EmployeePayrollDefaultsDTO
  >({
    mutationFn: (body) => fetchwithauth({ endpoint, method: "PUT", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { list, save };
}
