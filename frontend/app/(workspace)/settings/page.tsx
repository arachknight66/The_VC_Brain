'use client'

import { BentoCard } from '@/components/layout/bento-card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Moon, Sun, Bell, Shield, User, LogOut, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [theme, setTheme] = useState('dark')
  
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                   (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </h2>
          <BentoCard className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-secondary" />
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Partner Account</h3>
                <p className="text-sm text-muted-foreground">partner@vcbrain.com</p>
                <div className="pt-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Moon className="h-5 w-5" /> Appearance
          </h2>
          <BentoCard className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-medium">Theme Preference</h3>
                <p className="text-sm text-muted-foreground">Select your preferred interface theme.</p>
              </div>
              <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg">
                <button
                  onClick={() => toggleTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  onClick={() => toggleTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
              </div>
            </div>
          </BentoCard>
        </section>

        {/* Notifications (Placeholder) */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h2>
          <BentoCard className="divide-y divide-border">
            {[
              { title: 'New Signals', desc: 'Notify me when high-score signals are detected.' },
              { title: 'Weekly Digest', desc: 'Receive a weekly summary of pipeline activity.' },
              { title: 'System Alerts', desc: 'Crucial platform updates and security alerts.' }
            ].map((item, i) => (
              <div key={i} className="p-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                </div>
              </div>
            ))}
          </BentoCard>
        </section>

        {/* About */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" /> About
          </h2>
          <BentoCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">VC Brain Version</h3>
                <p className="text-sm text-muted-foreground">v2.0.0-beta (Build 842)</p>
              </div>
              <Button variant="outline" size="sm">View Changelog</Button>
            </div>
          </BentoCard>
        </section>
      </div>

      <div className="pt-4 flex justify-end">
        <Button variant="destructive" variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
