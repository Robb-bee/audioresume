export const config = { runtime: 'nodejs@18' };
// POST /api/generate-resume - Creates resume from transcript
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

    const t = transcript.toLowerCase();
    
    // Extract name
    let name = email.split('@')[0];
    const nameMatch = transcript.match(/(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) name = nameMatch[1];
    
    // Extract email if mentioned
    const emailMatch = transcript.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const finalEmail = emailMatch ? emailMatch[0] : email;

    // Extract skills
    const skills = [];
    const skillKeywords = ['python', 'javascript', 'java', 'sql', 'excel', 'marketing', 'sales', 'management', 'project', 'data', 'analytics', 'design', 'coding', 'programming', 'accounting', 'finance', 'erp', 'sap', 'quickbooks', 'tableau', 'powerpoint', 'word', 'outlook', 'teamwork', 'leadership', 'communication', 'budget', 'forecasting', 'audit', 'tax', 'gaap', 'sox', 'reconciliation', 'reconciliation'];
    skillKeywords.forEach(skill => {
      if (t.includes(skill)) skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    });

    // Extract experience - look for company names with job titles
    const experience = [];
    const companies = ['google', 'amazon', 'microsoft', 'apple', 'meta', 'facebook', 'netflix', 'salesforce', 'oracle', 'sap', 'workday', 'adobe', 'uber', 'lyft', 'airbnb', 'stripe', 'square', 'paypal', 'visa', 'mastercard', 'jpmorgan', 'goldman', 'citi', 'bank of america', 'wells fargo', 'kpmg', 'pwc', 'deloitte', 'ey', 'grant thornton'];
    
    // Try to find work experience patterns
    const workPatterns = [
      /worked at\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
      /working at\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
      /employed at\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
      /as a[n]?\s+([a-zA-Z\s]+)\s+at\s+([A-Z][a-zA-Z]+)/gi,
    ];
    
    for (const pattern of workPatterns) {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        const company = match[1] || match[2];
        const title = match[2] || match[1];
        if (company && company.length > 2 && !experience.find(e => e.company === company)) {
          experience.push({
            company: company,
            title: title || 'Professional',
            years: 'Recent',
            description: 'Experience as noted in audio transcript'
          });
        }
      }
    }
    
    // Look for years
    const yearMatch = transcript.match(/\b(19|20)\d{2}\b/);
    const years = yearMatch ? yearMatch[0] : 'Recent';

    // Extract education
    const education = [];
    const schools = ['stanford', 'mit', 'harvard', 'berkeley', 'ucla', 'usc', 'nyu', 'columbia', 'princeton', 'yale', 'duke', 'northwestern', 'cal state', 'california state', 'san diego state', 'cal poly', 'loyola', 'usc marshall', 'nyu stern'];
    schools.forEach(school => {
      if (t.includes(school)) {
        education.push({
          school: school.charAt(0).toUpperCase() + school.slice(1),
          degree: 'Bachelor\'s Degree',
          year: years
        });
      }
    });
    
    if (education.length === 0 && t.includes('university')) {
      education.push({
        school: 'University Mentioned',
        degree: 'Degree',
        year: years
      });
    }

    // Create summary from transcript
    let summary = '';
    const sentences = transcript.split(/[.!?]/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      summary = sentences.slice(0, 3).join('. ').trim().substring(0, 300);
    }
    if (!summary) {
      summary = `Professional with experience in ${skills.slice(0, 5).join(', ')}`;
    }

    const resume = {
      name,
      email: finalEmail,
      summary,
      experience: experience.length > 0 ? experience : [
        {
          company: 'Company mentioned in recording',
          title: 'Your Title',
          years: years,
          description: transcript.substring(0, 200)
        }
      ],
      education,
      skills: skills.length > 0 ? skills : ['Skills mentioned in recording']
    };

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
