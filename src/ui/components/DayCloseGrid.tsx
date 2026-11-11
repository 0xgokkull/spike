'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, type ColDef } from 'ag-grid-community';
import { Money } from '@/ui/primitives/Money';
import { ModeBadge } from '@/ui/primitives/ModeBadge';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DayCloseActionItem {
  id: string;
  caseId: string;
  type: string;
  mode: 'auto' | 'approval';
  amountCents?: number;
  status: string;
  acknowledgedAt?: string | null;
  createdAt: string;
}

export interface DayCloseGridProps {
  items: DayCloseActionItem[];
}

export function DayCloseGrid({ items }: DayCloseGridProps) {
  const columnDefs = useMemo<ColDef<DayCloseActionItem>[]>(() => {
    return [
      {
        headerName: 'Time',
        field: 'createdAt',
        width: 140,
        valueFormatter: (params) => {
          return params.value
            ? new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';
        },
      },
      {
        headerName: 'Case ID',
        field: 'caseId',
        width: 160,
        cellRenderer: (params: { value?: string }) => {
          if (!params.value) return null;
          return <span className="font-mono text-xs font-semibold">#{params.value.slice(0, 8)}</span>;
        },
      },
      {
        headerName: 'Action Type',
        field: 'type',
        width: 160,
        cellRenderer: (params: { value?: string }) => {
          if (!params.value) return null;
          return (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-800">
              {params.value.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        headerName: 'Mode',
        field: 'mode',
        width: 160,
        cellRenderer: (params: { value?: 'auto' | 'approval' }) => {
          if (!params.value) return null;
          return (
            <div className="flex items-center h-full">
              <ModeBadge mode={params.value} />
            </div>
          );
        },
      },
      {
        headerName: 'Amount',
        field: 'amountCents',
        width: 130,
        cellRenderer: (params: { value?: number }) => {
          if (params.value === undefined) return <span className="text-slate-400">—</span>;
          return (
            <div className="flex items-center h-full">
              <Money cents={params.value} className="text-slate-900 font-semibold" />
            </div>
          );
        },
      },
      {
        headerName: 'Ledger Status',
        field: 'acknowledgedAt',
        width: 160,
        cellRenderer: (params: { value?: string | null }) => {
          return params.value ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Acknowledged
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Pending Ack
            </span>
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

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Executed Actions Ledger ({items.length})</h3>
      {items.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No actions executed in today's batch yet.
        </div>
      ) : (
        <div className="ag-theme-alpine w-full h-[320px]">
          <AgGridReact<DayCloseActionItem>
            rowData={items}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
          />
        </div>
      )}
    </div>
  );
}
