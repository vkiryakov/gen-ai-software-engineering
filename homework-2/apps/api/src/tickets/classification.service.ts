import { Injectable } from '@nestjs/common';
import type {
  ClassificationResult,
  TicketCategory,
  TicketPriority,
} from '@repo/contracts';

interface CategoryRule {
  category: TicketCategory;
  keywords: string[];
}

interface PriorityRule {
  priority: TicketPriority;
  keywords: string[];
}

/**
 * Rule-based auto-classification (Task 2). Scans the subject + description for
 * keyword matches to derive a category and priority, along with a confidence
 * score, human-readable reasoning, and the keywords that fired.
 */
@Injectable()
export class ClassificationService {
  private readonly categoryRules: CategoryRule[] = [
    {
      category: 'account_access',
      keywords: ['login', 'log in', 'password', '2fa', 'two-factor', "can't access", 'locked out'],
    },
    {
      category: 'billing_question',
      keywords: ['payment', 'invoice', 'refund', 'charge', 'billing', 'subscription'],
    },
    {
      category: 'bug_report',
      keywords: ['bug', 'defect', 'reproduce', 'steps to reproduce', 'unexpected'],
    },
    {
      category: 'technical_issue',
      keywords: ['error', 'crash', 'broken', 'not working', 'exception', 'fails'],
    },
    {
      category: 'feature_request',
      keywords: ['feature', 'enhancement', 'suggestion', 'would be nice', 'please add'],
    },
  ];

  private readonly priorityRules: PriorityRule[] = [
    {
      priority: 'urgent',
      keywords: ["can't access", 'critical', 'production down', 'security'],
    },
    { priority: 'high', keywords: ['important', 'blocking', 'asap'] },
    { priority: 'low', keywords: ['minor', 'cosmetic', 'suggestion'] },
  ];

  classify(subject: string, description: string): ClassificationResult {
    const haystack = `${subject}\n${description}`.toLowerCase();
    const matched: string[] = [];

    const category = this.matchCategory(haystack, matched);
    const priority = this.matchPriority(haystack, matched);

    // Confidence scales with how many distinct keywords matched (capped at 0.95).
    const confidence = matched.length === 0 ? 0.3 : Math.min(0.95, 0.5 + matched.length * 0.15);

    const reasoning =
      matched.length === 0
        ? 'No strong signals found; defaulted to "other" / "medium".'
        : `Matched keywords: ${matched.join(', ')}.`;

    return {
      category,
      priority,
      confidence: Number(confidence.toFixed(2)),
      reasoning,
      keywords_found: matched,
    };
  }

  private matchCategory(haystack: string, matched: string[]): TicketCategory {
    for (const rule of this.categoryRules) {
      const hits = rule.keywords.filter((kw) => haystack.includes(kw));
      if (hits.length > 0) {
        matched.push(...hits);
        return rule.category;
      }
    }
    return 'other';
  }

  private matchPriority(haystack: string, matched: string[]): TicketPriority {
    for (const rule of this.priorityRules) {
      const hits = rule.keywords.filter((kw) => haystack.includes(kw));
      if (hits.length > 0) {
        matched.push(...hits.filter((h) => !matched.includes(h)));
        return rule.priority;
      }
    }
    return 'medium';
  }
}
