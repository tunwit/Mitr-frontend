"use client";

import AuditLogPage from "@/app/components/AuditLog/AuditLogPage";
import { useCurrentShop } from "@/hooks/shop/useCurrentShop";

export default function Page() {
  const { id, name } = useCurrentShop();

  return <AuditLogPage key={id} shopId={id} fallbackShopName={name ?? ""} />;
}
