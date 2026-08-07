'use client';

import { useFounders } from '@/hooks/use-api';
import { ScoreRing } from '@/components/ui/score-ring';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const STAGES = [
  { id: 'new', label: 'New', color: 'bg-slate-500/10 border-slate-500/20' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'partner_review', label: 'Partner Review', color: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'diligence', label: 'Diligence', color: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'ic', label: 'IC', color: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'invest', label: 'Invest', color: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'pass', label: 'Pass', color: 'bg-red-500/10 border-red-500/20' }
];

export default function PipelinePage() {
  const router = useRouter();
  const { data: response, isLoading } = useFounders();
  const founders = response || [];

  const getStage = (founder: any) => {
    if (founder.screened_out) return 'pass';
    if (founder.memo && (founder.entity_resolution_confidence || 0) > 0.8) return 'ic';
    if (founder.build_evidence?.tier === 'verified_working') return 'diligence';
    if (founder.trust_claims) return 'partner_review';
    if (founder.source_evidence) return 'qualified';
    return 'new';
  };

  const columns = STAGES.map(stage => ({
    ...stage,
    items: founders.filter(f => getStage(f) === stage.id)
  }));

  if (isLoading) {
    return (
      <div className="p-8 h-[calc(100vh-4rem)] flex flex-col space-y-6">
        <Skeleton className="h-10 w-48 rounded-md" />
        <div className="flex-1 flex gap-4 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[300px] h-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 h-[calc(100vh-4rem)] flex flex-col space-y-6 overflow-hidden"
    >
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Deal Flow Pipeline</h1>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex h-full gap-4 min-w-max">
          {columns.map(column => (
            <div key={column.id} className={cn("flex flex-col w-[320px] rounded-xl border p-3", column.color, "bg-card/50")}>
              <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">{column.items.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-1">
                {column.items.map(item => (
                  <motion.div
                    key={item.founder_id}
                    layoutId={item.founder_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5"
                    onClick={() => router.push(`/companies/${item.founder_id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{item.company_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                      </div>
                      <ScoreRing score={item.founder_score?.value || 0} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{item.source_channel || 'Organic'}</Badge>
                      <span>{item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'Recently'}</span>
                    </div>
                  </motion.div>
                ))}
                {column.items.length === 0 && (
                  <div className="h-full flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground">
                    No items in this stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
