import { ArgumentsHost, BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
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

  it('uses a plain string response body directly as the message', () => {
    const { host, status, json } = makeHost();
    filter.catch(new HttpException('plain string body', HttpStatus.BAD_GATEWAY), host);
    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith({ error: { message: 'plain string body' } });
  });

  it('falls back to exception.message when the response body has no message property', () => {
    const { host, status, json } = makeHost();
    filter.catch(new HttpException({ foo: 'bar' }, HttpStatus.BAD_REQUEST), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: { message: expect.any(String) } });
  });

  it('falls back to 500 with a generic message for a non-Error thrown value', () => {
    const { host, status, json } = makeHost();
    filter.catch('just a raw string throw', host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { message: 'Internal server error.' } });
  });
});
