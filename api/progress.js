// Vercel serverless function for user progress tracking
// This would typically connect to a database like SQLite/PostgreSQL
// For now, we'll use in-memory storage (resets on function restart)

let userProgress = {};

export default function handler(req, res) {
  const { method, body, query } = req;
  
  if (method === 'GET') {
    // Get user progress
    const { userId, moduleId } = query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const progress = userProgress[userId] || {};
    
    if (moduleId) {
      res.status(200).json(progress[moduleId] || { completed: false, currentStep: 0, score: 0 });
    } else {
      res.status(200).json(progress);
    }
  } else if (method === 'POST') {
    // Update user progress
    const { userId, moduleId, stepId, data } = body;
    
    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'User ID and Module ID are required' });
    }
    
    if (!userProgress[userId]) {
      userProgress[userId] = {};
    }
    
    if (!userProgress[userId][moduleId]) {
      userProgress[userId][moduleId] = {
        completed: false,
        currentStep: 0,
        score: 0,
        startedAt: new Date().toISOString(),
        steps: {}
      };
    }
    
    const moduleProgress = userProgress[userId][moduleId];
    
    if (stepId) {
      moduleProgress.steps[stepId] = {
        completed: true,
        completedAt: new Date().toISOString(),
        ...data
      };
      
      // Update current step
      const stepOrder = ['video', 'knowledge', 'quiz', 'practice'];
      const currentStepIndex = stepOrder.indexOf(stepId);
      if (currentStepIndex >= moduleProgress.currentStep) {
        moduleProgress.currentStep = currentStepIndex + 1;
      }
      
      // Check if module is completed
      if (stepId === 'practice') {
        moduleProgress.completed = true;
        moduleProgress.completedAt = new Date().toISOString();
      }
    }
    
    if (data?.score !== undefined) {
      moduleProgress.score = Math.max(moduleProgress.score, data.score);
    }
    
    res.status(200).json(moduleProgress);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}