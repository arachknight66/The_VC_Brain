'use client'

import { useState, useRef, useEffect } from 'react'
import { useFounders } from '@/hooks/use-api'
import { sendChat } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
}

const SUGGESTED_PROMPTS = [
  'Summarize the top 3 investment opportunities',
  'What are the key risks for the latest founders?',
  'Compare founder scores across the pipeline',
  'Generate a thesis for AI infrastructure investments'
]

export default function CopilotPage() {
  const { data: founders } = useFounders()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFounderId, setSelectedFounderId] = useState<string>('')
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault()
    const content = promptOverride || input
    if (!content.trim()) return

    const newMessage: Message = { id: Date.now().toString(), role: 'user', content }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await sendChat({
        message: content,
        founder_id: selectedFounderId || undefined
      })
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto w-full p-4 md:p-6 gap-4">
      <div className="flex items-center justify-between pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Copilot</h1>
            <p className="text-xs text-muted-foreground">Multi-hop reasoning engine</p>
          </div>
        </div>
        
        {founders && founders.length > 0 && (
          <div className="relative">
            <select 
              className="appearance-none bg-secondary/50 border border-border rounded-md pl-3 pr-8 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              value={selectedFounderId}
              onChange={(e) => setSelectedFounderId(e.target.value)}
            >
              <option value="">All Contexts</option>
              {founders.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.company_name})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="h-full flex flex-col items-center justify-center text-center gap-6"
            >
              <div className="h-16 w-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 ring-1 ring-border/50 shadow-inner">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">How can I help you analyze today?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mt-4">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(undefined, prompt)}
                    className="p-4 text-sm text-left bg-secondary/30 hover:bg-secondary/70 border border-border/50 rounded-xl transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-5 py-3.5 shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-secondary/50 text-foreground rounded-tl-sm border border-border/50"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%]">
            <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      <div className="pt-2 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-secondary/30 border border-border/50 rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about founders, market signals..."
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base py-3 px-2"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="rounded-xl h-10 w-10 shrink-0 mb-0.5 mr-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-center mt-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">AI can make mistakes. Verify important information.</span>
        </div>
      </div>
    </div>
  )
}
