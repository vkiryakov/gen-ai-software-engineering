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
});
