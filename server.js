import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, moduleContext, contextSummary, systemPrompt: customSystemPrompt } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback to context-aware responses if no API key
      return res.status(200).json({
        response: generateFallbackResponse(message, moduleContext)
      });
    }

    // Use custom system prompt from frontend if provided, otherwise generate one
    const systemPrompt = customSystemPrompt || generateSystemPrompt(moduleContext);

    // Enhance user message with context if provided
    const enhancedMessage = contextSummary
      ? `Context:\n${contextSummary}\n\nUser question: ${message}`
      : message;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: enhancedMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API error:', error);

    // Fallback to context-aware responses on error
    return res.status(200).json({
      response: generateFallbackResponse(message, moduleContext)
    });
  }
});

function generateSystemPrompt(moduleContext) {
  const { moduleId, currentStep, learningGoal, focusAreas } = moduleContext || {};

  let basePrompt = "You are a friendly and knowledgeable first aid training assistant. Provide clear, concise, and accurate medical training information. Keep responses brief (2-3 sentences max). Be encouraging and supportive.\n\nWhen users ask for videos or additional resources, ALWAYS provide actual, working YouTube links and article URLs. IMPORTANT: Only suggest well-known, verified YouTube videos from official channels (American Heart Association, Red Cross, etc.) that you know are publicly available. For YouTube videos, provide the full URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID). For articles, provide full HTTPS URLs to reputable sources.";

  if (learningGoal === 'certification') {
    basePrompt += "\n\nThe learner wants certification-level readiness. Emphasize precision on compression depth, cadence, AED sequencing, and exam-style rationale.";
  } else if (learningGoal === 'refresh') {
    basePrompt += "\n\nThe learner is doing a fast refresh. Spotlight the highest-yield numbers and steps and keep reminders concise.";
  } else if (learningGoal === 'confidence') {
    basePrompt += "\n\nThe learner is building confidence. Reinforce encouragement, calm breathing, and actionable coaching.";
  }

  if (Array.isArray(focusAreas) && focusAreas.length > 0) {
    basePrompt += `\n\nThey have flagged these focus areas for extra review: ${focusAreas.join(', ')}. Weave gentle reminders about these topics into your answers when appropriate.`;
  }

  if (moduleId === 'cpr') {
    basePrompt += "\n\nYou are specifically helping with CPR (Cardiopulmonary Resuscitation) training. Focus on proper technique, compression depth (5-6cm), compression rate (100-120 per minute), and the 30:2 compression-to-breath ratio.";
    basePrompt += "\n\nWhen asked for CPR video resources, ALWAYS use this exact URL: https://www.youtube.com/watch?v=Plse2FOkV4Q - This is a verified CPR training video. Do not make up other video URLs.";

    if (currentStep === 'practice') {
      basePrompt += " The user is currently in the interactive practice phase. Provide real-time feedback on their technique and encourage proper form.";
    } else if (currentStep === 'quiz') {
      basePrompt += " The user is taking a knowledge quiz. Help them understand concepts but don't give away quiz answers directly.";
    }
  } else if (moduleId === 'heimlich') {
    basePrompt += "\n\nYou are specifically helping with Heimlich Maneuver training for choking response. Focus on proper positioning, fist placement (above navel, below ribcage), and quick upward thrusts.";
    basePrompt += "\n\nWhen asked for Heimlich maneuver video resources, recommend videos from reputable medical organizations. Always include the actual YouTube URL.";

    if (currentStep === 'practice') {
      basePrompt += " The user is currently in the interactive practice phase. Provide real-time feedback on their technique.";
    }
  }

  return basePrompt;
}

function generateFallbackResponse(message, moduleContext) {
  const { moduleId, currentStep, learningGoal, focusAreas } = moduleContext || {};
  const lowerMessage = message.toLowerCase();
  const focusReminder = Array.isArray(focusAreas) && focusAreas.length > 0
    ? `Focus especially on ${focusAreas.join(', ')} as you review. `
    : '';
  const goalTone = learningGoal === 'certification'
    ? 'You are working toward certification, so aim for textbook technique and precise timing. '
    : learningGoal === 'refresh'
    ? 'Quick refresh mode—hit the key numbers and sequence. '
    : learningGoal === 'confidence'
    ? 'Keep your mindset steady and trust your practice. '
    : '';

  // Check for screen awareness questions
  const screenKeywords = ['screen', 'see my screen', 'can you see', 'what step', 'where am i', 'current step', 'my progress', 'help with this', 'this question', 'current question'];
  if (screenKeywords.some(keyword => lowerMessage.includes(keyword))) {
    let screenResponse = '';

    if (moduleId === 'cpr') {
      if (currentStep === 'video') {
        screenResponse = `I can see you're watching the CPR Video Tutorial. ${goalTone}`;
      } else if (currentStep === 'knowledge') {
        screenResponse = `I can see you're on the Study Guide. ${goalTone}`;
        if (moduleContext.studyMode === 'flashcards') {
          screenResponse += 'You\'re reviewing flashcards right now. ';
        }
      } else if (currentStep === 'quiz') {
        screenResponse = `I can see you're taking the CPR Quiz. ${goalTone}`;
        if (moduleContext.currentQuestionPrompt) {
          screenResponse += `Current question: "${moduleContext.currentQuestionPrompt}". `;
        }
      } else if (currentStep === 'practice') {
        screenResponse = `I can see you're in the 3D Practice Simulation. ${goalTone}`;
      }
    } else if (moduleId === 'heimlich') {
      if (currentStep === 'video') {
        screenResponse = `I can see you're watching the Heimlich Maneuver video. ${goalTone}`;
      } else if (currentStep === 'knowledge') {
        screenResponse = `I can see you're on the Study Guide. ${goalTone}`;
      } else if (currentStep === 'quiz') {
        screenResponse = `I can see you're taking the Heimlich Quiz. ${goalTone}`;
      } else if (currentStep === 'practice') {
        screenResponse = `I can see you're in the Practice Simulation. ${goalTone}`;
      }
    }

    if (typeof moduleContext.userProgress === 'number') {
      screenResponse += `You're ${Math.round(moduleContext.userProgress)}% through this module. `;
    }

    screenResponse += 'What would you like help with?';
    return screenResponse;
  }

  // Check for video/link requests
  if (lowerMessage.includes('video') || lowerMessage.includes('youtube') || lowerMessage.includes('watch')) {
    if (moduleId === 'cpr') {
      return "Here's an excellent CPR training video: https://www.youtube.com/watch?v=Plse2FOkV4Q\n\nThis video demonstrates proper hand placement, compression depth, and the correct rate for effective CPR.";
    } else if (moduleId === 'heimlich') {
      return "Here's a helpful Heimlich maneuver demonstration: https://www.youtube.com/watch?v=FEr9jjZ6fi8\n\nWatch how to properly position your hands and perform the abdominal thrusts.";
    }
  }

  if (lowerMessage.includes('article') || lowerMessage.includes('read') || lowerMessage.includes('link')) {
    if (moduleId === 'cpr') {
      return "Check out this comprehensive CPR guide: https://www.heart.org/en/health-topics/cardiac-arrest/cardiac-arrest-tools--resources/hands-only-cpr-resources\n\nThe American Heart Association provides detailed information on proper CPR technique.";
    } else if (moduleId === 'heimlich') {
      return "Here's a detailed guide on the Heimlich maneuver: https://www.mayoclinic.org/first-aid/first-aid-choking/basics/art-20056637\n\nMayo Clinic explains when and how to perform this life-saving technique.";
    }
  }

  // CPR-specific responses
  if (moduleId === 'cpr') {
    if (lowerMessage.includes('hand') || lowerMessage.includes('placement')) {
      return `${goalTone}Place the heel of one hand on the center of the chest (lower half of the sternum), then place your other hand on top with fingers interlaced. Keep your arms straight! ${focusReminder}`;
    }
    if (lowerMessage.includes('depth') || lowerMessage.includes('deep')) {
      return `${goalTone}Compress at least 5-6 cm (2-2.5 inches) deep for adults. Use your body weight and keep your arms straight for effective compressions. ${focusReminder}`;
    }
    if (lowerMessage.includes('rate') || lowerMessage.includes('fast') || lowerMessage.includes('bpm')) {
      return `${goalTone}Aim for 100-120 compressions per minute. Think of the beat of 'Stayin' Alive' by the Bee Gees - that's the perfect rhythm! ${focusReminder}`;
    }
    if (lowerMessage.includes('breath') || lowerMessage.includes('rescue')) {
      return `${goalTone}After 30 compressions, give 2 rescue breaths. Tilt the head back, lift the chin, pinch the nose, and blow until you see the chest rise. Each breath should last about 1 second. ${focusReminder}`;
    }
    if (lowerMessage.includes('aed')) {
      return `${goalTone}An AED (Automated External Defibrillator) can restore a normal heart rhythm. Turn it on, follow the voice prompts, and resume CPR immediately after delivering a shock. ${focusReminder}`;
    }
  }

  // Heimlich-specific responses
  if (moduleId === 'heimlich') {
    if (lowerMessage.includes('fist') || lowerMessage.includes('placement')) {
      return "Make a fist with one hand and place the thumb side against the person's abdomen, just above the navel and below the ribcage. Grasp your fist with your other hand.";
    }
    if (lowerMessage.includes('thrust') || lowerMessage.includes('push')) {
      return "Perform quick, upward thrusts into the abdomen. Don't be afraid to use force - this is a life-threatening emergency. Continue until the object is expelled.";
    }
  }

  // Generic helpful responses
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return currentStep === 'practice'
      ? `${goalTone}I'm here to guide you through the practice simulation! Follow the on-screen instructions and feel free to ask about specific techniques. ${focusReminder}`
      : `${goalTone}I'm here to help with your training! Ask me about proper technique, safety considerations, or any step you're unsure about. ${focusReminder}`;
  }

  if (lowerMessage.includes('thank')) {
    return "You're welcome! Keep up the great work with your training. These skills can save lives!";
  }

  // Default response
  return currentStep === 'practice'
    ? `${goalTone}Great question! Focus on following the proper technique shown in the simulation. Remember to stay calm and follow each step carefully. ${focusReminder}`
    : `${goalTone}That's a good question! Remember the key principles you've learned, and don't hesitate to review the study materials if you need a refresher. ${focusReminder}`;
}

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
