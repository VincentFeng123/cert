import { useEffect, useRef } from 'react'

type StepMeta = {
  title?: string
  [key: string]: unknown
}

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

interface SimpleChatbotProps {
  moduleContext: ModuleContext
  containerId?: string
  height?: string
}

const SimpleChatbot = ({ moduleContext, containerId = 'chatbot-container', height = '520px' }: SimpleChatbotProps) => {
  const initializedRef = useRef(false)
  const containerIdRef = useRef(containerId)
  const contextRef = useRef(moduleContext)

  useEffect(() => {
    contextRef.current = moduleContext
  }, [moduleContext])

  useEffect(() => {
    if (containerIdRef.current !== containerId) {
      containerIdRef.current = containerId
      initializedRef.current = false
    }

    if (initializedRef.current) return
    initializedRef.current = true

    const componentContainer = document.getElementById(containerId)
    if (!componentContainer) return

    const buildContextSummary = () => {
      const snapshot = contextRef.current

      return [
        `Module: ${snapshot.moduleId}`,
        snapshot.stepData?.title ? `Step: ${snapshot.currentStep} (${snapshot.stepData.title})` : `Step: ${snapshot.currentStep}`,
        typeof snapshot.userProgress === 'number' ? `Progress: ${Math.round(snapshot.userProgress)}%` : null,
        snapshot.studyMode ? `Study mode: ${snapshot.studyMode}` : null,
        snapshot.viewSummary ? `Current view: ${snapshot.viewSummary}` : null,
        snapshot.currentQuestionPrompt ? `Active question: ${snapshot.currentQuestionPrompt}` : null,
        snapshot.focusAreas?.length ? `Focus topics: ${snapshot.focusAreas.join(', ')}` : null
      ].filter(Boolean).join('\n')
    }

    const initialContext = contextRef.current

    const chatbotHTML = `
      <div id="simple-chatbot" style="
        width: 100%;
        height: 100%;
        background: transparent;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
        z-index: 9999999;
        position: relative;
        pointer-events: auto;
      ">
        <div style="
          background: transparent;
          padding: 16px;
          border-radius: 10px 10px 0 0;
          position: relative;
        ">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">AI Training Assistant</h4>
        </div>

        <div id="chat-messages" style="
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        ">
          <div style="
            background: #f1f3f4;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #374151;
          ">
            Hi! I'm your AI training assistant. Ask me anything about ${initialContext.moduleId} training!
          </div>
        </div>

        <div style="
          padding: 12px;
          display: flex;
          gap: 8px;
        ">
          <input
            id="chat-input"
            type="text"
            placeholder="Ask me anything..."
            style="
              flex: 1;
              padding: 8px 12px;
              border: 0.5px solid #d1d5db;
              border-radius: 4px;
              font-size: 12px;
              outline: none;
            "
          />
          <button
            id="chat-send"
            style="
              background: #374151;
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
            "
          >Send</button>
        </div>
      </div>
    `

    const existing = componentContainer.querySelector('#simple-chatbot')
    if (existing) {
      existing.remove()
    }

    componentContainer.innerHTML = chatbotHTML

    if (!document.getElementById('chatbot-styles')) {
      const style = document.createElement('style')
      style.id = 'chatbot-styles'
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #simple-chatbot {
          animation: fadeIn 0.3s ease-out;
        }
        #chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        #chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        #chat-messages::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
        #chat-messages::-webkit-scrollbar-thumb:hover {
          background: #1f2937;
        }
        #chat-messages {
          scrollbar-width: thin;
          scrollbar-color: #374151 transparent;
        }
      `
      document.head.appendChild(style)
    }

    const input = document.getElementById('chat-input') as HTMLInputElement | null
    const button = document.getElementById('chat-send') as HTMLButtonElement | null
    const messages = document.getElementById('chat-messages') as HTMLElement | null

    if (!input || !button || !messages) {
      return () => {
        componentContainer.innerHTML = ''
      }
    }

    const addMessage = (text: string, isUser: boolean) => {
      const messageDiv = document.createElement('div')
      messageDiv.style.cssText = `
        background: ${isUser ? '#374151' : '#f1f3f4'};
        color: ${isUser ? 'white' : '#374151'};
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        max-width: 80%;
        align-self: ${isUser ? 'flex-end' : 'flex-start'};
      `
      messageDiv.textContent = text
      
      messages.appendChild(messageDiv)
    }

    const sendMessage = async () => {
      const text = input.value.trim()
      if (!text) return

      const currentScroll = window.pageYOffset

      addMessage(text, true)
      input.value = ''

      let loadingVisible = false
      const loadingId = 'chat-loading-indicator'
      const loadingTimer = window.setTimeout(() => {
        const loadingDiv = document.createElement('div')
        loadingDiv.id = loadingId
        loadingDiv.style.cssText = `
          background: #f1f3f4;
          color: #374151;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          max-width: 80%;
          align-self: flex-start;
          font-style: italic;
        `
        loadingDiv.textContent = 'Thinking...'
        messages.appendChild(loadingDiv)
        messages.scrollTop = messages.scrollHeight
        loadingVisible = true
      }, 250)

      const clearLoading = () => {
        window.clearTimeout(loadingTimer)
        if (loadingVisible) {
          const existing = messages.querySelector(`#${loadingId}`)
          if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing)
          }
          loadingVisible = false
        }
      }

      const lower = text.toLowerCase()
      const triggerKeywords = [
        'screen', 'see my screen', 'what is on the screen', 'can you see',
        'question on the screen', 'answer on the screen', 'this question', 'current question',
        'help me with the question', 'help me studying', 'help me with the item',
        'what step', 'where am i', 'current step', 'my progress',
        'study guide', 'studying the', 'help with this'
      ]
      const shouldExposeContext = triggerKeywords.some((keyword) => lower.includes(keyword))

      try {
        const baseSystemPrompt = `You are a friendly CPR/Heimlich training assistant helping a learner stay confident and accurate.`
        const contextInstruction = shouldExposeContext
          ? `The learner asked about the current view or question, so you may reference the following context:\n${buildContextSummary()}\nProvide precise help tied to that view.`
          : `You have access to the learner's progress context but the user did not ask about it. Do not mention screen details unless they ask. Focus on answering their question naturally.`

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            moduleContext: {
              moduleId: contextRef.current.moduleId,
              currentStep: contextRef.current.currentStep,
              stepData: contextRef.current.stepData,
              userProgress: contextRef.current.userProgress,
              learningGoal: contextRef.current.learningGoal,
              focusAreas: contextRef.current.focusAreas,
              studyMode: contextRef.current.studyMode,
              viewSummary: contextRef.current.viewSummary,
              quizScore: contextRef.current.quizScore,
              currentQuestionPrompt: contextRef.current.currentQuestionPrompt
            },
            contextSummary: buildContextSummary(),
            systemPrompt: `${baseSystemPrompt}\n\n${contextInstruction}`
          })
        })

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()
        clearLoading()
        addMessage(data.response, false)
        messages.scrollTop = messages.scrollHeight
      } catch (error) {
        console.error('Chat error:', error)
        clearLoading()

        let fallback = "I'm having trouble reaching the AI right now, but I'm ready to keep helping—just let me know what you need."
        if (shouldExposeContext && contextRef.current.currentQuestionPrompt) {
          fallback = `Here's a quick hint for "${contextRef.current.currentQuestionPrompt}": focus on making sure the scene is safe before you approach, then check for responsiveness.`
        }
        addMessage(fallback, false)
        messages.scrollTop = messages.scrollHeight
      }

      window.scrollTo(0, currentScroll)
    }

    button.addEventListener('click', sendMessage)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        sendMessage()
      }
    }
    input.addEventListener('keydown', handleKeyDown)

    return () => {
      button.removeEventListener('click', sendMessage)
      input.removeEventListener('keydown', handleKeyDown)
      componentContainer.innerHTML = ''
      initializedRef.current = false
    }
  }, [containerId])

  const isFullHeight = height === '100%'

  return (
    <div
      id={containerId}
      style={{
        width: '100%',
        height,
        position: isFullHeight ? 'relative' : 'sticky',
        top: isFullHeight ? undefined : '20px',
        zIndex: 9999999,
        pointerEvents: 'auto'
      }}
    />
  )
}

export default SimpleChatbot
