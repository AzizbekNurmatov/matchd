import { redirect } from "next/navigation";

export default async function UfcEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/fights?event=${id}`);
}
