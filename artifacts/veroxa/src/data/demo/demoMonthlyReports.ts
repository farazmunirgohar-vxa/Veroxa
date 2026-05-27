// demoMonthlyReports.ts — future: monthly_reports table
// Covers monthly performance reports with trend data for client portal and operator views.

export interface DemoMonthlyReport {
  clientId: string;
  monthLabel: string;
  growthOverview: string;
  contentPerformance: { label: string; value: string }[];
  visibilityTrend:    { label: string; value: number }[];
  reviewsTrend:       { label: string; value: number }[];
  postingConsistency: { label: string; value: number }[];
  inventoryTrend:     { label: string; value: number }[];
  healthSummary:   string;
  strategicNotes:  string[];
  nextMonthFocus:  string[];
}

export const demoMonthlyReports: DemoMonthlyReport[] = [
  {
    clientId: "demo-a", monthLabel: "May 2026",
    growthOverview: "Google visibility improved from 74% to 82%. Reviews increased by 9 this month. 22 posts were published.",
    contentPerformance: [
      { label: "Posts published",     value: "22"                    },
      { label: "Best post",           value: "Chicken Shawarma Reel" },
      { label: "Engagement estimate", value: "+12%"                  },
    ],
    visibilityTrend:    [{ label: "W1", value: 74 }, { label: "W2", value: 76 }, { label: "W3", value: 79 }, { label: "W4", value: 82 }],
    reviewsTrend:       [{ label: "W1", value: 1  }, { label: "W2", value: 3  }, { label: "W3", value: 2  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 5  }, { label: "W2", value: 6  }, { label: "W3", value: 6  }, { label: "W4", value: 5  }],
    inventoryTrend:     [{ label: "W1", value: 24 }, { label: "W2", value: 20 }, { label: "W3", value: 18 }, { label: "W4", value: 18 }],
    healthSummary:  "Healthy. Posting consistent, media inventory steady.",
    strategicNotes: ["Family platter campaign performed best", "Reels engagement outpaced static posts"],
    nextMonthFocus: ["Test paid reach for top-performing reels", "Plan menu-launch campaign", "Maintain shoot cadence"],
  },
  {
    clientId: "demo-b", monthLabel: "May 2026",
    growthOverview: "Visibility held steady at ~71%. Reviews flat. 12 posts published — under target.",
    contentPerformance: [
      { label: "Posts published",     value: "12"                     },
      { label: "Best post",           value: "Carnitas Tacos flat-lay" },
      { label: "Engagement estimate", value: "+3%"                     },
    ],
    visibilityTrend:    [{ label: "W1", value: 72 }, { label: "W2", value: 71 }, { label: "W3", value: 70 }, { label: "W4", value: 71 }],
    reviewsTrend:       [{ label: "W1", value: 2  }, { label: "W2", value: 1  }, { label: "W3", value: 1  }, { label: "W4", value: 1  }],
    postingConsistency: [{ label: "W1", value: 3  }, { label: "W2", value: 4  }, { label: "W3", value: 3  }, { label: "W4", value: 2  }],
    inventoryTrend:     [{ label: "W1", value: 14 }, { label: "W2", value: 12 }, { label: "W3", value: 10 }, { label: "W4", value: 9  }],
    healthSummary:  "Attention needed — media supply trending low.",
    strategicNotes: ["Posting cadence dipped end of month", "Operator review still pending on latest weekly"],
    nextMonthFocus: ["Coordinate fresh shoot", "Plan reels strategy", "Operator follow-up call"],
  },
  {
    clientId: "demo-c", monthLabel: "May 2026",
    growthOverview: "Visibility moved from 70% to 77%. Strong review month (+9). 18 posts published.",
    contentPerformance: [
      { label: "Posts published",     value: "18"                    },
      { label: "Best post",           value: "Mediterranean Platter" },
      { label: "Engagement estimate", value: "+10%"                  },
    ],
    visibilityTrend:    [{ label: "W1", value: 70 }, { label: "W2", value: 72 }, { label: "W3", value: 75 }, { label: "W4", value: 77 }],
    reviewsTrend:       [{ label: "W1", value: 2  }, { label: "W2", value: 3  }, { label: "W3", value: 1  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 4  }, { label: "W2", value: 5  }, { label: "W3", value: 5  }, { label: "W4", value: 4  }],
    inventoryTrend:     [{ label: "W1", value: 16 }, { label: "W2", value: 15 }, { label: "W3", value: 14 }, { label: "W4", value: 14 }],
    healthSummary:  "Healthy. Premium media supply, engagement growing.",
    strategicNotes: ["Olive-oil reels concept landed well", "Google review follow-up cadence is working"],
    nextMonthFocus: ["Expand reels series", "Plan executive case study", "Continue review cadence"],
  },
  {
    clientId: "demo-d", monthLabel: "May 2026",
    growthOverview: "At-risk month — visibility down from 64% to 58%. Onboarding incomplete and media supply critical.",
    contentPerformance: [
      { label: "Posts published",     value: "4"              },
      { label: "Best post",           value: "Latte art photo" },
      { label: "Engagement estimate", value: "-4%"            },
    ],
    visibilityTrend:    [{ label: "W1", value: 64 }, { label: "W2", value: 62 }, { label: "W3", value: 60 }, { label: "W4", value: 58 }],
    reviewsTrend:       [{ label: "W1", value: 0  }, { label: "W2", value: 1  }, { label: "W3", value: 0  }, { label: "W4", value: 3  }],
    postingConsistency: [{ label: "W1", value: 2  }, { label: "W2", value: 1  }, { label: "W3", value: 1  }, { label: "W4", value: 0  }],
    inventoryTrend:     [{ label: "W1", value: 6  }, { label: "W2", value: 4  }, { label: "W3", value: 3  }, { label: "W4", value: 2  }],
    healthSummary:  "Critical. Posting paused, onboarding incomplete.",
    strategicNotes: ["Owner attention recommended", "Reshoot required for blurry items"],
    nextMonthFocus: ["Complete onboarding", "Capture 20+ new media items", "Reset posting cadence"],
  },
];
