'use client';

import { useState, useMemo } from 'react';
import { useFounders } from '@/hooks/use-api';
import { DataTable } from '@/components/ui/data-table';
import { ScoreRing } from '@/components/ui/score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';

export default function CompaniesPage() {
  const router = useRouter();
  const { data: response, isLoading } = useFounders();
  const founders = response || [];
  
  const [filter, setFilter] = useState<'All' | 'Active' | 'Screened Out' | 'High Confidence'>('All');
  const [search, setSearch] = useState('');

  const filteredFounders = useMemo(() => {
    let result = founders;
    if (filter === 'Active') result = result.filter(f => !f.screened_out);
    if (filter === 'Screened Out') result = result.filter(f => f.screened_out);
    if (filter === 'High Confidence') result = result.filter(f => f.entity_resolution_confidence && f.entity_resolution_confidence > 0.8);
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(f => 
        (f.company_name && f.company_name.toLowerCase().includes(s)) ||
        (f.name && f.name.toLowerCase().includes(s))
      );
    }
    
    return result;
  }, [founders, filter, search]);

  const columns = [
    {
      accessorKey: 'company_name',
      header: 'Company Name',
      cell: (row: any) => (
        <div className="font-medium">{row.company_name || 'Unknown'}</div>
      )
    },
    {
      accessorKey: 'name',
      header: 'Founder',
      cell: (row: any) => (
        <div className="text-sm text-muted-foreground">{row.name}</div>
      )
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: (row: any) => (
        <ScoreRing score={row.founder_score?.value || 0} size="sm" />
      )
    },
    {
      accessorKey: 'build_tier',
      header: 'Build Tier',
      cell: (row: any) => (
        <Badge variant="secondary">{row.build_evidence?.tier || 'N/A'}</Badge>
      )
    },
    {
      accessorKey: 'source_channel',
      header: 'Source Channel',
      cell: (row: any) => (
        <Badge variant="outline">{row.source_channel || 'Unknown'}</Badge>
      )
    },
    {
      accessorKey: 'entity_confidence',
      header: 'Entity Confidence',
      cell: (row: any) => {
        const conf = row.entity_resolution_confidence || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${conf * 100}%` }} />
            </div>
            <span className="text-xs">{Math.round(conf * 100)}%</span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors pl-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {['All', 'Active', 'Screened Out', 'High Confidence'].map((f) => (
          <Badge 
            key={f} 
            variant={filter === f ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter(f as any)}
          >
            {f}
          </Badge>
        ))}
      </div>

      {filteredFounders.length === 0 ? (
        <EmptyState title="No companies found" description="Try adjusting your filters or search." />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <DataTable 
            columns={columns} 
            data={filteredFounders} 
            onRowClick={(row) => router.push(`/companies/${row.id}`)}
          />
        </div>
      )}
    </motion.div>
  );
}
