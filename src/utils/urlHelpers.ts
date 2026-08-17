export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const unslugify = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const buildExamUrl = (
  exam: string,
  tab: string,
  params: Record<string, string | undefined> = {}
): string => {
  const baseUrl = `/exam-preparation/${exam.toLowerCase()}`;
  
  // Define parameter order for different tabs and exams
  const paramOrder: Record<string, Record<string, string[]>> = {
    'iitm-bs': {
      'notes': ['branch', 'level'],
      'pyqs': ['branch', 'level'],
      'syllabus': ['branch', 'level'],
      'tools': ['branch', 'level', 'tool'],
      'courses': ['branch'],
      'news': [],
      'dates': []
    },
    'default': {
      'notes': ['subject', 'class', 'branch', 'level'],
      'syllabus': ['subject', 'class', 'branch', 'level'],
      'pyqs': ['subject', 'class', 'year', 'session', 'branch', 'level']
    }
  };
  
  // Get the order for this exam and tab
  const examConfig = paramOrder[exam.toLowerCase()] || paramOrder['default'];
  const order = examConfig[tab] || Object.keys(params);
  
  // Build params array in the correct order
  const cleanParams = order
    .filter(key => params[key] && params[key] !== 'all')
    .map(key => slugify(params[key]!));
  
  if (cleanParams.length === 0) {
    return `${baseUrl}/${slugify(tab)}`;
  }
  
  return `${baseUrl}/${slugify(tab)}/${cleanParams.join('/')}`;
};

export const parseIITMBSUrl = (pathname: string): {
  tab: string;
  branch?: string;
  level?: string;
  tool?: string;
} => {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length < 3 || parts[0] !== 'exam-preparation' || parts[1] !== 'iitm-bs') {
    return { tab: 'notes' };
  }
  
  const tab = parts[2] || 'notes';
  const urlParams = parts.slice(3);
  
  // Map slugs back to display values
  const branchMap: Record<string, string> = {
    'data-science': 'Data Science',
    'management-data-science': 'Management and Data Science',
    'aeronautics-space-technology': 'Aeronautics and Space Technology',
    'electronic-systems': 'Electronic Systems'
  };
  
  const levelMap: Record<string, string> = {
    'qualifier': 'Qualifier',
    'foundation': 'Foundation',
    'diploma': 'Diploma',
    'degree': 'Degree'
  };
  
  const toolMap: Record<string, string> = {
    'cgpa-calculator': 'cgpa-calculator',
    'grade-calculator': 'grade-calculator',
    'marks-predictor': 'marks-predictor'
  };
  
  let branch: string | undefined;
  let level: string | undefined;
  let tool: string | undefined;
  
  // Parse params based on tab
  if (tab === 'tools') {
    // tools: /branch/level/tool
    if (urlParams[0]) branch = branchMap[urlParams[0]];
    if (urlParams[1]) level = levelMap[urlParams[1]];
    if (urlParams[2]) tool = toolMap[urlParams[2]];
  } else if (tab === 'courses') {
    // courses: /branch
    if (urlParams[0]) branch = branchMap[urlParams[0]];
  } else {
    // notes, pyqs, syllabus: /branch/level
    if (urlParams[0]) branch = branchMap[urlParams[0]];
    if (urlParams[1]) level = levelMap[urlParams[1]];
  }
  
  return { tab, branch, level, tool };
};

export const parseExamUrl = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length < 3 || parts[0] !== 'exam-preparation') {
    return null;
  }
  
  const exam = parts[1];
  const tab = parts[2];
  const params = parts.slice(3);
  
  return {
    exam,
    tab: unslugify(tab).toLowerCase().replace(/\s+/g, '-'),
    params
  };
};

export const getTabFromUrl = (pathname: string): string => {
  const parsed = parseExamUrl(pathname);
  return parsed?.tab || 'notes';
};

export const getParamsFromUrl = (pathname: string): string[] => {
  const parsed = parseExamUrl(pathname);
  return parsed?.params.map(param => unslugify(param)) || [];
};