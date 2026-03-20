'use client';

import dynamic from 'next/dynamic';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

export default function DashboardPage() {
  return <TrafficMap />;
}
