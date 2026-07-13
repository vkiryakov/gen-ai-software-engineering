import { CreateTicketInput, UpdateTicketInput } from '@repo/contracts';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { ImportService } from './import/import.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let ticketsService: {
    list: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    classify: jest.Mock;
  };
  let importService: { importFile: jest.Mock };

  beforeEach(() => {
    ticketsService = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      classify: jest.fn(),
    };
    importService = { importFile: jest.fn() };
    controller = new TicketsController(
      ticketsService as unknown as TicketsService,
      importService as unknown as ImportService,
    );
  });

  it('parses comma-separated list filters and forwards them to the service', () => {
    ticketsService.list.mockReturnValue(['ticket']);

    const result = controller.list({
      status: 'new,open',
      priority: 'high,urgent',
      category: 'billing_question',
      assigned_to: 'agent_1',
      unassigned: 'false',
      q: 'refund',
    });

    expect(ticketsService.list).toHaveBeenCalledWith({
      status: ['new', 'open'],
      priority: ['high', 'urgent'],
      category: ['billing_question'],
      assigned_to: 'agent_1',
      unassigned: false,
      q: 'refund',
    });
    expect(result).toEqual(['ticket']);
  });

  it('treats an empty query as no filters and unassigned=true as a boolean flag', () => {
    ticketsService.list.mockReturnValue([]);

    controller.list({ unassigned: 'true' });

    expect(ticketsService.list).toHaveBeenCalledWith({
      status: undefined,
      priority: undefined,
      category: undefined,
      assigned_to: undefined,
      unassigned: true,
      q: undefined,
    });
  });

  it('gets a single ticket by id', () => {
    ticketsService.getById.mockReturnValue({ id: 't1' });
    expect(controller.getOne('t1')).toEqual({ id: 't1' });
    expect(ticketsService.getById).toHaveBeenCalledWith('t1');
  });

  it('creates a ticket from the validated body', () => {
    const body = {
      customer_email: 'a@example.com',
      customer_name: 'A',
      subject: 'Subject',
      description: 'A description that is long enough to pass validation.',
    } as CreateTicketInput;
    ticketsService.create.mockReturnValue({ id: 't2' });

    expect(controller.create(body)).toEqual({ id: 't2' });
    expect(ticketsService.create).toHaveBeenCalledWith(body);
  });

  it('updates a ticket via PATCH', () => {
    ticketsService.update.mockReturnValue({ id: 't3', priority: 'high' });
    const patch = { priority: 'high' } as UpdateTicketInput;

    expect(controller.update('t3', patch)).toEqual({ id: 't3', priority: 'high' });
    expect(ticketsService.update).toHaveBeenCalledWith('t3', patch);
  });

  it('replaces a ticket via PUT using the same update path', () => {
    ticketsService.update.mockReturnValue({ id: 't4', priority: 'low' });
    const patch = { priority: 'low' } as UpdateTicketInput;

    expect(controller.replace('t4', patch)).toEqual({ id: 't4', priority: 'low' });
    expect(ticketsService.update).toHaveBeenCalledWith('t4', patch);
  });

  it('deletes a ticket and returns nothing', () => {
    expect(controller.remove('t5')).toBeUndefined();
    expect(ticketsService.delete).toHaveBeenCalledWith('t5');
  });

  it('classifies a ticket via the classify endpoint', () => {
    ticketsService.classify.mockReturnValue({ category: 'billing_question', priority: 'medium', confidence: 0.9 });
    expect(controller.classify('t6')).toEqual({
      category: 'billing_question',
      priority: 'medium',
      confidence: 0.9,
    });
    expect(ticketsService.classify).toHaveBeenCalledWith('t6');
  });

  it('classifies a ticket via the auto-classify alias endpoint', () => {
    ticketsService.classify.mockReturnValue({ category: 'other', priority: 'low', confidence: 0.5 });
    expect(controller.autoClassify('t7')).toEqual({ category: 'other', priority: 'low', confidence: 0.5 });
    expect(ticketsService.classify).toHaveBeenCalledWith('t7');
  });

  it('delegates file import to the ImportService', () => {
    const file = { originalname: 'tickets.csv', buffer: Buffer.from('') } as Express.Multer.File;
    importService.importFile.mockReturnValue({ imported_count: 1, failed_count: 0, total_count: 1, errors: [] });

    const result = controller.importTickets(file);

    expect(importService.importFile).toHaveBeenCalledWith(file);
    expect(result).toEqual({ imported_count: 1, failed_count: 0, total_count: 1, errors: [] });
  });
});
