import { CreateTicketInputSchema, UpdateTicketInputSchema } from './ticket';

const validInput = {
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
};

describe('CreateTicketInputSchema', () => {
  it('accepts a minimal valid input', () => {
    expect(CreateTicketInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a missing subject', () => {
    const { subject: _subject, ...rest } = validInput;
    expect(CreateTicketInputSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a subject longer than 200 characters', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, subject: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, description: 'too short' });
    expect(result.success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    const result = CreateTicketInputSchema.safeParse({
      ...validInput,
      description: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, customer_email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, category: 'not_a_category' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown priority', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, priority: 'super-urgent' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateTicketInputSchema', () => {
  it('accepts an empty object (fully partial)', () => {
    expect(UpdateTicketInputSchema.safeParse({}).success).toBe(true);
  });
});
