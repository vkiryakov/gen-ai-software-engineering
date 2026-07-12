import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('wraps a simple HttpException message', () => {
    const { host, status, json } = makeHost();
    filter.catch(new NotFoundException('Ticket abc not found.'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: { message: 'Ticket abc not found.' } });
  });

  it('joins array-style validation messages with a space', () => {
    const { host, status, json } = makeHost();
    filter.catch(new BadRequestException(['subject is required', 'email is invalid']), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: { message: 'subject is required email is invalid' },
    });
  });

  it('falls back to 500 for a non-Http error', () => {
    const { host, status, json } = makeHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { message: 'boom' } });
  });
});
