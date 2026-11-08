import { ApiResponse } from "@/types/response";
import { fetchwithauth } from "@/utils/fetcher";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCurrentShop } from "./shop/useCurrentShop";
import {
  ChangeAvatarDTO,
  ChangePasswordDTO,
  ShopConfigDTO,
  ShopPublicDTO,
  UpdateShopDataDTO,
  VerifyEmailDTO,
  VerifyEmailResult,
} from "@/types/type.shop";

type UpdateShopDataVars = {
  shopId: number;
  payload: UpdateShopDataDTO;
};

type UpdateShopPasswordVars = {
  shopId: number;
  payload: ChangePasswordDTO;
};

export const useOwnShop = () => {
  const query = useQuery<ApiResponse<ShopPublicDTO[]>>({
    queryKey: ["shop"],
    queryFn: () =>
      fetchwithauth({
        endpoint: "/shops",
        method: "GET",
      }),
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export const useShopData = () => {
  const { id: shopId } = useCurrentShop();
  const query = useQuery<ApiResponse<ShopPublicDTO>>({
    queryKey: ["shop", "data", shopId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}`,
        method: "GET",
      }),
    refetchOnWindowFocus: true,
    enabled: shopId !== null && shopId !== undefined,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export const useShopConfigs = () => {
  const { id: shopId } = useCurrentShop();
  const query = useQuery<ApiResponse<ShopConfigDTO>>({
    queryKey: ["shop", "config", shopId, "payment-accounts-v3"],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}?configs=true`,
        method: "GET",
      }),
    refetchOnWindowFocus: true,
    enabled: shopId !== null && shopId !== undefined,
    staleTime: 1000 * 60 * 5,
  });

  return query;
};

export function useUpdateShop() {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();

  return useMutation<ShopPublicDTO, Error, UpdateShopDataVars>({
    mutationFn: ({ shopId, payload }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}`,
        method: "PATCH",
        body: payload,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", "data", shopId] });
      queryClient.invalidateQueries({ queryKey: ["shop", "config", shopId] });
      queryClient.invalidateQueries({ queryKey: ["scb-payment", shopId] });
    },
  });
}

export function useVerifyEmailConfig() {
  const { id: shopId } = useCurrentShop();
  return useMutation<ApiResponse<VerifyEmailResult>, Error, VerifyEmailDTO>({
    mutationFn: (payload: VerifyEmailDTO) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/email/verify`,
        method: "POST",
        body: payload,
      }),
  });
}

export function useChangeShopPassword() {
  const { id: shopId } = useCurrentShop();
  return useMutation({
    mutationFn: (payload: ChangePasswordDTO) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/change-password`,
        method: "POST",
        body: payload,
      }),
  });
}

export function useChangeShopAvatar() {
  const queryClient = useQueryClient();
  const { id: shopId } = useCurrentShop();
  return useMutation({
    mutationFn: (payload: ChangeAvatarDTO) => {
      const formData = new FormData();
      if (payload.file) formData.append("file", payload.file);

      return fetchwithauth({
        endpoint: `/shops/${shopId}/avatar`,
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"], exact: false });
    },
  });
}
