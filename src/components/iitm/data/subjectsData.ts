import { Subject } from "../types/gradeTypes";

export const ALL_SUBJECTS: Record<string, Subject[]> = {
  // ==========================================
  // DATA SCIENCE (DS)
  // ==========================================
  foundation: [
    {
      key: "maths1",
      name: "Mathematics 1",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "english1",
      name: "English 1",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "computational",
      name: "Computational Thinking",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "statistics1",
      name: "Statistics 1",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "maths2",
      name: "Mathematics 2",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Activity Bonus (Max 100)", min: 0, max: 100 }
      ]
    },
    {
      key: "english2",
      name: "English 2",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "python",
      name: "Intro to Python Programming",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "statistics2",
      name: "Statistics 2",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    }
  ],
  diploma: [
    {
      key: "machinelearning",
      name: "Machine Learning Foundations",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "ml_techniques",
      name: "Machine Learning Techniques",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Programming Bonus (Max 3)", min: 0, max: 3 }
      ]
    },
    {
      key: "machinelearning_practice",
      name: "Machine Learning Practice",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "KA", label: "Kaggle Avg (KA)", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "business_data_management",
      name: "Business Data Management",
      fields: [
        { id: "GA", label: "Graded Assignments (Max 10)", min: 0, max: 10 },
        { id: "Qz1", label: "Quiz 1 (Max 20)", min: 0, max: 20 },
        { id: "Qz2", label: "Quiz 2 (Max 20)", min: 0, max: 20 },
        { id: "F", label: "End Term Exam (Max 50)", min: 0, max: 50 }
      ]
    },
    {
      key: "business_analytics",
      name: "Business Analytics",
      fields: [
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "A", label: "Assignments Sum (Best 2/3, Max 40)", min: 0, max: 40 },
        { id: "F", label: "End Term Exam (Max 40)", min: 0, max: 40 },
        { id: "Bonus", label: "Game Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "programming_python",
      name: "PDSA using Python",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "OP", label: "OPPE Score", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "databasems",
      name: "Database Management Systems",
      fields: [
        { id: "GAA2", label: "SQL Assignments (W2, W3)", min: 0, max: 100 },
        { id: "GAA3", label: "Prog Assignment (W7)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "OP", label: "OPPE Score", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "appdev1",
      name: "Application Development 1",
      fields: [
        { id: "GLA", label: "Lab Avg (Best 2/5 + W7)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "java_programming",
      name: "Java Programming",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "PE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "PE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "systemcommands",
      name: "System Commands",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "OPPE", label: "OPPE Score", min: 0, max: 100 },
        { id: "BPTA", label: "BPT Avg", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "appdev2",
      name: "Application Development 2",
      fields: [
        { id: "GAA", label: "Assignment Avg (W1, W2)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "intro_dl_genai",
      name: "Intro to DL & GenAI",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "tools_data_science",
      name: "Tools in Data Science",
      fields: [
        { id: "GAA", label: "Graded Assign (GAA)", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    }
  ],
  degree: [
    {
      key: "software_engineering",
      name: "Software Engineering",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "GP1", label: "Group Project 1 (Milestone 1-3)", min: 0, max: 100 },
        { id: "GP2", label: "Group Project 2 (Milestone 4-6)", min: 0, max: 100 },
        { id: "PP", label: "Project Presentation", min: 0, max: 100 },
        { id: "CP", label: "Course Participation", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "software_testing",
      name: "Software Testing",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "deep_learning",
      name: "Deep Learning",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "ai_search",
      name: "AI: Search Methods",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "strat_prof_growth",
      name: "Strategies for Prof. Growth",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GP", label: "Group Project", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "int_bigdata",
      name: "Intro to Big Data",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "c_prog",
      name: "Programming in C",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "deep_learning_cv",
      name: "DL for Computer Vision",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "deep_learning_practice",
      name: "Deep Learning Practice",
      fields: [
        { id: "GA", label: "Assignment Avg (GA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "Qz3", label: "Quiz 3", min: 0, max: 100 },
        { id: "NPPE1", label: "NPPE 1", min: 0, max: 100 },
        { id: "NPPE2", label: "NPPE 2", min: 0, max: 100 },
        { id: "NPPE3", label: "NPPE 3", min: 0, max: 100 },
        { id: "Viva", label: "Viva Score", min: 0, max: 100 }
      ]
    },
    {
      key: "operating_systems",
      name: "Operating Systems",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "special_topics_ml",
      name: "Special Topics in ML (RL)",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GPA", label: "Graded Prog. Assignments", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "corporate_finance",
      name: "Corporate Finance",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "computer_networks",
      name: "Computer Networks",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Prog", label: "Programming Assignment", min: 0, max: 100 }
      ]
    },
    {
      key: "ds_ai_lab",
      name: "Data Science and AI Lab",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "P", label: "Project (Pres + Milestones)", min: 0, max: 100 },
        { id: "V", label: "Viva", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "app_dev_lab",
      name: "Application Development Lab",
      fields: [
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "GA", label: "Weekly Assignments", min: 0, max: 100 },
        { id: "V", label: "Project Viva", min: 0, max: 100 }
      ]
    },
    {
      key: "algo_thinking_bio",
      name: "Algorithmic Thinking (Bio)",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GRPa", label: "GRPa", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "big_data_bio",
      name: "Big Data & Bio Networks",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "market_research",
      name: "Market Research",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "P", label: "Project", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "statistical_computing",
      name: "Statistical Computing",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "advanced_algorithms",
      name: "Advanced Algorithms",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "speech_technology",
      name: "Speech Technology",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "V", label: "Viva", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "mlops",
      name: "MLOPS",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Bonus (Max 5)", min: 0, max: 5 }
      ]
    },
    {
      key: "math_foundations_genai",
      name: "Math Foundations of GenAI",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "NPPE", label: "NPPE", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "theory_computation",
      name: "Theory of Computation",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    }
  ],

  // ==========================================
  // ELECTRONIC SYSTEMS (ES) - NEW
  // ==========================================
  "foundation-electronic-systems": [
    {
      key: "es_english1",
      name: "English 1",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_math1",
      name: "Math for Electronics 1",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_estc",
      name: "Electronic Systems Thinking & Circuits",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_estc_lab",
      name: "ESTC Lab",
      fields: [
        { id: "EXP", label: "Experiment Score", min: 0, max: 100 },
        { id: "RPT", label: "Report Score", min: 0, max: 100 }
      ]
    },
    {
      key: "es_intro_c",
      name: "Intro to C Programming",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "OPPE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "OPPE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_intro_c_lab",
      name: "Intro to C Lab",
      fields: [
        { id: "TLA", label: "Timed Lab Assign. Avg", min: 0, max: 100 },
        { id: "IL", label: "In-Campus Lab", min: 0, max: 100 }
      ]
    },
    {
      key: "es_english2",
      name: "English 2",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_linux",
      name: "Intro to Linux Programming",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "NPPE", label: "NPPE Avg", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "OPE", label: "OPE Score", min: 0, max: 100 },
        { id: "BPTA", label: "BPT Avg", min: 0, max: 100 },
        { id: "VMT", label: "VM Tasks", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_linux_lab",
      name: "Intro to Linux Lab",
      fields: [
        { id: "OL", label: "Online Lab Avg", min: 0, max: 100 },
        { id: "IL", label: "In-Campus Lab", min: 0, max: 100 }
      ]
    },
    {
      key: "es_digital",
      name: "Digital Systems",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_eec",
      name: "Electrical & Electronic Circuits",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 },
        { id: "Bonus", label: "Tutorial Bonus (Max 3)", min: 0, max: 3 }
      ]
    },
    {
      key: "es_electronics_lab",
      name: "Electronics Lab",
      fields: [
        { id: "WE", label: "Weekly Experiments", min: 0, max: 100 },
        { id: "ID", label: "In-person Demo", min: 0, max: 100 }
      ]
    },
    {
      key: "es_embedded_c",
      name: "Embedded C Programming",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GRPA", label: "GRPA Avg", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_embedded_c_lab",
      name: "Embedded C Lab",
      fields: [
        { id: "Viva", label: "Lab Experiment & Viva", min: 0, max: 100 }
      ]
    }
  ],
  "diploma-electronic-systems": [
    {
      key: "es_math2",
      name: "Math for Electronics 2",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_signals",
      name: "Signals and Systems",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GrPA", label: "Programming Avg (GrPA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_python_diploma",
      name: "Python Programming (Diploma)",
      fields: [
        { id: "GAA1", label: "Objective Avg (GAA1)", min: 0, max: 100 },
        { id: "GAA2", label: "Programming Avg (GAA2)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "PE1", label: "OPPE 1", min: 0, max: 100 },
        { id: "PE2", label: "OPPE 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_analog",
      name: "Analog Electronic Systems",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_analog_lab",
      name: "Analog Electronics Lab",
      fields: [
        { id: "WE", label: "Weekly Experiments", min: 0, max: 100 },
        { id: "ID", label: "In-person Demo", min: 0, max: 100 }
      ]
    },
    {
      key: "es_dsp",
      name: "Digital Signal Processing",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "LE", label: "Lab Avg (LE)", min: 0, max: 100 },
        { id: "LV", label: "Lab Viva (LV)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_sensors",
      name: "Sensors and Application",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_sensors_lab",
      name: "Sensors Lab",
      fields: [
        { id: "WE", label: "Weekly Experiments", min: 0, max: 100 },
        { id: "ID", label: "In-person Demo", min: 0, max: 100 }
      ]
    },
    {
      key: "es_dsd",
      name: "Digital System Design",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GRPA", label: "Programming Avg", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_dsd_lab",
      name: "DSD Lab",
      fields: [
        { id: "WE", label: "Weekly Experiments", min: 0, max: 100 },
        { id: "ID", label: "In-person Demo", min: 0, max: 100 }
      ]
    },
    {
      key: "es_control",
      name: "Control Engineering",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    }
  ],
  "degree-electronic-systems": [
    {
      key: "es_comp_org",
      name: "Computer Organization",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_em_fields",
      name: "EM Fields & Transmission Lines",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_epd",
      name: "Electronic Product Design",
      fields: [
        { id: "GAA", label: "Assignments (Max 10)", min: 0, max: 10 },
        { id: "Qz1", label: "Quiz 1 (Max 40)", min: 0, max: 40 },
        { id: "Qz2", label: "Quiz 2 (Max 40)", min: 0, max: 40 },
        { id: "F", label: "End Term Exam (Max 100)", min: 0, max: 100 }
      ]
    },
    {
      key: "es_strategies",
      name: "Strategies for Professional Growth",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "GP", label: "Group Project", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_embedded_linux",
      name: "Embedded Linux and FPGAs",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    },
    {
      key: "es_embedded_linux_lab",
      name: "Embedded Linux Lab",
      fields: [
        { id: "Viva", label: "Lab Experiment & Viva", min: 0, max: 100 }
      ]
    },
    {
      key: "es_testing",
      name: "Electronic Testing & Measurement",
      fields: [
        { id: "GAA", label: "Assignment Avg (GAA)", min: 0, max: 100 },
        { id: "Qz1", label: "Quiz 1", min: 0, max: 100 },
        { id: "Qz2", label: "Quiz 2", min: 0, max: 100 },
        { id: "F", label: "End Term Exam", min: 0, max: 100 }
      ]
    }
  ]
};
