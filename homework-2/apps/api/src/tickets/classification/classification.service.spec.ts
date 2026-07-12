import { ClassificationService } from './classification.service';

describe('ClassificationService', () => {
  const service = new ClassificationService();

  it('categorizes account_access from login/password keywords', () => {
    const result = service.classify('Cannot log in', 'My password reset link never arrives.');
    expect(result.category).toBe('account_access');
  });

  it('categorizes technical_issue from crash/error keywords', () => {
    const result = service.classify('App keeps crashing', 'I get an error every time it opens.');
    expect(result.category).toBe('technical_issue');
  });

  it('categorizes billing_question from refund/invoice keywords', () => {
    const result = service.classify('Refund question', 'My invoice shows a duplicate charge for billing.');
    expect(result.category).toBe('billing_question');
  });

  it('categorizes feature_request from roadmap/suggestion keywords', () => {
    const result = service.classify('Feature request', 'Would love a roadmap for bulk export, just a suggestion.');
    expect(result.category).toBe('feature_request');
  });

  it('categorizes bug_report from reproduce/stack trace keywords', () => {
    const result = service.classify('Bug with steps to reproduce', 'Here is the stack trace and defect details.');
    expect(result.category).toBe('bug_report');
  });

  it('falls back to other with no keyword match', () => {
    const result = service.classify('General question', 'Just wanted to say thanks for the great support team.');
    expect(result.category).toBe('other');
    expect(result.keywords).toHaveLength(0);
  });

  it('assigns urgent priority for critical/security language', () => {
    const result = service.classify('Security issue', "I can't access the app and this looks like production down.");
    expect(result.priority).toBe('urgent');
  });

  it('assigns high priority for important/asap language', () => {
    const result = service.classify('Please help', 'This is important and blocking my team, need it asap.');
    expect(result.priority).toBe('high');
  });

  it('assigns low priority for minor/cosmetic language', () => {
    const result = service.classify('Small issue', 'This is a minor cosmetic suggestion, no rush at all.');
    expect(result.priority).toBe('low');
  });

  it('defaults to medium priority and returns confidence/reasoning', () => {
    const result = service.classify('Question', 'Just a regular question about how something works.');
    expect(result.priority).toBe('medium');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
