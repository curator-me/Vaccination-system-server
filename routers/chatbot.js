import express from "express";

const router = express.Router();

let vaccineCentersCollection;
let vaccineInventoryCollection;
let usersCollection;

export const setChatbotCollections = ({
  vaccineCentersCollection: vcc,
  vaccineInventoryCollection: vic,
  usersCollection: uc,
}) => {
  vaccineCentersCollection = vcc;
  vaccineInventoryCollection = vic;
  usersCollection = uc;
  console.log("✅ Chatbot collections initialized");
};

// ==================== COMPREHENSIVE FAQ & CITIZENS GUIDANCE ====================
const VACCINE_TRAINING_DATA = {
  // ==================== FREQUENTLY ASKED QUESTIONS (FAQ) ====================
  faq_general: [
    {
      question: "what is vaccination",
      answer: `💉 **What is Vaccination?**
      
Vaccination is a simple, safe, and effective way to protect people against harmful diseases before they come into contact with them.

**How it works:**
• Vaccines help your immune system recognize and fight viruses/bacteria
• They contain weakened or killed forms of germs
• Your body produces antibodies to fight future infections
• Provides immunity without getting the disease first

**Benefits:**
✅ Prevents serious illnesses
✅ Saves lives
✅ Reduces disease spread
✅ Protects vulnerable people
✅ Cost-effective healthcare`,
      keywords: [
        "what is vaccine",
        "vaccination meaning",
        "how vaccine works",
        "টিকা কী",
        "ভ্যাকসিন কী",
      ],
    },
    {
      question: "why vaccinate children",
      answer: `👶 **Why Vaccinate Children?**
      
**Life-saving Protection:**
• Prevents 2-3 million deaths yearly worldwide
• Protects against deadly diseases like measles, polio, tetanus
• Strengthens child's immune system

**Community Benefits:**
• Creates "herd immunity"
• Protects those who can't be vaccinated
• Prevents disease outbreaks
• Reduces healthcare costs

**Long-term Benefits:**
• Healthy childhood development
• Better school attendance
• Prevents lifelong disabilities
• Protects future generations`,
      keywords: [
        "why vaccine",
        "importance",
        "benefits",
        "টিকা দেয়া কেন জরুরি",
        "ভ্যাকসিনের গুরুত্ব",
      ],
    },
    {
      question: "are vaccines safe",
      answer: `🛡️ **Vaccine Safety Facts**
      
**YES, vaccines are extremely safe!**

**Safety Measures:**
• Rigorous testing before approval
• Continuous monitoring after approval
• Multiple safety checks in production
• Regular quality control

**Evidence:**
• Used safely for over 200 years
• Protect billions of people worldwide
• Recommended by WHO and all medical experts
• Side effects are usually mild and temporary

**Myth vs Fact:**
❌ MYTH: Vaccines cause autism
✅ FACT: No scientific evidence supports this

❌ MYTH: Vaccines contain harmful ingredients
✅ FACT: Ingredients are safe and carefully regulated`,
      keywords: ["safe", "safety", "risk", "danger", "নিরাপদ", "ঝুঁকি"],
    },
    {
      question: "vaccine ingredients",
      answer: `🧪 **Vaccine Ingredients Explained**
      
**Common Vaccine Components:**

1. **Antigens** - Weakened/killed germs that trigger immunity
2. **Adjuvants** - Boost immune response (aluminum salts)
3. **Preservatives** - Prevent contamination (thiomersal)
4. **Stabilizers** - Maintain effectiveness (sugars, gelatin)
5. **Residuals** - Tiny amounts from manufacturing

**Safety Assurance:**
• All ingredients are thoroughly tested
• Quantities are very small and safe
• Body processes them naturally
• No harmful effects in decades of use`,
      keywords: ["ingredients", "content", "what inside", "উপাদান", "কী থাকে"],
    },
  ],

  faq_myth_busting: [
    {
      question: "vaccine myths and facts",
      answer: `🔍 **Common Vaccine Myths vs Facts**

❌ **MYTH:** Vaccines cause autism
✅ **FACT:** No scientific link found in 100+ studies

❌ **MYTH:** Natural immunity is better
✅ **FACT:** Vaccine immunity is safer than getting sick

❌ **MYTH:** Too many vaccines overwhelm immune system
✅ **FACT:** Immune system handles thousands of germs daily

❌ **MYTH:** Vaccines contain microchips
✅ **FACT:** Absolutely false conspiracy theory

❌ **MYTH:** Diseases were already disappearing
✅ **FACT:** Vaccines caused dramatic disease declines

❌ **MYTH:** Vaccine side effects are worse than diseases
✅ **FACT:** Diseases cause far more harm than vaccines`,
      keywords: [
        "myth",
        "false",
        "conspiracy",
        "misinformation",
        "মিথ",
        "গুজব",
      ],
    },
    {
      question: "do vaccines contain microchips",
      answer: `🚫 **Microchip Rumor - COMPLETELY FALSE**
      
**The Truth:**
• Vaccines do NOT contain microchips
• This is a baseless conspiracy theory
• Vaccine ingredients are publicly documented
• No tracking devices in any vaccines

**What vaccines REALLY contain:**
• Antigens to build immunity
• Stabilizers to maintain effectiveness
• Preservatives to prevent contamination
• All ingredients are safe and necessary`,
      keywords: [
        "microchip",
        "tracking",
        "conspiracy",
        "মাইক্রোচিপ",
        "ট্র্যাকিং",
      ],
    },
  ],

  // ==================== CITIZENS GUIDANCE ====================
  guidance_before_vaccination: [
    {
      question: "how to prepare for vaccination",
      answer: `📋 **Pre-Vaccination Preparation Guide**

**For Children:**
• Ensure child is healthy (no fever)
• Dress in loose, comfortable clothing
• Bring immunization card if available
• Inform about any allergies or conditions
• Keep child calm and reassured

**For Adults:**
• Get good night's sleep before
• Eat normal meal beforehand
• Stay well-hydrated
• Wear short-sleeved shirt
• Bring ID and previous records

**What to Bring:**
• National ID/Birth certificate
• Mobile phone for contact
• Previous vaccination records
• List of medications/allergies`,
      keywords: ["prepare", "before", "ready", "প্রস্তুতি", "ভ্যাকসিনের আগে"],
    },
    {
      question: "what to bring to vaccination center",
      answer: `🎒 **Essential Items to Bring**

**Documents:**
• National ID Card (NID)
• Birth certificate (for children)
• Previous vaccination records
• Any medical reports

**Personal Items:**
• Mobile phone
• Water bottle
• Snacks (especially for children)
• Necessary medications
• Face mask

**For Comfort:**
• Comfortable clothing
• Small toy for children
• Book or entertainment
• Emergency contact numbers`,
      keywords: ["bring", "documents", "items", "কী নিয়ে যাবেন", "ডকুমেন্ট"],
    },
  ],

  guidance_after_vaccination: [
    {
      question: "what to do after vaccination",
      answer: `🏠 **Post-Vaccination Care Guide**

**Immediate Aftercare (First 30 minutes):**
• Stay at center for observation
• Report any discomfort immediately
• Drink plenty of water
• Rest and avoid strenuous activity

**First 24 Hours:**
• Monitor for side effects
• Use paracetamol for fever/pain
• Keep injection site clean and dry
• Apply cool compress for swelling
• Get adequate rest

**When to Resume Normal Activities:**
• Light activities: After 24 hours
• Exercise: After 48 hours
• Work/School: Next day if feeling well
• Sports: When comfortable

**💡 Remember:** Mild side effects mean the vaccine is working!`,
      keywords: ["after", "post vaccine", "care", "টিকার পরে", "যত্ন"],
    },
    {
      question: "managing vaccine side effects",
      answer: `🌡️ **Managing Common Side Effects**

**Mild Fever (99-101°F):**
• Use paracetamol as directed
• Drink plenty of fluids
• Rest and avoid overheating
• Use light clothing

**Pain/Swelling at Injection Site:**
• Apply cool, wet cloth
• Gently move the arm
• Use paracetamol if needed
• Avoid heavy lifting

**Fatigue/Headache:**
• Get extra rest
• Stay hydrated
• Eat light, healthy meals
• Avoid strenuous activity

**🚨 Seek Medical Help If:**
• High fever (102°F+)
• Severe pain that doesn't improve
• Difficulty breathing
• Severe allergic reaction
• Symptoms worsen after 48 hours`,
      keywords: [
        "side effects management",
        "fever care",
        "pain relief",
        "জ্বরের চিকিৎসা",
        "ব্যথা কমানো",
      ],
    },
  ],

  guidance_special_cases: [
    {
      question: "vaccination for pregnant women",
      answer: `🤰 **Vaccination During Pregnancy**

**Recommended Vaccines:**
• **TT Vaccine:** MUST for all pregnant women
• **COVID-19 Vaccine:** Recommended after consultation
• **Flu Vaccine:** Seasonal recommendation

**TT Vaccine Schedule:**
• 1st dose: At first antenatal visit
• 2nd dose: 4 weeks after 1st dose
• Booster: In subsequent pregnancies

**Benefits:**
• Protects mother from tetanus
• Protects newborn from neonatal tetanus
• Prevents maternal and infant mortality

**Consult Your Doctor:**
• Discuss all vaccination decisions
• Follow medical advice carefully
• Report any concerns immediately`,
      keywords: [
        "pregnant",
        "pregnancy",
        "expecting mother",
        "গর্ভবতী",
        "প্রসূতি",
      ],
    },
    {
      question: "vaccination with chronic diseases",
      answer: `🩺 **Vaccination with Chronic Conditions**

**SAFE and RECOMMENDED for:**
• Diabetes patients
• Heart disease patients
• Asthma patients
• Kidney disease patients
• Cancer patients (consult doctor)

**Special Considerations:**
• May need additional protection
• Timing might be adjusted
• Some live vaccines may be avoided
• Doctor consultation essential

**Importance:**
• Chronic patients are more vulnerable
• Vaccines prevent serious complications
• Reduces hospitalization risk
• Improves quality of life`,
      keywords: [
        "chronic disease",
        "diabetes",
        "heart",
        "asthma",
        "ক্রনিক রোগ",
        "ডায়াবেটিস",
      ],
    },
    {
      question: "missed vaccination schedule",
      answer: `📅 **Missed Vaccination - What to Do?**

**Don't Panic! Catch-up is Possible:**

**For Children:**
• Contact nearest EPI center immediately
• No need to restart the series
• Continue from where you left
• Get updated schedule from health worker

**For Adults:**
• Consult healthcare provider
• Get missing doses as soon as possible
• Update your vaccination records
• Follow revised schedule

**Important:**
• Better late than never!
• Partial protection is better than none
• Health workers will help you catch up`,
      keywords: ["missed", "late", "catch up", "বিলম্ব", "মিস হয়ে গেছে"],
    },
  ],

  // ==================== CHILD VACCINATION SCHEDULE ====================
  child_vaccination: [
    {
      question: "child vaccination schedule",
      answer: `👶 **Complete Child Vaccination Schedule (Bangladesh)**

| Vaccine | Prevents | Schedule | Target Age |
|---------|----------|----------|------------|
| **BCG** | Tuberculosis | Single dose | At birth |
| **OPV** | Polio | 4 doses | Birth, 6, 10, 14 weeks |
| **Pentavalent** | 5 diseases | 3 doses | 6, 10, 14 weeks |
| **PCV** | Pneumonia | 3 doses | 6, 10, 14 weeks |
| **Rota** | Diarrhea | 2 doses | 6, 10 weeks |
| **IPV** | Polio | 1 dose | 14 weeks |
| **MR** | Measles, Rubella | 2 doses | 9 & 15 months |
| **HPV** | Cervical cancer | 2 doses | 9-14 years (Girls) |
| **TT** | Tetanus | 2 doses | Pregnant women |

💡 *All vaccines are FREE at government health centers*`,
      keywords: [
        "child vaccine",
        "baby vaccine",
        "vaccination schedule",
        "immunization",
        "শিশুর টিকা",
        "টিকা সময়সূচী",
      ],
    },
  ],

  // ==================== PRACTICAL INFORMATION ====================
  practical_info: [
    {
      question: "where to get vaccinated",
      answer: `📍 **Vaccination Centers in Bangladesh**

**Government Centers (FREE):**
• EPI Centers nationwide
• Government Hospitals
• Community Clinics
• Upazila Health Complexes
• Union Health Centers

**Private Centers (Paid):**
• Private Hospitals
• Specialized Clinics
• Corporate facilities

**How to Find Nearest Center:**
• Contact local health complex
• Ask community health worker
• Call health helpline: 16263
• Visit: dghs.gov.bd

**Services Provided:**
• Routine immunization
• Vaccination cards
• Health education
• Growth monitoring`,
      keywords: ["where", "center", "location", "place", "কেন্দ্র", "স্থান"],
    },
    {
      question: "vaccination cost",
      answer: `💰 **Vaccination Cost Information**

**COMPLETELY FREE at:**
• All government health centers
• EPI program facilities
• Community clinics
• Public hospitals

**What's Covered:**
• All routine childhood vaccines
• TT vaccine for pregnant women
• Emergency vaccinations
• Vaccination cards and records

**Paid Services (Private):**
• Some specialized vaccines
• Convenience and timing
• Additional services

**Financial Assistance:**
• No one denied for inability to pay
• Government covers all costs
• Focus on universal access`,
      keywords: ["cost", "price", "free", "paid", "খরচ", "মূল্য"],
    },
  ],

  // ==================== EMERGENCY & SUPPORT ====================
  emergency_support: [
    {
      question: "emergency contact",
      answer: `🚨 **Emergency Contacts & Support**

**24/7 Health Helplines:**
• National Health Helpline: **16263**
• Emergency Services: **999**
• COVID-19 Helpline: **16273**
• Child Health: **1098**

**Immediate Medical Help:**
• Nearest Government Hospital
• Upazila Health Complex
• Private Emergency Clinic
• Ambulance Service

**Vaccine-related Concerns:**
• Contact vaccination center staff
• Speak with community health worker
• Consult Upazila Health Officer

**Online Support:**
• Website: dghs.gov.bd
• Email: dg@dghs.gov.bd
• Social Media: Ministry of Health`,
      keywords: ["emergency", "contact", "help", "support", "জরুরি", "যোগাযোগ"],
    },
    {
      question: "report vaccine problem",
      answer: `📞 **Reporting Vaccine Problems**

**Who to Contact:**
• Vaccination center staff immediately
• Upazila Health Officer
• District Civil Surgeon
• National EPI Program

**What to Report:**
• Severe side effects
• Adverse reactions
• Service quality issues
• Supply problems

**How to Report:**
• In-person at health facility
• Call health helpline: 16263
• Online portal: dghs.gov.bd
• Through community health worker

**Important:**
• Report concerns promptly
• Provide accurate information
• Keep vaccination records
• Follow up if needed`,
      keywords: [
        "report",
        "problem",
        "complaint",
        "issue",
        "রিপোর্ট",
        "সমস্যা",
      ],
    },
  ],
};

// ==================== SIMPLIFIED INTENT DETECTION ====================
function detectVaccineIntent(message) {
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

// ==================== SIMPLIFIED RESPONSE GENERATOR ====================
function getRuleBasedResponse(message, intent) {
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

function getCategoryDisplayName(category) {
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

function getWelcomeMessage() {
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

function getContextualResponse() {
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

// ==================== SIMPLIFIED CHATBOT FUNCTIONS ====================
const conversationCache = new Map();

// ==================== MAIN CHAT ENDPOINT ====================
router.post("/chat", async (req, res) => {
  try {
    const {
      message,
      user_id = "anonymous",
      conversation_id = generateConversationId(),
    } = req.body;

    console.log(
      `💬 Chat request from ${user_id}: ${message.substring(0, 50)}...`
    );

    if (!message || message.trim().length === 0) {
      return res.json({
        success: false,
        response: "Please type a message to start chatting!",
        source: "error",
      });
    }

    // Get or create conversation
    let conversation = conversationCache.get(conversation_id) || {
      history: [],
      user_id: user_id,
      created_at: new Date(),
    };

    // Detect intent
    const intent = detectVaccineIntent(message);
    console.log(
      `🎯 Detected intent: ${intent.type} (confidence: ${intent.confidence})`
    );

    // Get rule-based response (no AI integration)
    const ruleResponse = getRuleBasedResponse(message, intent);
    const finalResponse = ruleResponse.response;

    // Update conversation history
    conversation.history.push({
      user: message,
      assistant: finalResponse,
      timestamp: new Date(),
      intent: intent.type,
      source: "rule-based",
      confidence: intent.confidence,
      category: getCategoryDisplayName(intent.type),
    });

    // Keep only last 6 messages
    if (conversation.history.length > 6) {
      conversation.history = conversation.history.slice(-6);
    }

    // Save conversation
    conversationCache.set(conversation_id, conversation);

    // Send response
    res.json({
      success: true,
      response: finalResponse,
      conversation_id: conversation_id,
      intent: intent.type,
      category: getCategoryDisplayName(intent.type),
      source: "rule-based",
      confidence: intent.confidence,
      timestamp: new Date().toISOString(),
      history_length: conversation.history.length,
    });
  } catch (error) {
    console.error("💥 Chat endpoint error:", error);

    const fallbackResponse =
      "I'm here to help with comprehensive vaccination information! Please try again or contact health helpline: 16263";

    res.json({
      success: true,
      response: fallbackResponse,
      conversation_id: req.body?.conversation_id || generateConversationId(),
      source: "fallback",
      error: "Service recovered with fallback",
    });
  }
});

// ==================== UTILITY FUNCTIONS ====================
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== SIMPLIFIED API ENDPOINTS ====================
router.get("/test", (req, res) => {
  const categoryStats = {};
  for (const [category, faqs] of Object.entries(VACCINE_TRAINING_DATA)) {
    categoryStats[getCategoryDisplayName(category)] = faqs.length;
  }

  res.json({
    success: true,
    message: "✅ Vaccine FAQ & Guidance Chatbot is running!",
    mode: "FAQ Expert + Citizens Guidance (Rule-based)",
    statistics: {
      total_categories: Object.keys(VACCINE_TRAINING_DATA).length,
      total_faqs: Object.values(VACCINE_TRAINING_DATA).reduce(
        (sum, faqs) => sum + faqs.length,
        0
      ),
      category_breakdown: categoryStats,
      bengali_support: true,
      active_conversations: conversationCache.size,
    },
    endpoints: {
      chat: "POST /api/chatbot/chat",
      categories: "GET /api/chatbot/categories",
      search: "POST /api/chatbot/search",
    },
  });
});

// Get all FAQ categories
router.get("/categories", (req, res) => {
  const categories = Object.keys(VACCINE_TRAINING_DATA).map((category) => ({
    id: category,
    name: getCategoryDisplayName(category),
    faq_count: VACCINE_TRAINING_DATA[category].length,
    description: getCategoryDescription(category),
    sample_questions: VACCINE_TRAINING_DATA[category]
      .slice(0, 2)
      .map((faq) => faq.question),
  }));

  res.json({
    success: true,
    categories: categories,
    total_faqs: Object.values(VACCINE_TRAINING_DATA).reduce(
      (sum, faqs) => sum + faqs.length,
      0
    ),
  });
});

function getCategoryDescription(category) {
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

// Search across all FAQs
router.post("/search", (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res
      .status(400)
      .json({ success: false, message: "Search query required" });
  }

  const results = [];
  const lowerQuery = query.toLowerCase();

  // Search through all FAQs
  for (const [category, faqs] of Object.entries(VACCINE_TRAINING_DATA)) {
    for (const faq of faqs) {
      const relevanceScore = calculateRelevance(faq, lowerQuery);
      if (relevanceScore > 0) {
        results.push({
          category: getCategoryDisplayName(category),
          question: faq.question,
          answer: faq.answer.substring(0, 200) + "...",
          relevance: relevanceScore,
          keywords: faq.keywords,
        });
      }
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  res.json({
    success: true,
    query: query,
    results: results.slice(0, 10), // Top 10 results
    result_count: results.length,
  });
});

function calculateRelevance(faq, query) {
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

// Get chatbot statistics
router.get("/stats", (req, res) => {
  const categoryStats = {};
  for (const [category, faqs] of Object.entries(VACCINE_TRAINING_DATA)) {
    categoryStats[getCategoryDisplayName(category)] = {
      faq_count: faqs.length,
      sample_questions: faqs.slice(0, 2).map((f) => f.question),
    };
  }

  res.json({
    success: true,
    active_conversations: conversationCache.size,
    training_data: {
      total_categories: Object.keys(VACCINE_TRAINING_DATA).length,
      total_faqs: Object.values(VACCINE_TRAINING_DATA).reduce(
        (sum, faqs) => sum + faqs.length,
        0
      ),
      category_breakdown: categoryStats,
    },
    focus: "FAQ & Citizens Guidance System",
    timestamp: new Date().toISOString(),
  });
});

// ==================== CLEANUP EXPIRED CONVERSATIONS ====================
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;

  for (const [conversationId, conversation] of conversationCache.entries()) {
    const hoursSinceLastActivity =
      (now - conversation.created_at) / (1000 * 60 * 60);
    if (hoursSinceLastActivity > 24) {
      // 24 hours expiry
      conversationCache.delete(conversationId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired conversations`);
  }
}, 60 * 60 * 1000); // Run every hour

// module.exports = {
//   router,
//   setChatbotCollections,
//   VACCINE_TRAINING_DATA,
//   detectVaccineIntent,
//   getRuleBasedResponse
// };

export default router;
