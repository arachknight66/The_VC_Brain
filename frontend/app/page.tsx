export const dynamic = 'force-dynamic'

import { getAppUser } from './app-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Radar, ShieldCheck, Bot, ArrowRight, Activity, Zap, CheckCircle2 } from 'lucide-react'

export default async function LandingPage({ searchParams }: { searchParams: { auth_error?: string } }) {
  const user = await getAppUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 selection:bg-primary/30 selection:text-primary-foreground font-sans overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-[100%] blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">VC Brain</span>
        </div>
        <div>
          <Link 
            href="/api/auth/google/start?return_to=/dashboard"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {searchParams.auth_error && (
        <div className="relative z-50 max-w-md mx-auto mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
          Authentication failed. Please try again. ({searchParams.auth_error})
        </div>
      )}

      {/* Hero */}
      <main className="relative z-10 pt-20 pb-32 max-w-7xl mx-auto w-full px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">Evidence-first venture intelligence</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">VC Brain</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          From sourcing signal to investment decision. Evidence-backed memos, AI-powered diligence, and portfolio intelligence in one unified platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/api/auth/google/start?return_to=/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            Get Started with Google <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-semibold rounded-full hover:bg-white/10 border border-white/10 transition-colors">
            Watch demo
          </button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-blue-900/20 overflow-hidden ring-1 ring-white/5">
          <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto w-64 h-6 bg-white/5 rounded-md" />
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70">
            <div className="md:col-span-2 space-y-6">
              <div className="h-32 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 flex flex-col justify-between">
                <div className="w-32 h-4 bg-white/10 rounded" />
                <div className="w-48 h-8 bg-white/20 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="h-48 rounded-xl bg-white/5 border border-white/5" />
                <div className="h-48 rounded-xl bg-white/5 border border-white/5" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-24 rounded-xl bg-white/5 border border-white/5" />
              <div className="h-24 rounded-xl bg-white/5 border border-white/5" />
              <div className="h-24 rounded-xl bg-white/5 border border-white/5" />
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-y border-white/10 bg-white/[0.02] py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Radar className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Discovery Engine</h3>
            <p className="text-zinc-400 leading-relaxed">
              Continuously scan GitHub, X, Product Hunt, and SEC filings for founder signals before the rest of the market.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <ShieldCheck className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Evidence Intelligence</h3>
            <p className="text-zinc-400 leading-relaxed">
              Every claim is mapped to source records with SHA-256 evidence receipts, ensuring bulletproof diligence.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Bot className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">AI Copilot</h3>
            <p className="text-zinc-400 leading-relaxed">
              Multi-hop reasoning engine for investment thesis generation, risk assessment, and competitor analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-white tracking-tight">500+</div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Signals Processed</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-white tracking-tight">14s</div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Avg Memo Time</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-white tracking-tight">99.9%</div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Uptime</div>
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <div className="text-4xl font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest mt-2">SOC 2 Compliant</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative z-10 text-center">
        <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} VC Brain. All rights reserved.</p>
      </footer>
    </div>
  )
}
