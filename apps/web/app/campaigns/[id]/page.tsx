import { CampaignView } from '@/components/campaign-view';

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignView campaignId={id} />;
}
