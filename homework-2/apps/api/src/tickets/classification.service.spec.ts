import { Logger } from '@nestjs/common';
import { ClassificationService } from './classification.service';

describe('ClassificationService', () => {
  const service = new ClassificationService();

  it('classifies password problems as account_access', () => {
    const result = service.classify('Cannot reset password', 'I forgot my password and cannot log in');
    expect(result.category).toBe('account_access');
    expect(result.keywords_found).toContain('password');
  });

  it('flags "production down" as urgent', () => {
    const result = service.classify('Outage', 'The production down issue is affecting all users');
    expect(result.priority).toBe('urgent');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('falls back to other/medium with low confidence when nothing matches', () => {
    const result = service.classify('Hello', 'Just saying hi to the team today');
    expect(result.category).toBe('other');
    expect(result.priority).toBe('medium');
    expect(result.confidence).toBeLessThanOrEqual(0.3);
  });

  it('classifies payment problems as billing_question', () => {
    const result = service.classify('Refund please', 'I need a refund for the duplicate charge on my invoice');
    expect(result.category).toBe('billing_question');
  });

  it('classifies reproducible defects as bug_report', () => {
    const result = service.classify('Broken export', 'Found a bug — steps to reproduce: click export twice');
    expect(result.category).toBe('bug_report');
  });

  it('classifies crashes as technical_issue', () => {
    const result = service.classify('App crash', 'The dashboard throws an exception and crashes on load');
    expect(result.category).toBe('technical_issue');
  });

  it('classifies enhancement ideas as feature_request', () => {
    const result = service.classify('Idea', 'It would be nice to have a dark mode, please add it');
    expect(result.category).toBe('feature_request');
  });

  it('assigns high priority to blocking issues', () => {
    const result = service.classify('Blocked', 'This error is blocking our release, please fix asap');
    expect(result.priority).toBe('high');
  });

  it('assigns low priority to cosmetic issues', () => {
    const result = service.classify('Minor issue', 'A minor cosmetic misalignment on the settings page button');
    expect(result.priority).toBe('low');
  });

  it('matching is case-insensitive', () => {
    const result = service.classify('PASSWORD RESET', 'CANNOT LOG IN TO MY ACCOUNT ANYMORE');
    expect(result.category).toBe('account_access');
  });

  it('confidence grows with keyword count and never exceeds 0.95', () => {
    const one = service.classify('bug', 'This is definitely a bug somewhere in the code');
    const many = service.classify(
      'critical security bug',
      "Can't access production down critical security bug defect reproduce error crash important blocking",
    );
    expect(many.confidence).toBeGreaterThan(one.confidence);
    expect(many.confidence).toBeLessThanOrEqual(0.95);
  });

  it('returns the exact keywords that fired', () => {
    const result = service.classify('Invoice payment', 'The payment on my invoice failed');
    expect(result.keywords_found).toEqual(expect.arrayContaining(['payment', 'invoice']));
  });
});

describe('ClassificationService logging', () => {
  it('logs every classification decision', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    new ClassificationService().classify('Billing issue', 'I was charged twice on my invoice', 'ticket-42');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ticket-42'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('billing_question'));
    logSpy.mockRestore();
  });
});
