import EmployeePresetDetail from "@/app/components/Setting/EmployeePresets/EmployeePresetDetail";

export default async function EmployeePresetPage({
  params,
}: {
  params: Promise<{ presetId: string }>;
}) {
  const { presetId } = await params;
  return <EmployeePresetDetail presetId={Number(presetId)} />;
}
