import { redirect } from "next/navigation";

interface OrganizerTournamentKnockoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentKnockoutPage({
  params,
}: OrganizerTournamentKnockoutPageProps) {
  const { id } = await params;
  redirect(`/organizer/t/${id}/structure`);
}
