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
}

const REASON_LABELS: Record<Reason, string> = {
  MERCHANDISE_OR_SERVICE_NOT_RECEIVED: 'Item Not Received',
  MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: 'Not as Described',
  UNAUTHORISED: 'Unauthorised Transaction',
  BUYER_CANCELLED_SERVICE: 'Buyer Cancelled',
  OTHER: 'Other / Inquiries',
};

export function QueueGrid({ items, onSelect, selectedId }: QueueGridProps) {
  const columnDefs = useMemo<ColDef<CaseListItem>[]>(() => {
    return [
      {
        headerName: 'Deadline',
        field: 'deadlineAt',
        width: 145,
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
        width: 200,
        cellRenderer: (params: { data?: CaseListItem }) => {
          if (!params.data) return null;
          const shortId = params.data.id.slice(0, 8);
          return (
            <div className="flex items-center gap-1.5 h-full">
              <span className="font-mono text-xs font-semibold text-slate-800">
                #{shortId}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
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
        width: 180,
        valueFormatter: (params) => {
          return params.value ? REASON_LABELS[params.value as Reason] || params.value : '—';
        },
      },
      {
        headerName: 'Amount at Risk',
        field: 'amountCents',
        width: 130,
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
        width: 150,
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
        width: 190,
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
              <span className="text-xs font-medium text-slate-800">{actionText}</span>
            </div>
          );
        },
      },
      {
        headerName: 'Mode',
        width: 150,
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
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-700">No cases in queue</p>
          <p className="text-xs text-slate-400 mt-1">
            Incoming PayPal disputes and refund requests will appear here.
          </p>
        </div>
      ) : (
        <div className="ag-theme-alpine w-full h-[520px]">
          <AgGridReact<CaseListItem>
            rowData={items}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onRowClicked={handleRowClick}
            rowSelection="single"
            rowClass="cursor-pointer hover:bg-slate-50 transition-colors"
            animateRows={true}
          />
        </div>
      )}
    </div>
  );
}
