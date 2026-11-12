'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, type ColDef, type RowClickedEvent } from 'ag-grid-community';
import type { CaseListItem, Reason } from '@/domain/types';
import { StatusBadge } from '@/ui/primitives/StatusBadge';
import { ModeBadge } from '@/ui/primitives/ModeBadge';
import { Money } from '@/ui/primitives/Money';
import { DeadlineChip } from '@/ui/primitives/DeadlineChip';
import { SimulatedLabel } from '@/ui/primitives/SimulatedLabel';
import { formatMoney } from '@/lib/money';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface QueueGridProps {
  items: CaseListItem[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
  isLoading?: boolean;
}

const REASON_LABELS: Record<Reason, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: 'Item Not Received',
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: 'Not as Described',
  UNAUTHORISED: 'Unauthorised Transaction',
  BUYER_CANCELLED_SERVICE: 'Buyer Cancelled',
  OTHER: 'Other / Inquiries',
};

export function QueueGrid({ items, onSelect, selectedId, isLoading = false }: QueueGridProps) {
  const columnDefs = useMemo<ColDef<CaseListItem>[]>(() => {
    return [
      {
        headerName: 'Deadline',
        field: 'deadlineAt',
        width: 150,
        minWidth: 140,
        cellRenderer: (params: { value: string | null }) => {
          return (
            <div className="flex items-center h-full">
              <DeadlineChip deadlineAt={params.value} />
            </div>
          );
        },
      },
      {
        headerName: 'Case',
        field: 'id',
        flex: 1.2,
        minWidth: 205,
        cellRenderer: (params: { data?: CaseListItem }) => {
          if (!params.data) return null;
          const shortId = params.data.id.slice(0, 8);
          return (
            <div className="flex items-center gap-2 h-full">
              <span className="font-mono text-xs font-semibold text-slate-900">
                #{shortId}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200/60 uppercase tracking-tight">
                {params.data.source === 'dispute' ? 'Dispute' : 'Refund'}
              </span>
              {params.data.simulated && <SimulatedLabel />}
            </div>
          );
        },
      },
      {
        headerName: 'Reason',
        field: 'reason',
        flex: 1.2,
        minWidth: 200,
        valueFormatter: (params) => {
          return params.value ? REASON_LABELS[params.value as Reason] || params.value : '—';
        },
      },
      {
        headerName: 'Amount at Risk',
        field: 'amountCents',
        width: 165,
        minWidth: 155,
        cellRenderer: (params: { value?: number }) => {
          return (
            <div className="flex items-center h-full">
              <Money cents={params.value ?? 0} className="text-slate-900 font-semibold" />
            </div>
          );
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 155,
        minWidth: 145,
        cellRenderer: (params: { data?: CaseListItem }) => {
          if (!params.data) return null;
          return (
            <div className="flex items-center h-full">
              <StatusBadge status={params.data.status} />
            </div>
          );
        },
      },
      {
        headerName: 'Recommended Action',
        field: 'recommendation',
        flex: 1.4,
        minWidth: 220,
        cellRenderer: (params: { data?: CaseListItem }) => {
          const rec = params.data?.recommendation;
          if (!rec) {
            return <span className="text-xs text-slate-400 italic">Pending analysis</span>;
          }

          let actionText = rec.action.toUpperCase();
          if (rec.action === 'refund' && rec.amountCents) {
            actionText = `Refund ${formatMoney(rec.amountCents)}`;
          } else if (rec.action === 'contest') {
            actionText = 'Contest Dispute';
          } else if (rec.action === 'accept_claim') {
            actionText = 'Concede Claim';
          } else if (rec.action === 'reply') {
            actionText = 'Send Reply';
          }

          return (
            <div className="flex items-center h-full">
              <span className="text-xs font-semibold text-slate-800">{actionText}</span>
            </div>
          );
        },
      },
      {
        headerName: 'Mode',
        width: 175,
        minWidth: 165,
        cellRenderer: (params: { data?: CaseListItem }) => {
          const rec = params.data?.recommendation;
          if (!rec) return <span className="text-slate-400">—</span>;
          return (
            <div className="flex items-center h-full">
              <ModeBadge mode={rec.mode} />
            </div>
          );
        },
      },
    ];
  }, []);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      resizable: true,
      suppressMovable: true,
    };
  }, []);

  const handleRowClick = (event: RowClickedEvent<CaseListItem>) => {
    if (event.data?.id) {
      onSelect(event.data.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-400">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-medium text-slate-500">Loading dispute queue...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <span className="text-xl">✓</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Queue is Clear</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            All PayPal disputes and refund requests are currently resolved. Incoming cases will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="ag-theme-alpine w-full h-full flex-1 min-h-[420px]">
          <AgGridReact<CaseListItem>
            theme="legacy"
            rowData={items}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onRowClicked={handleRowClick}
            rowSelection="single"
            rowHeight={48}
            headerHeight={38}
            animateRows={true}
          />
        </div>
      )}
    </div>
  );
}
