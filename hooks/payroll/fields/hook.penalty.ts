import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import {
  NewPenaltyFieldDTO,
  PenaltyFieldPublicDTO,
} from "@/types/payroll/type.penalty";
import { ApiResponse } from "@/types/response";
import { fetchwithauth } from "@/utils/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CreateFieldVars = {
  shopId: number;
  payload: NewPenaltyFieldDTO;
};

type UpdateFieldVars = {
  shopId: number;
  fieldId: number;
  payload: NewPenaltyFieldDTO;
};

type DeleteFieldVars = {
  shopId: number;
  ids: number[];
};

export const usePenaltyFields = (enabled = true) => {
  const { id: shopId } = useCurrentShop();

  const query = useQuery<ApiResponse<PenaltyFieldPublicDTO[]>>({
    queryKey: ["penalty", shopId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/penalty-fields`,
        method: "GET",
      }),
    enabled: shopId != null && enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export function useCreatePenaltyField() {
  const queryClient = useQueryClient();
  return useMutation<NewPenaltyFieldDTO, Error, CreateFieldVars>({
    mutationFn: ({ shopId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/penalty-fields`,
        method: "POST",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["penalty"],
        exact: false,
      });
    },
  });
}

export function useUpdatePenaltyField() {
  const queryClient = useQueryClient();
  return useMutation<PenaltyFieldPublicDTO, Error, UpdateFieldVars>({
    mutationFn: ({ shopId, fieldId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/penalty-fields/${fieldId}`,
        method: "PUT",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["penalty"],
        exact: false,
      });
    },
  });
}

export function useDeletePenaltyField() {
  const queryClient = useQueryClient();
  return useMutation<PenaltyFieldPublicDTO, Error, DeleteFieldVars>({
    mutationFn: ({ shopId, ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/penalty-fields/`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onSuccess: (_, { shopId }) => {
      for (const resource of ["entries", "period", "periods", "preview", "employee-payroll-defaults"]) {
        void queryClient.invalidateQueries({ queryKey: [resource, shopId] });
      }
      queryClient.invalidateQueries({
        queryKey: ["penalty"],
        exact: false,
      });
    },
  });
}
