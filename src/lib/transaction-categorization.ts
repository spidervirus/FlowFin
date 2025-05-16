import { Category, Transaction } from "@/types/financial";

// Common keywords for different transaction categories
const categoryKeywords: Record<string, string[]> = {
  Groceries: [
    "grocery",
    "supermarket",
    "food",
    "market",
    "walmart",
    "kroger",
    "safeway",
    "trader joe",
    "whole foods",
    "aldi",
    "publix",
    "costco",
    "target",
  ],
  Dining: [
    "restaurant",
    "cafe",
    "coffee",
    "starbucks",
    "mcdonald",
    "burger",
    "pizza",
    "taco",
    "sushi",
    "dining",
    "doordash",
    "ubereats",
    "grubhub",
    "seamless",
  ],
  Transportation: [
    "uber",
    "lyft",
    "taxi",
    "cab",
    "transit",
    "subway",
    "metro",
    "bus",
    "train",
    "gas",
    "fuel",
    "parking",
    "toll",
  ],
  Housing: [
    "rent",
    "mortgage",
    "apartment",
    "condo",
    "house",
    "property",
    "real estate",
    "hoa",
    "maintenance",
  ],
  Utilities: [
    "electric",
    "water",
    "gas",
    "internet",
    "cable",
    "phone",
    "utility",
    "bill",
    "at&t",
    "verizon",
    "comcast",
    "xfinity",
  ],
  Entertainment: [
    "movie",
    "theater",
    "cinema",
    "concert",
    "show",
    "netflix",
    "hulu",
    "spotify",
    "disney",
    "amazon prime",
    "hbo",
    "ticket",
  ],
  Shopping: [
    "amazon",
    "ebay",
    "etsy",
    "walmart",
    "target",
    "best buy",
    "clothing",
    "apparel",
    "shoes",
    "electronics",
    "furniture",
    "home goods",
  ],
  Health: [
    "doctor",
    "hospital",
    "clinic",
    "medical",
    "dental",
    "pharmacy",
    "prescription",
    "insurance",
    "healthcare",
    "fitness",
    "gym",
  ],
  Education: [
    "school",
    "college",
    "university",
    "tuition",
    "course",
    "class",
    "book",
    "textbook",
    "education",
    "student",
    "loan",
  ],
  Travel: [
    "hotel",
    "airbnb",
    "flight",
    "airline",
    "vacation",
    "trip",
    "travel",
    "booking",
    "expedia",
    "airfare",
    "cruise",
  ],
  Subscriptions: [
    "subscription",
    "membership",
    "monthly",
    "annual",
    "recurring",
    "netflix",
    "spotify",
    "apple",
    "google",
    "amazon prime",
  ],
  Income: [
    "salary",
    "paycheck",
    "deposit",
    "direct deposit",
    "payment",
    "income",
    "revenue",
    "wage",
    "commission",
    "bonus",
    "refund",
  ],
  Investments: [
    "investment",
    "stock",
    "bond",
    "mutual fund",
    "etf",
    "dividend",
    "interest",
    "capital gain",
    "robinhood",
    "fidelity",
    "vanguard",
    "schwab",
  ],
  Insurance: [
    "insurance",
    "premium",
    "coverage",
    "policy",
    "life insurance",
    "auto insurance",
    "home insurance",
    "health insurance",
  ],
  Taxes: [
    "tax",
    "irs",
    "federal",
    "state",
    "property tax",
    "income tax",
    "sales tax",
  ],
  "Gifts & Donations": [
    "gift",
    "donation",
    "charity",
    "nonprofit",
    "gofundme",
    "patreon",
    "kickstarter",
  ],
  Business: [
    "business",
    "office",
    "supplies",
    "equipment",
    "software",
    "service",
    "contractor",
    "client",
    "customer",
    "vendor",
  ],
};

// Simple ML model based on keyword matching and frequency analysis
export function suggestCategory(
  description: string,
  amount: number,
  type: string,
  previousTransactions: Transaction[],
  categories: Category[],
): string | null {
  // Convert description to lowercase for case-insensitive matching
  const lowerDescription = description.toLowerCase();

  // Step 1: Check for exact matches in previous transactions
  const exactMatches = previousTransactions.filter(
    (t) => t.description?.toLowerCase() === lowerDescription && t.category,
  );

  if (exactMatches.length > 0) {
    // Find the most common category for exact matches
    const categoryCounts = exactMatches.reduce(
      (counts, transaction) => {
        if (transaction.category) {
          const categoryKey = String(transaction.category);
          counts[categoryKey] = (counts[categoryKey] || 0) + 1;
        }
        return counts;
      },
      {} as Record<string, number>,
    );

    const mostCommonCategoryId = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    return mostCommonCategoryId;
  }

  // Step 2: Check for keyword matches
  const matchScores: Record<string, number> = {};

  // Calculate match scores based on keywords
  Object.entries(categoryKeywords).forEach(([categoryName, keywords]) => {
    keywords.forEach((keyword) => {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        matchScores[categoryName] = (matchScores[categoryName] || 0) + 1;
      }
    });
  });

  // Find category with highest match score
  let bestMatch: string | null = null;
  let highestScore = 0;

  Object.entries(matchScores).forEach(([categoryName, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = categoryName;
    }
  });

  if (bestMatch) {
    // Find the category ID for the best match
    const matchedCategory = categories.find(
      (c) =>
        c.name.toLowerCase() === bestMatch?.toLowerCase() && c.type === type,
    );

    if (matchedCategory) {
      return matchedCategory.id;
    }
  }

  // Step 3: Check for similar transactions based on amount and type
  const similarTransactions = previousTransactions.filter(
    (t) => Math.abs(t.amount - amount) < 1 && t.type === type && t.category,
  );

  if (similarTransactions.length > 0) {
    // Find the most common category for similar transactions
    const categoryCounts = similarTransactions.reduce(
      (counts, transaction) => {
        if (transaction.category) {
          const categoryKey = String(transaction.category);
          counts[categoryKey] = (counts[categoryKey] || 0) + 1;
        }
        return counts;
      },
      {} as Record<string, number>,
    );

    const mostCommonCategoryId = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    return mostCommonCategoryId;
  }

  // Step 4: Default categorization based on transaction type
  if (type === "income") {
    const incomeCategory = categories.find((c) => c.type === "income");
    if (incomeCategory) {
      return incomeCategory.id;
    }
  } else {
    // For expenses, try to find a general "Uncategorized" or "Other" category
    const generalCategory = categories.find(
      (c) =>
        (c.name.toLowerCase() === "uncategorized" ||
          c.name.toLowerCase() === "other") &&
        c.type === "expense",
    );
    if (generalCategory) {
      return generalCategory.id;
    }
  }

  return null;
}

// Function to train the model with new data
export function trainModel(newTransaction: Transaction): void {
  // In a real ML system, this would update the model with new data
  // For our simple implementation, we're just using the existing data each time
  console.log(
    "Model training with new transaction:",
    newTransaction.description || "No description",
  );
}

// Function to get confidence score for a suggestion
export function getSuggestionConfidence(
  description: string,
  categoryId: string,
  previousTransactions: Transaction[],
): number {
  // Calculate confidence based on how many similar transactions have the same category
  const lowerDescription = description.toLowerCase();

  // Find similar transactions
  const similarTransactions = previousTransactions.filter(
    (t) =>
      t.description?.toLowerCase().includes(lowerDescription) ||
      lowerDescription.includes(t.description?.toLowerCase() || ""),
  );

  if (similarTransactions.length === 0) {
    return 0.5; // Medium confidence if no similar transactions
  }

  // Count how many have the same category
  const matchingCategory = similarTransactions.filter(
    (t) => t.category_id === categoryId,
  ).length;

  // Calculate confidence score (0-1)
  return Math.min(matchingCategory / similarTransactions.length, 1);
}
