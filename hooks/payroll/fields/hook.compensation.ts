import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { COMPEN_FIELD_DEFINATION_TYPE } from "@/types/enum/enum.compensation";
import {
  CompensationFieldPublicDTO,
  NewCompensationFieldDTO,
} from "@/types/payroll/type.compensation";
import { ApiResponse } from "@/types/response";
import { fetchwithauth } from "@/utils/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CreateFieldVars = {
  shopId: number;
  payload: NewCompensationFieldDTO;
};

type UpdateFieldVars = {
  shopId: number;
  fieldId: number;
  payload: NewCompensationFieldDTO;
};

type DeleteFieldVars = {
  shopId: number;
  ids: number[];
};

function getField(shopId: number | null, type: COMPEN_FIELD_DEFINATION_TYPE) {
  return fetchwithauth({
    endpoint: `/shops/${shopId}/compensation-fields?type=${type}`,
    method: "GET",
  });
}

export const useCompensationField = (
  type: COMPEN_FIELD_DEFINATION_TYPE,
  enabled = true,
) => {
  const { id: shopId } = useCurrentShop();

  const query = useQuery<ApiResponse<CompensationFieldPublicDTO[]>>({
    queryKey: ["compensation", type.toString(), shopId],
    queryFn: () => getField(shopId, type),
    enabled: shopId != null && enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export function useCreateCompensationField() {
  const queryClient = useQueryClient();
  return useMutation<CompensationFieldPublicDTO, Error, CreateFieldVars>({
    mutationFn: ({ shopId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/compensation-fields`,
        method: "POST",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["compensation"],
        exact: false,
      });
    },
  });
}

export function useUpdateCompensationField() {
  const queryClient = useQueryClient();
  return useMutation<CompensationFieldPublicDTO, Error, UpdateFieldVars>({
    mutationFn: ({ shopId, fieldId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/compensation-fields/${fieldId}`,
        method: "PUT",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["compensation"],
        exact: false,
      });
    },
  });
}

export function useDeleteCompensationField() {
  const queryClient = useQueryClient();
  return useMutation<CompensationFieldPublicDTO, Error, DeleteFieldVars>({
    mutationFn: ({ shopId, ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/compensation-fields/`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onSuccess: (_, { shopId }) => {
      for (const resource of ["entries", "period", "periods", "preview", "employee-payroll-defaults"]) {
        void queryClient.invalidateQueries({ queryKey: [resource, shopId] });
      }
      queryClient.invalidateQueries({
        queryKey: ["compensation"],
        exact: false,
      });
    },
  });
}
