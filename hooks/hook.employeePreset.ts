import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { ApiResponse } from "@/types/response";
import {
  EmployeePresetDTO,
  SaveEmployeePresetDTO,
} from "@/types/type.employeePreset";
import { fetchwithauth } from "@/utils/fetcher";

export function useEmployeePresets(enabled = true) {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();
  const queryKey = ["employee-presets", shopId];
  const list = useQuery<ApiResponse<EmployeePresetDTO[]>>({
    queryKey,
    enabled: !!shopId && enabled,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employee-presets`,
        method: "GET",
      }),
  });
  const save = useMutation<
    ApiResponse<EmployeePresetDTO>,
    Error,
    { id?: number; payload: SaveEmployeePresetDTO }
  >({
    mutationFn: ({ id, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employee-presets${id === undefined ? "" : `/${id}`}`,
        method: id === undefined ? "POST" : "PUT",
        body: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const remove = useMutation<ApiResponse<boolean>, Error, number | number[]>({
    mutationFn: (id) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employee-presets${Array.isArray(id) ? "" : `/${id}`}`,
        method: "DELETE",
        body: Array.isArray(id) ? { ids: id } : undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { list, save, remove };
}

export function useEmployeePreset(presetId?: number) {
  const { id: shopId } = useCurrentShop();
  return useQuery<ApiResponse<EmployeePresetDTO>>({
    queryKey: ["employee-presets", shopId, presetId],
    enabled:
      !!shopId &&
      presetId !== undefined &&
      Number.isSafeInteger(presetId) &&
      presetId > 0,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/employee-presets/${presetId}`,
        method: "GET",
      }),
  });
}
