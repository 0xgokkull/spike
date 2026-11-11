'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CaseDrawer } from '@/ui/components/CaseDrawer';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = typeof params?.id === 'string' ? params.id : null;

  return (
    <div className="flex-1 bg-slate-900/30 flex items-center justify-center p-6">
      <CaseDrawer
        caseId={caseId}
        onClose={() => router.push('/')}
        onCaseUpdated={() => router.push('/')}
      />
    </div>
  );
}
