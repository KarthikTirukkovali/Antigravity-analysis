'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDynamicStats, fmtNum, fmt, fmtPct } from '@/lib/stats'

type Message = {
  id: number
  sender: 'user' | 'bot'
  text: string | React.ReactNode
}

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Hello! I am your FactoryPulse AI assistant. Ask me questions or use commands like /uptime, /top, or /summary.' }
  ])
  const stats = useDynamicStats()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }])
    setInput('')

    // Bot Response Logic
    setTimeout(() => {
      let botResp: React.ReactNode = ''
      const q = userMsg.toLowerCase()

      if (q.startsWith('/uptime')) {
        botResp = `Current fleet uptime is **${fmtPct(stats.summary.uptime_pct)}** across ${stats.summary.unique_machines} machines.`
      } else if (q.startsWith('/top')) {
        const top = stats.top_machines.slice(0, 3)
        botResp = (
          <div>
            <strong>Top 3 Machines by Volume:</strong>
            <ul style={{ paddingLeft: 16, marginTop: 4, marginBottom: 0 }}>
              {top.map(m => (
                <li key={m.machine}>{m.machine} — {fmtNum(m.total_quantity)}</li>
              ))}
            </ul>
          </div>
        )
      } else if (q.startsWith('/summary')) {
        botResp = `Processed ${fmtNum(stats.summary.total_readings)} readings. Total volume: ${fmtNum(stats.summary.total_quantity)}. Avg speed: ${fmt(stats.summary.avg_speed)}.`
      } else if (q.startsWith('/clear')) {
        setMessages([{ id: Date.now(), sender: 'bot', text: 'Chat cleared.' }])
        return
      } else {
        botResp = "I'm a simulated assistant for this demo. Try commands like /uptime, /top, or /summary based on the selected timeline."
      }

      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: botResp }])
    }, 400)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--brand)', color: '#fff', border: 'none',
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', transition: 'transform 0.2s'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chat-window" style={{
          position: 'fixed', bottom: 96, right: 24, zIndex: 9998,
          width: 340, height: 480, background: '#12121a',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            FactoryPulse Assistant
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                background: m.sender === 'user' ? 'var(--brand)' : 'rgba(255,255,255,0.05)',
                color: '#fff', padding: '10px 14px', borderRadius: 8,
                maxWidth: '85%', fontSize: '0.85rem', lineHeight: 1.5,
                borderBottomRightRadius: m.sender === 'user' ? 2 : 8,
                borderBottomLeftRadius: m.sender === 'bot' ? 2 : 8
              }}>
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, background: 'rgba(255,255,255,0.01)' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask or type /command..."
              style={{ flex: 1, background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}
            />
            <button type="submit" style={{ background: 'var(--brand)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
