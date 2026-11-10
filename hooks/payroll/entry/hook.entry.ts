import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { ApplyEmployeePresetDTO } from "@/types/type.employeePreset";
import { ApiResponse } from "@/types/response";
import {
  EntryBreakDownDTO,
  EntryPublicDTO,
  EntryWithTotalDTO,
  NewEntryDTO,
  UpdateBreakDownDTO,
  UpdatePaidDTO,
} from "@/types/type.entry";
import { fetchwithauth } from "@/utils/fetcher";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function useEntry(periodId: number) {
  const { id: shopId } = useCurrentShop();
  const queryKey = ["entries", shopId, periodId];
  const queryClient = useQueryClient();
  const refreshPeriod = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["period", shopId, periodId] }),
      queryClient.invalidateQueries({ queryKey: ["periods", shopId] }),
      queryClient.invalidateQueries({
        queryKey: ["preview", shopId, periodId],
      }),
    ]);
  const list = useQuery<ApiResponse<EntryWithTotalDTO[]>>({
    queryKey,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries`,
        method: "GET",
      }),
    enabled: shopId != null,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  const create = useMutation<
    ApiResponse<EntryPublicDTO[]>,
    Error,
    { payload: NewEntryDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries`,
        method: "POST",
        body: payload,
      });
    },
    onSuccess: refreshPeriod,
  });

  const remove = useMutation<
    EntryPublicDTO,
    Error,
    { ids: number[] },
    { previous?: ApiResponse<EntryPublicDTO[]> }
  >({
    mutationFn: ({ ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<ApiResponse<EntryPublicDTO[]>>(queryKey);

      queryClient.setQueryData<ApiResponse<EntryPublicDTO[]>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data?.filter((d) => !ids.includes(d.id)),
          };
        },
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },

    onSettled: refreshPeriod,
  });

  const applyPreset = useMutation<ApiResponse<EntryPublicDTO[]>, Error, ApplyEmployeePresetDTO>({
    mutationFn: (payload) => fetchwithauth({
      endpoint: `/shops/${shopId}/periods/${periodId}/entries/preset`, method: "POST", body: payload,
    }),
    onSuccess: refreshPeriod,
  });

  const setPaid = useMutation<
    ApiResponse<EntryPublicDTO>,
    Error,
    { payload: UpdatePaidDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries/${payload.entryId}/paid`,
        method: "PATCH",
        body: { paid: payload.paid },
      });
    },
    onSuccess: refreshPeriod,
  });

  return { list, create, remove, setPaid, applyPreset };
}

export function useEntryBreakdown(periodId: number, entryId: number) {
  const { id: shopId } = useCurrentShop();
  const queryKey = ["entries", shopId, periodId, "items", entryId];
  const queryKeyList = ["entries", shopId, periodId];
  const queryClient = useQueryClient();
  const get = useQuery<ApiResponse<EntryBreakDownDTO>>({
    queryKey,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries/${entryId}/break-down`,
        method: "GET",
      }),
    enabled: shopId != null && periodId > 0 && entryId > 0,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  const update = useMutation<
    ApiResponse<EntryBreakDownDTO>,
    Error,
    { payload: UpdateBreakDownDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries/${entryId}`,
        method: "PATCH",
        body: payload,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeyList });
      queryClient.invalidateQueries({ queryKey: ["period", shopId, periodId] });
      queryClient.invalidateQueries({ queryKey: ["periods", shopId] });
    },
  });

  return { get, update };
}

export function useEntrySlip(periodId: number) {
  const { id: shopId } = useCurrentShop();
  const queryKey = ["entries", shopId, periodId, "pay-slip"];
  const queryClient = useQueryClient();
  const get = (entryId: number) =>
    useMutation({
      mutationFn: async () => {
        const res = (await fetchwithauth({
          endpoint: `/shops/${shopId}/periods/${periodId}/entries/${entryId}/pay-slip`,
          method: "GET",
          responseType: "blob",
        })) as Response;
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition");
        const filename =
          disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "payslip.zip";

        return { blob, filename };
      },
      onSuccess: ({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        window.URL.revokeObjectURL(url);
      },
    });

  return { get };
}

export const usePreviewSlip = (periodId: number, entryId: number) => {
  const { id: shopId } = useCurrentShop();
  return useQuery<ApiResponse<string>>({
    queryKey: ["preview", shopId, periodId, entryId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/entries/${entryId}/preview`,
        method: "GET",
      }),
    staleTime: 1000 * 60 * 5,
  });
};
