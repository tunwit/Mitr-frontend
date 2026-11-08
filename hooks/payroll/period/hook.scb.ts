import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";
import { fetchwithauth } from "@/utils/fetcher";
import type { ApiResponse } from "@/types/response";
import type { ScbPreview, ScbRequest } from "@/types/type.scb";

export function useScbPayment(
  periodId: number,
  request: ScbRequest,
  enabled: boolean,
) {
  const { id: shopId } = useCurrentShop();
  const endpoint = `/shops/${shopId}/periods/${periodId}/payments/scb`;
  const preview = useQuery<ApiResponse<ScbPreview>>({
    queryKey: ["scb-payment", shopId, periodId, request],
    enabled: !!shopId && enabled,
    queryFn: () =>
      fetchwithauth({
        endpoint: `${endpoint}/preview`,
        method: "POST",
        body: request,
      }),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
  const download = useMutation({
    mutationKey: ["scb-payment-export", shopId, periodId],
    mutationFn: async (
      body: ScbRequest & { fingerprint: string; acknowledgePaid: boolean },
    ) => {
      const response = (await fetchwithauth({
        endpoint: `${endpoint}/export`,
        method: "POST",
        body,
        responseType: "blob",
      })) as Response;
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ??
        (blob.type.includes("zip") ? "SCB_payroll.zip" : "SCB_payroll.txt");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
  return { preview, download };
}
