import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { ValidationResultDTO } from "@/types/payroll/type.validate";
import { ApiResponse } from "@/types/response";
import { CreateBatch } from "@/types/type.batch";
import {
  NewPeriodDTO,
  PayslipProgressDTO,
  PayslipVersionsDTO,
  PeriodContextWithPaymentDTO,
  PeriodFilterContextDTO,
  PeriodPublicDTO,
  PeriodSummaryDTO,
  PeriodWithCountDTO,
  SendPayslipEmailDTO,
  UnlockPeriodDTO,
  UpdatePeriodDTO,
} from "@/types/type.period";
import { fetchwithauth } from "@/utils/fetcher";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function usePeriods() {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();
  const queryKey = ["periods", shopId];

  const list = useQuery<ApiResponse<PeriodSummaryDTO[]>>({
    queryKey,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods`,
        method: "GET",
      }),
    enabled: shopId != null,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const create = useMutation<
    ApiResponse<PeriodPublicDTO>,
    Error,
    { payload: NewPeriodDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods`,
        method: "POST",
        body: payload,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const remove = useMutation<
    PeriodPublicDTO,
    Error,
    { ids: number[] },
    { previous?: ApiResponse<PeriodPublicDTO[]> }
  >({
    mutationFn: ({ ids }) =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods`,
        method: "DELETE",
        body: { ids: ids },
      }),

    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<ApiResponse<PeriodPublicDTO[]>>(queryKey);

      queryClient.setQueryData<ApiResponse<PeriodPublicDTO[]>>(
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

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  return { list, create, remove };
}

export function usePeriodValidate(periodId?: number | string) {
  const { id: shopId } = useCurrentShop();

  return useQuery<ApiResponse<ValidationResultDTO[]>>({
    queryKey: ["period", shopId, Number(periodId), "validate"],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/validate`,
        method: "GET",
      }),
    enabled: !!shopId && !!periodId,
  });
}

export function usePeriod(periodId?: number | string) {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();
  const queryKeyList = ["periods", shopId];
  const queryKey = ["period", shopId, Number(periodId)];
  const queryValidateKey = ["period", shopId, Number(periodId), "validate"];
  const queryKeyEntries = ["entries", shopId, Number(periodId)];
  const queryKeyWithCal = ["period", shopId, Number(periodId), "withCal"];
  const queryKeyFilterContext = ["period", shopId, Number(periodId), "context"];
  const queryKeyContextPayment = [
    "period",
    shopId,
    Number(periodId),
    "context",
    "payment",
  ];

  const get = useQuery<ApiResponse<PeriodWithCountDTO>>({
    queryKey: queryKey,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}`,
        method: "GET",
      }),
    enabled: !!shopId && !!periodId,
  });

  const getWithCal = useQuery<ApiResponse<PeriodSummaryDTO>>({
    queryKey: queryKeyWithCal,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}?include=calculation`,
        method: "GET",
      }),
    enabled: !!shopId && !!periodId,
  });

  const getFilterContext = useQuery<ApiResponse<PeriodFilterContextDTO>>({
    queryKey: queryKeyFilterContext,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}?include=calculation,fields,breakdowns`,
        method: "GET",
      }),
    enabled: !!shopId && !!periodId,
  });

  const getContextWithPayment = useQuery<
    ApiResponse<PeriodContextWithPaymentDTO>
  >({
    queryKey: queryKeyContextPayment,
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}?include=calculation,fields,breakdowns,payments`,
        method: "GET",
      }),
    enabled: !!shopId && !!periodId,
  });

  const update = useMutation<
    ApiResponse<PeriodPublicDTO>,
    Error,
    { payload: UpdatePeriodDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}`,
        method: "PATCH",
        body: payload,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeyEntries });
    },
  });

  const finalize = useMutation<ApiResponse<PeriodPublicDTO>, Error>({
    mutationFn: () => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/finalize`,
        method: "POST",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeyEntries });
      queryClient.invalidateQueries({ queryKey: queryValidateKey });
      queryClient.invalidateQueries({ queryKey: queryKeyList });
    },
  });

  const unlock = useMutation<
    ApiResponse<PeriodPublicDTO>,
    Error,
    { payload: UnlockPeriodDTO }
  >({
    mutationFn: ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/unlock`,
        method: "POST",
        body: payload,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeyEntries });
      queryClient.invalidateQueries({ queryKey: queryValidateKey });
      queryClient.invalidateQueries({ queryKey: queryKeyList });
    },
  });
  return {
    get,
    update,
    getWithCal,
    getFilterContext,
    finalize,
    unlock,
    getContextWithPayment,
  };
}

export function usePayslipProgress(periodId: number, enabled: boolean) {
  const { id: shopId } = useCurrentShop();
  const queryClient = useQueryClient();
  const queryKey = ["period", shopId, periodId, "payslips"];
  const endpoint = `/shops/${shopId}/periods/${periodId}/pay-slips`;

  const progress = useQuery<ApiResponse<PayslipProgressDTO | null>>({
    queryKey,
    enabled: enabled && !!shopId,
    queryFn: () => fetchwithauth({ endpoint: `${endpoint}/progress`, method: "GET" }),
    refetchInterval: ({ state }) => {
      const status = state.data?.data;
      return status && status.ready + status.failed < status.total ? 3000 : false;
    },
  });
  const retry = useMutation({
    mutationFn: (revisionId: number) => fetchwithauth({
      endpoint: `${endpoint}/retry`,
      method: "POST",
      body: { revisionId },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const status = progress.data?.data;
  const isGenerating = retry.isPending || (!!status && status.ready + status.failed < status.total);
  return { progress, retry, isGenerating };
}

export function usePayslipVersions(periodId: number, revisionId?: number) {
  const { id: shopId } = useCurrentShop();
  return useQuery<ApiResponse<PayslipVersionsDTO>>({
    queryKey: ["period", shopId, periodId, "payslips", "versions", revisionId],
    enabled: !!shopId && revisionId !== undefined,
    queryFn: () => fetchwithauth({
      endpoint: `/shops/${shopId}/periods/${periodId}/pay-slips/versions?revisionId=${revisionId}`,
      method: "GET",
    }),
  });
}

export function usePeriodSlips(periodId: number) {
  const { id: shopId } = useCurrentShop();
  const endpoint = `/shops/${shopId}/periods/${periodId}/pay-slips`;

  const saveDownload = ({ blob, filename }: { blob: Blob; filename: string }) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const pdf = useMutation({
    mutationFn: async ({ entryId, revisionId }: { entryId: number; revisionId: number }) => {
      const res: Response = await fetchwithauth({
        endpoint: `${endpoint}/entries/${entryId}/pdf?revisionId=${revisionId}&download=1`,
        method: "GET",
        responseType: "blob",
      });
      const disposition = res.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "payslip.pdf";
      return { blob: await res.blob(), filename };
    },
    onSuccess: saveDownload,
  });

  const zip = useMutation<
    { blob: Blob; filename: string },
    Error,
    { payload: { entryIds: number[]; revisionId?: number } }
  >({
    mutationFn: async ({ payload }) => {
      const res = (await fetchwithauth({
        endpoint: `${endpoint}/export/zip`,
        method: "POST",
        body: payload,
        responseType: "blob",
      })) as Response;
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "payslip.zip";

      return { blob, filename };
    },
    onSuccess: saveDownload,
  });

  const excel = useMutation({
    mutationFn: async () => {
      const res = (await fetchwithauth({
        endpoint: `${endpoint}/export/excel`,
        method: "POST",
        responseType: "blob",
      })) as Response;
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filename =
        disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? "export.xlsx";

      return { blob, filename };
    },
    onSuccess: saveDownload,
  });

  const sendEmail = useMutation<
    ApiResponse<CreateBatch>,
    Error,
    { payload: SendPayslipEmailDTO }
  >({
    mutationFn: async ({ payload }) => {
      return fetchwithauth({
        endpoint: `/shops/${shopId}/periods/${periodId}/pay-slips/send-email`,
        method: "POST",
        body: { toSend: payload },
      });
    },
  });
  return { pdf, zip, excel, sendEmail };
}
