import express from "express";
import { VACCINE_TRAINING_DATA } from "../utils/chatbotData.js";
import {
  detectVaccineIntent,
  getRuleBasedResponse,
  getCategoryDisplayName,
  getWelcomeMessage,
  getContextualResponse,
  generateConversationId,
  getCategoryDescription,
  calculateRelevance
} from "../utils/responseGenerator.js";

const router = express.Router();
let vaccineCenterCollection;
let usersCollection;
let vaccineCollection;

export const setChatbotCollections = ({
  vaccineCenterCollection: vcc,
  vaccineCollection: vic,
  usersCollection: uc,
}) => {
  vaccineCenterCollection = vcc;
  vaccineCollection = vic;
  usersCollection = uc;
  // console.log("Chatbot collections initialized");
};

const conversationCache = new Map();

//  MAIN CHAT ENDPOINT
router.post("chatbot/chat", async (req, res) => {
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

router.get("chatbot/test", (req, res) => {
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
router.get("chatbot/categories", (req, res) => {
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

// Search across all FAQs
router.post("chatbot/search", (req, res) => {
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

// Get chatbot statistics
router.get("chatbot/stats", (req, res) => {
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

export default router;
