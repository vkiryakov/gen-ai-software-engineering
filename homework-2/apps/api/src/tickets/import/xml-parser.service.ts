import { BadRequestException, Injectable } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { ImportRow } from './types';

@Injectable()
export class XmlParserService {
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    parseTagValue: false,
  });

  parse(text: string): ImportRow[] {
    const validation = XMLValidator.validate(text);
    if (validation !== true) {
      throw new BadRequestException(`Malformed XML file: ${validation.err.msg}`);
    }

    const doc = this.parser.parse(text) as { tickets?: { ticket?: unknown } | string };
    const root = doc.tickets;
    if (root === undefined) {
      throw new BadRequestException('XML file must have a root <tickets><ticket>...</ticket></tickets> structure.');
    }

    const rawTickets = root.ticket;
    const list = Array.isArray(rawTickets) ? rawTickets : rawTickets ? [rawTickets] : [];
    return list.map((data, index) => ({ row: index + 1, data: data as Record<string, unknown> }));
  }
}
