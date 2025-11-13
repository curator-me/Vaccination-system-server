import { VACCINE_TRAINING_DATA } from "./chatbotData.js";

export function detectVaccineIntent(message) {
  const lowerMessage = message.toLowerCase().trim();

  // Check all FAQ categories for keyword matches
  for (const [category, faqs] of Object.entries(VACCINE_TRAINING_DATA)) {
    for (const faq of faqs) {
      for (const keyword of faq.keywords) {
        if (lowerMessage.includes(keyword)) {
          return {
            type: category,
            confidence: "high",
            matched_keyword: keyword,
            is_faq: true,
            faq_question: faq.question,
          };
        }
      }
    }
  }

  // Simple pattern matching for categories
  const intentPatterns = [
    {
      type: "faq_general",
      patterns: [/what is|how does|explain|meaning|কী|কিভাবে/],
      confidence: "high",
    },
    {
      type: "faq_myth_busting",
      patterns: [/myth|false|rumor|conspiracy|not true|মিথ|গুজব/],
      confidence: "high",
    },
    {
      type: "guidance_before_vaccination",
      patterns: [/prepare|before|ready|bring|প্রস্তুতি|আগে/],
      confidence: "high",
    },
    {
      type: "guidance_after_vaccination",
      patterns: [/after|post|care|management|পরের|যত্ন/],
      confidence: "high",
    },
    {
      type: "guidance_special_cases",
      patterns: [/pregnant|chronic|disease|missed|late|গর্ভবতী|বিলম্ব/],
      confidence: "high",
    },
    {
      type: "practical_info",
      patterns: [/where|center|location|cost|price|কেন্দ্র|খরচ/],
      confidence: "high",
    },
    {
      type: "emergency_support",
      patterns: [/emergency|contact|help|report|problem|জরুরি|রিপোর্ট/],
      confidence: "high",
    },
    {
      type: "child_vaccination",
      patterns: [/child|baby|schedule|bcg|opv|polio|শিশু|সময়সূচী/],
      confidence: "high",
    },
    {
      type: "greeting",
      patterns: [/hello|hi|hey|good morning|good afternoon|হ্যালো|নমস্কার/],
      confidence: "high",
    },
    {
      type: "thanks",
      patterns: [/thanks|thank you|appreciate|grateful|ধন্যবাদ/],
      confidence: "high",
    },
  ];

  for (const intent of intentPatterns) {
    for (const pattern of intent.patterns) {
      if (pattern.test(lowerMessage)) {
        return {
          type: intent.type,
          confidence: intent.confidence,
          matched_pattern: pattern.toString(),
          is_faq: false,
        };
      }
    }
  }

  return {
    type: "general",
    confidence: "low",
    is_faq: false,
  };
}

// RESPONSE GENERATOR 
export function getRuleBasedResponse(message, intent) {
  const lowerMessage = message.toLowerCase();

  // Try to find exact FAQ match first
  if (intent.is_faq && intent.faq_question) {
    const categoryData = VACCINE_TRAINING_DATA[intent.type];
    if (categoryData) {
      const faq = categoryData.find((f) => f.question === intent.faq_question);
      if (faq) {
        return {
          response: faq.answer,
          data: {
            type: intent.type,
            source: "faq_database",
            confidence: "exact_match",
            category: getCategoryDisplayName(intent.type),
          },
        };
      }
    }
  }

  // Category-based responses for unmatched queries
  const categoryData = VACCINE_TRAINING_DATA[intent.type];
  if (categoryData && categoryData.length > 0) {
    return {
      response: categoryData[0].answer,
      data: {
        type: intent.type,
        source: "category_database",
        confidence: "category_match",
        category: getCategoryDisplayName(intent.type),
      },
    };
  }

  // Handle greetings
  if (intent.type === "greeting") {
    return {
      response: getWelcomeMessage(),
      data: { type: "greeting", confidence: "high" },
    };
  }

  // Handle thanks
  if (intent.type === "thanks") {
    return {
      response:
        "You're welcome! 😊 I'm glad I could help. If you have any more questions about vaccination, feel free to ask!",
      data: { type: "thanks", confidence: "high" },
    };
  }

  // Default response for general queries
  return {
    response: getContextualResponse(),
    data: { type: "general", confidence: intent.confidence },
  };
}

export function getCategoryDisplayName(category) {
  const displayNames = {
    faq_general: "General FAQ",
    faq_myth_busting: "Myth Busting",
    guidance_before_vaccination: "Pre-Vaccination Guidance",
    guidance_after_vaccination: "Post-Vaccination Care",
    guidance_special_cases: "Special Cases Guidance",
    child_vaccination: "Child Vaccination",
    practical_info: "Practical Information",
    emergency_support: "Emergency & Support",
  };
  return displayNames[category] || category;
}

export function getWelcomeMessage() {
  return `👋 Hello! I'm your Vaccine Information Assistant! 💉🏥

I specialize in providing comprehensive information about vaccination in Bangladesh. Here's what I can help you with:

**📚 Frequently Asked Questions:**
• What vaccines are and how they work
• Vaccine safety and ingredients  
• Myth busting and facts

**📋 Citizens Guidance:**
• How to prepare for vaccination
• After-vaccination care
• Special cases (pregnancy, chronic diseases)
• Missed vaccination schedules

**👶 Child Vaccination:**
• Complete vaccination schedule
• Age-appropriate guidance

**📍 Practical Information:**
• Where to get vaccinated
• Cost and availability

**🚨 Emergency Support:**
• Emergency contacts
• Problem reporting

What would you like to know about vaccination today?`;
}

export function getContextualResponse() {
  return `I'm here to provide expert vaccination information! 💉

I can help you with:
• Vaccine safety and effectiveness
• Preparation before vaccination  
• Care after vaccination
• Child immunization schedules
• Finding vaccination centers
• Emergency contacts

Try asking me specific questions like:
• "Are vaccines safe?"
• "What should I bring to vaccination center?"
• "Child vaccination schedule"
• "Emergency contact numbers"

What would you like to know?`;
}

export function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getCategoryDescription(category) {
  const descriptions = {
    faq_general: "Basic information about vaccines and how they work",
    faq_myth_busting: "Debunking common vaccine myths and misinformation",
    guidance_before_vaccination: "Preparation and what to bring",
    guidance_after_vaccination:
      "Post-vaccination care and side effect management",
    guidance_special_cases:
      "Guidance for pregnant women, chronic patients, and missed schedules",
    child_vaccination: "Complete child immunization schedule",
    practical_info: "Where to get vaccinated and cost information",
    emergency_support: "Emergency contacts and problem reporting",
  };
  return descriptions[category] || "Vaccine-related information";
}

export function calculateRelevance(faq, query) {
  let score = 0;

  // Check question
  if (faq.question.toLowerCase().includes(query)) score += 3;

  // Check answer
  if (faq.answer.toLowerCase().includes(query)) score += 2;

  // Check keywords
  for (const keyword of faq.keywords) {
    if (query.includes(keyword)) score += 4;
    if (keyword.includes(query)) score += 2;
  }

  return score;
}