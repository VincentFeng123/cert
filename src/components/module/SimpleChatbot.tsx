import { useEffect, useRef, useState } from 'react'
type StepMeta = { title?: string; [key: string]: unknown }
interface ModuleContext {
  moduleId: string
  currentStep: string
  stepData?: StepMeta
  userProgress?: number
  learningGoal?: string
  focusAreas?: string[]
  studyMode?: string
  viewSummary?: string
  quizScore?: number
  currentQuestionPrompt?: string
}
interface SimpleChatbotProps { moduleContext: ModuleContext; containerId?: string; height?: string }
type Message = { role: 'user' | 'assistant'; text: string; offline?: boolean }
const SimpleChatbot = ({ moduleContext, containerId, height = '480px' }: SimpleChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Need a hand with the lesson? Ask about a concept, or review the key points alongside your practice.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [draftToRetry, setDraftToRetry] = useState('')
  const controller = useRef<AbortController | null>(null)
  const pending = useRef(false)
  const conversation = useRef<HTMLDivElement>(null)
  useEffect(() => () => { controller.current?.abort() }, [])
  useEffect(() => { if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight }, [messages, busy])
  const send = async (text: string) => {
    if (!text.trim() || pending.current) return
    pending.current = true
    setBusy(true)
    setInput('')
    setDraftToRetry('')
    setMessages(previous => [...previous, {role: 'user', text: text.trim()}])
    const request = new AbortController()
    controller.current = request
    const timeout = window.setTimeout(() => request.abort('timeout'), 20000)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: text.trim(), moduleContext }), signal: request.signal })
      if (!response.ok) throw new Error('Service unavailable')
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object' || !('response' in data) || typeof data.response !== 'string' || !data.response.trim()) throw new Error('Empty response')
      setMessages(previous => [...previous, {role: 'assistant', text: data.response as string, offline: 'mode' in data && data.mode === 'offline'}])
    } catch {
      if (request.signal.aborted && request.signal.reason !== 'timeout') return
      setMessages(previous => [...previous, { role: 'assistant', text: 'The assistant is unavailable right now. You can still use every lesson, quiz, and practice activity. Review the key points or the source links for guidance.', offline: true }])
      setDraftToRetry(text)
    } finally {
      window.clearTimeout(timeout)
      pending.current = false
      setBusy(false)
    }
  }
  return <section id={containerId} className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden" style={{height}} aria-label="Training assistant">
    <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-800">Training assistant</h2><p className="text-xs text-slate-400 mt-1">Here to help you understand</p></div>
    <div ref={conversation} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((message, index) => <div key={index} className={`text-sm leading-relaxed rounded-xl px-3 py-3 whitespace-pre-wrap break-words ${message.role === 'user' ? 'bg-slate-800 text-white ml-5' : 'bg-slate-50 text-slate-600 mr-2'}`}>{message.offline && <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Study guidance · AI offline</span>}{message.text}</div>)}
      {busy && <p className="text-xs text-slate-400" role="status">Thinking…</p>}
    </div>
    {draftToRetry && <button className="text-xs underline text-slate-500 text-left px-4 pb-2" onClick={() => void send(draftToRetry)}>Try your question again</button>}
    <form onSubmit={event => { event.preventDefault(); void send(input) }} className="p-3 border-t border-slate-100 flex gap-2">
      <input aria-label="Ask the training assistant" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about this lesson…" maxLength={2000} className="min-w-0 flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
      <button type="submit" disabled={busy || !input.trim()} className="bg-slate-800 text-white rounded-lg text-xs px-3 py-2">Send</button>
    </form>
    <p className="px-4 pb-3 text-[10px] text-slate-400">Educational support. For emergencies, contact emergency services.</p>
  </section>
}
export default SimpleChatbot
