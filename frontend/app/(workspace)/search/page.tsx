'use client'

import { useState, useEffect } from 'react'
import { useFounders, useSignals } from '@/hooks/use-api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon, Users, Activity, History, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BentoCard } from '@/components/layout/bento-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'founders' | 'signals'>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const { data: founders, isLoading: isLoadingFounders } = useFounders()
  const { data: signals, isLoading: isLoadingSignals } = useSignals()

  useEffect(() => {
    const saved = localStorage.getItem('vc_brain_recent_searches')
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)) } catch (e) {}
    }
  }, [])

  const handleSearch = (val: string) => {
    setQuery(val)
    if (val.trim() && !recentSearches.includes(val.trim())) {
      const newRecent = [val.trim(), ...recentSearches].slice(0, 5)
      setRecentSearches(newRecent)
      localStorage.setItem('vc_brain_recent_searches', JSON.stringify(newRecent))
    }
  }

  const isLoading = isLoadingFounders || isLoadingSignals

  const filteredFounders = query.trim() ? founders?.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) || 
    f.company_name.toLowerCase().includes(query.toLowerCase())
  ) : []

  const filteredSignals = query.trim() ? signals?.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) || 
    s.summary.toLowerCase().includes(query.toLowerCase())
  ) : []

  const showFounders = filter === 'all' || filter === 'founders'
  const showSignals = filter === 'all' || filter === 'signals'

  const hasResults = (showFounders && filteredFounders && filteredFounders.length > 0) || 
                     (showSignals && filteredSignals && filteredSignals.length > 0)

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-3xl mx-auto min-h-[calc(100vh-80px)]">
      <div className="w-full mt-10 mb-8 space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            className="w-full pl-14 pr-4 py-8 text-xl rounded-2xl bg-secondary/30 border-2 border-border/50 focus-visible:ring-0 focus-visible:border-primary shadow-sm"
            placeholder="Search founders, companies, or signals..."
            autoFocus
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
              <kbd>Ctrl</kbd>+<kbd>K</kbd>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          {(['all', 'founders', 'signals'] as const).map(f => (
            <Button 
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize rounded-full px-5"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full">
        {!query.trim() ? (
          <div className="w-full">
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" /> Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <Badge 
                      key={s} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80 px-3 py-1.5 text-sm font-normal"
                      onClick={() => setQuery(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-4 w-full">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : hasResults ? (
          <div className="space-y-8 w-full">
            <AnimatePresence>
              {showFounders && filteredFounders && filteredFounders.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4" /> Founders & Companies
                  </h3>
                  <div className="grid gap-3">
                    {filteredFounders.map(f => (
                      <BentoCard key={f.id} className="p-4 hover:border-primary/50 cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{f.name}</h4>
                            <p className="text-sm text-muted-foreground">{f.company_name}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </BentoCard>
                    ))}
                  </div>
                </motion.div>
              )}

              {showSignals && filteredSignals && filteredSignals.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mt-8">
                    <Activity className="h-4 w-4" /> Signals
                  </h3>
                  <div className="grid gap-3">
                    {filteredSignals.map(s => (
                      <BentoCard key={s.id} className="p-4 hover:border-primary/50 cursor-pointer group">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium line-clamp-1">{s.title}</h4>
                            <Badge variant="outline" className="capitalize text-xs shrink-0">{s.source}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.summary}</p>
                        </div>
                      </BentoCard>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="No results found"
            description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
          />
        )}
      </div>
    </div>
  )
}
