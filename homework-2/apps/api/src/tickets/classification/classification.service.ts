import { Injectable, Logger } from '@nestjs/common';
import { ClassificationResult, TicketCategory, TicketPriority } from '@repo/contracts';

interface CategoryRule {
  category: TicketCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'account_access',
    keywords: ['log in', 'login', 'password', '2fa', 'two-factor', 'locked out', 'credential'],
  },
  {
    category: 'technical_issue',
    keywords: ['error', 'crash', 'exception', 'not working', 'broken'],
  },
  {
    category: 'billing_question',
    keywords: ['payment', 'invoice', 'refund', 'billing', 'charge', 'subscription'],
  },
  {
    category: 'feature_request',
    keywords: ['enhancement', 'suggestion', 'feature request', 'would love', 'wish', 'roadmap'],
  },
  {
    category: 'bug_report',
    keywords: ['reproduce', 'steps to reproduce', 'defect', 'stack trace'],
  },
];

interface PriorityRule {
  priority: TicketPriority;
  keywords: string[];
}

const PRIORITY_RULES: PriorityRule[] = [
  {
    priority: 'urgent',
    keywords: ["can't access", 'cannot access', 'critical', 'production down', 'security'],
  },
  { priority: 'high', keywords: ['important', 'blocking', 'asap'] },
  { priority: 'low', keywords: ['minor', 'cosmetic', 'suggestion'] },
];

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  classify(subject: string, description: string): ClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();
    const matched: string[] = [];

    let category: TicketCategory = 'other';
    for (const rule of CATEGORY_RULES) {
      const hits = rule.keywords.filter((keyword) => text.includes(keyword));
      if (hits.length) {
        category = rule.category;
        matched.push(...hits);
        break;
      }
    }

    let priority: TicketPriority = 'medium';
    for (const rule of PRIORITY_RULES) {
      const hits = rule.keywords.filter((keyword) => text.includes(keyword));
      if (hits.length) {
        priority = rule.priority;
        matched.push(...hits);
        break;
      }
    }

    const keywords = [...new Set(matched)];
    const confidence = keywords.length ? Math.min(0.95, 0.6 + keywords.length * 0.1) : 0.5;
    const reasoning = keywords.length
      ? `Matched keyword(s) "${keywords.join('", "')}" — categorized as ${category}, priority ${priority}.`
      : `No strong keyword signal found — defaulted to category "other", priority "${priority}".`;

    const result: ClassificationResult = { category, priority, confidence, reasoning, keywords };

    this.logger.log(
      `Classified ticket as ${result.category}/${result.priority} (confidence=${result.confidence}) keywords=${JSON.stringify(keywords)}`,
    );

    return result;
  }
}
