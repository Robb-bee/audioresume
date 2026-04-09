// POST /api/generate-resume - Creates resume from transcript (no AI, just format)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { transcript, email } = req.body || {};

    if (!transcript || !email) {
      return res.status(400).json({ error: 'Missing transcript or email' });
    }

    // Simple parsing - extract name if mentioned, otherwise use placeholder
    const nameMatch = transcript.match(/(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    const name = nameMatch ? nameMatch[1] : email.split('@')[0];
    
    // Extract potential skills (simple keyword matching)
    const skills = [];
    const skillKeywords = ['python', 'javascript', 'java', 'sql', 'excel', 'marketing', 'sales', 'management', 'leader', 'project', 'data', 'analytics', 'design', 'coding', 'programming'];
    const transcriptLower = transcript.toLowerCase();
    skillKeywords.forEach(skill => {
      if (transcriptLower.includes(skill)) skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    });

    // Create simple resume object
    const resume = {
      name,
      email,
      summary: transcript.substring(0, 300) + '...',
      experience: [],
      education: [],
      skills: skills.length > 0 ? skills : ['Various skills mentioned in transcript']
    };

    // Return resume directly (no payment for now)
    res.json({
      resumeId: `resume_${Date.now()}`,
      resume,
      ready: true
    });

  } catch (error) {
    console.error('Generate resume error:', error.message);
    res.status(500).json({ error: 'Failed to generate resume: ' + error.message });
  }
}
