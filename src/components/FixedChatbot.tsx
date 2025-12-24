import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'

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
}

interface FixedChatbotProps {
  moduleContext: ModuleContext
}

interface Message {
  text: string
  isUser: boolean
}

const FixedChatbot = ({ moduleContext }: FixedChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Initialize chat only once
  useEffect(() => {
    if (!initializedRef.current) {
      setMessages([{ text: `Hi! I'm your AI training assistant. Ask me anything about ${moduleContext.moduleId} training!`, isUser: false }])
      initializedRef.current = true
      return
    }

    setMessages([{ text: `Back again for ${moduleContext.moduleId.toUpperCase()} training? I'm ready to help!`, isUser: false }])
  }, [moduleContext.moduleId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    // Add user message
    setMessages(prev => [...prev, { text, isUser: true }])
    setInputValue('')
    setIsLoading(true)

    // Build rich context for AI
    const contextMessage = buildContextualResponse(text, moduleContext)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          moduleContext: {
            moduleId: moduleContext.moduleId,
            currentStep: moduleContext.currentStep,
            stepData: moduleContext.stepData,
            userProgress: moduleContext.userProgress,
            learningGoal: moduleContext.learningGoal,
            focusAreas: moduleContext.focusAreas
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      setMessages(prev => [...prev, { text: data.response, isUser: false }])
    } catch (error) {
      console.error('Chat error:', error)
      // Use contextual fallback response
      setMessages(prev => [...prev, {
        text: contextMessage,
        isUser: false
      }])
    } finally {
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)
    }
  }

  // Context-aware response builder with detailed screen information
  const buildContextualResponse = (question: string, context: ModuleContext): string => {
    const q = question.toLowerCase()

    // Build detailed context description based on current step
    let contextInfo = ""

    if (context.learningGoal === 'certification') {
      contextInfo += 'You are aiming for certification-level mastery. Expect precise reminders about ratios and AED timing. '
    } else if (context.learningGoal === 'refresh') {
      contextInfo += 'You selected a quick refresh, so the guidance will prioritize the must-know numbers first. '
    }

    if (context.focusAreas?.length) {
      contextInfo += `Focus areas saved for review: ${context.focusAreas.join(', ')}. `
    }

    if (context.moduleId === 'cpr') {
      if (context.currentStep === 'video') {
        contextInfo += "You're currently on the CPR Video Tutorial step. On your screen, you should see a video about CPR training. "
      } else if (context.currentStep === 'knowledge') {
        contextInfo += "You're currently viewing the CPR Study Guide. On your screen, you should see 7 sections covering: 1) Scene Safety & Initial Steps, 2) Checking Breathing & Signs of Cardiac Arrest, 3) Chest Compressions (hand position, posture, technique with 5-6cm depth and 100-120 BPM rate), 4) Rescue Breaths (head tilt-chin lift technique), 5) CPR Cycle (30:2 ratio), 6) AED Use, and 7) Key Principles to Remember. "
      } else if (context.currentStep === 'quiz') {
        contextInfo += "You're currently taking the CPR Knowledge Quiz. On your screen, you should see quiz questions testing your knowledge of CPR procedures, compression techniques, rates, depths, and emergency response protocols. "
      } else if (context.currentStep === 'practice') {
        contextInfo += "You're currently in the Interactive CPR Practice simulation. On your screen, you should see a 3D simulation environment where you can practice the actual CPR steps. "
      }
    }

    // Add specific help for "what's on screen" type questions
    if (q.includes('see') || q.includes('screen') || q.includes('showing') || q.includes('display')) {
      return contextInfo + `You're on the "${context.stepData?.title || context.currentStep}" step of ${context.moduleId.toUpperCase()} training. What specific question do you have about what you're seeing?`
    }

    // CPR-specific responses with context
    if (context.moduleId === 'cpr') {
      if (context.currentStep === 'practice') {
        if (q.includes('bpm') || q.includes('rate') || q.includes('fast')) {
          return contextInfo + "The target compression rate is 100-120 BPM (compressions per minute). Try to maintain a steady rhythm - about 2 compressions per second."
        }
        if (q.includes('deep') || q.includes('depth') || q.includes('how hard')) {
          return contextInfo + "Compressions should be 5-6cm (2-2.4 inches) deep. Press firmly on the center of the chest!"
        }
        if (q.includes('where') || q.includes('hand') || q.includes('place')) {
          return contextInfo + "Place your hands on the center of the chest (lower sternum), one hand on top of the other. Click the green target in the simulation."
        }
        if (q.includes('how many') || q.includes('count')) {
          return contextInfo + "You need to perform 30 compressions at the correct rate (100-120 BPM) to complete this step."
        }
        if (q.includes('scene') || q.includes('safety') || q.includes('hazard')) {
          return contextInfo + "Always check for hazards first! Look around the scene for dangers like traffic, fire, or electrical hazards. Pan the camera 360 degrees."
        }
        if (q.includes('head') || q.includes('tilt') || q.includes('airway')) {
          return contextInfo + "Tilt the head back and lift the chin to open the airway. Drag the head in the simulation to tilt it back about 60 degrees."
        }
      }

      if (context.currentStep === 'knowledge') {
        if (q.includes('bpm') || q.includes('rate')) {
          return contextInfo + "According to the study guide on your screen, the compression rate should be 100-120 compressions per minute."
        }
        if (q.includes('depth') || q.includes('deep')) {
          return contextInfo + "The study guide shows that compressions should be 5-6cm (2-2.5 inches) deep in adults."
        }
        if (q.includes('ratio') || q.includes('30') || q.includes('breath')) {
          return contextInfo + "The study guide explains the standard CPR cycle is 30 compressions : 2 breaths."
        }
        if (q.includes('hand') || q.includes('place')) {
          return contextInfo + "The study guide shows hand placement should be on the lower half of the sternum (center of chest), with one hand on top of the other, fingers interlaced."
        }
      }

      if (context.currentStep === 'quiz') {
        if (q.includes('answer') || q.includes('help')) {
          return contextInfo + "I can help explain CPR concepts, but I can't give you the quiz answers directly. Try thinking through the scenario based on what you learned in the study guide!"
        }
      }

      // General CPR questions with context
      if (q.includes('step') || q.includes('next') || q.includes('do now') || q.includes('current')) {
        return contextInfo + `You're currently on: ${context.stepData?.title || context.currentStep}. ${context.currentStep === 'practice' ? 'Follow the instructions on the left sidebar to complete this step.' : 'Review the content carefully before moving to the next step.'}`
      }
      if (q.includes('start') || q.includes('begin') || q.includes('how to')) {
        return contextInfo + "CPR follows these steps: 1) Check scene safety, 2) Check responsiveness and breathing, 3) Call for help, 4) Perform chest compressions (100-120 BPM, 5-6cm deep), 5) Give rescue breaths (30:2 ratio), 6) Use AED when available."
      }
    }

    // Heimlich-specific responses
    if (context.moduleId === 'heimlich') {
      if (q.includes('where') || q.includes('fist') || q.includes('place')) {
        return "Place your fist above the navel but below the ribcage. Grasp it with your other hand and perform quick upward thrusts."
      }
      if (q.includes('thrust') || q.includes('push') || q.includes('how')) {
        return "Perform quick, upward thrusts into the abdomen. Each thrust should be forceful enough to dislodge the obstruction."
      }
      if (q.includes('chok') || q.includes('sign')) {
        return "Signs of choking: inability to speak, difficulty breathing, weak/ineffective cough, or clutching the throat (universal choking sign)."
      }
    }

    // Enhanced general fallback with context
    return contextInfo + "I can see what's on your screen and I'm here to help! Ask me about the current content, specific techniques, or what to do next in your training."
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      width: '100%',
      height: 'calc(50vh + 10px)',
      minHeight: '430px',
      background: 'rgba(255, 255, 255, 0.01)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      pointerEvents: 'auto',
      position: 'relative',
      zIndex: 2147483646
    }}>
      {/* Header */}
      <div style={{
        background: 'transparent',
        padding: '16px',
        borderRadius: '10px 10px 0 0',
        position: 'relative'
      }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          AI Training Assistant
        </h4>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              background: message.isUser ? '#374151' : '#f1f3f4',
              color: message.isUser ? 'white' : '#374151',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              maxWidth: '80%',
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              wordWrap: 'break-word'
            }}
          >
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div style={{
            background: '#f1f3f4',
            color: '#374151',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            maxWidth: '80%',
            alignSelf: 'flex-start',
            fontStyle: 'italic'
          }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px',
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.01)',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 2147483646
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            outline: 'none',
            pointerEvents: 'auto',
            background: 'white',
            position: 'relative',
            zIndex: 2147483647
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          style={{
            background: '#374151',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 2147483647,
            opacity: isLoading ? 0.6 : 1
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        /* Scrollbar styles */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #1f2937;
        }
      `}</style>
    </div>
  )
}

export default FixedChatbot
