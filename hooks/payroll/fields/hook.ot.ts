import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { NewOTFieldDTO, OTFieldPublicDTO } from "@/types/payroll/type.ot";
import { ApiResponse } from "@/types/response";
import { fetchwithauth } from "@/utils/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CreateFieldVars = {
  shopId: number;
  payload: NewOTFieldDTO;
};

type UpdateFieldVars = {
  shopId: number;
  fieldId: number;
  payload: NewOTFieldDTO;
};

type DeleteFieldVars = {
  shopId: number;
  ids: number[];
};

export const useOTFields = (enabled = true) => {
  const { id: shopId } = useCurrentShop();

  const query = useQuery<ApiResponse<OTFieldPublicDTO[]>>({
    queryKey: ["ot", shopId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/ot-fields`,
        method: "GET",
      }),
    enabled: shopId != null && enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export function useCreateOTField() {
  const queryClient = useQueryClient();
  return useMutation<OTFieldPublicDTO, Error, CreateFieldVars>({
    mutationFn: ({ shopId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/ot-fields`,
        method: "POST",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ot"],
        exact: false,
      });
    },
  });
}

export function useUpdateOTField() {
  const queryClient = useQueryClient();
  return useMutation<OTFieldPublicDTO, Error, UpdateFieldVars>({
    mutationFn: ({ shopId, fieldId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/ot-fields/${fieldId}`,
        method: "PUT",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ot"],
        exact: false,
      });
    },
  });
}

export function useDeleteOTField() {
  const queryClient = useQueryClient();
  return useMutation<OTFieldPublicDTO, Error, DeleteFieldVars>({
    mutationFn: ({ shopId, ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/ot-fields/`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onSuccess: (_, { shopId }) => {
      for (const resource of ["entries", "period", "periods", "preview", "employee-payroll-defaults"]) {
        void queryClient.invalidateQueries({ queryKey: [resource, shopId] });
      }
      queryClient.invalidateQueries({
        queryKey: ["ot"],
        exact: false,
      });
    },
  });
}
