import { redirect } from "next/navigation";

interface OrganizerTournamentKnockoutSetupPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerTournamentKnockoutSetupPage({
  params,
}: OrganizerTournamentKnockoutSetupPageProps) {
  const { id } = await params;
  redirect(`/organizer/t/${id}/structure`);
}
