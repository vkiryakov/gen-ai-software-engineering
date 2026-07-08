import { Injectable } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { ImportParseError } from './import-parse.error';

/**
 * XML → ticket-record candidates. Expected shape:
 * <tickets><ticket>…<tags><tag>x</tag></tags><metadata>…</metadata></ticket></tickets>
 * parseTagValue is off so ids like "42" survive as strings for Zod.
 */
@Injectable()
export class XmlParserService {
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  parse(content: string): unknown[] {
    if (!content.trim()) throw new ImportParseError('XML file is empty');

    const validation = XMLValidator.validate(content);
    if (validation !== true) {
      throw new ImportParseError(
        `Malformed XML: ${validation.err.msg} (line ${validation.err.line})`,
      );
    }

    const doc = this.parser.parse(content) as { tickets?: { ticket?: unknown } };
    const raw = doc.tickets?.ticket;
    if (raw === undefined) {
      throw new ImportParseError('XML must contain <tickets><ticket>…</ticket></tickets>');
    }

    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((node) => this.toRecord(node as Record<string, unknown>));
  }

  private toRecord(node: Record<string, unknown>): unknown {
    const record: Record<string, unknown> = { ...node };
    if ('tags' in record) {
      const tag = (record.tags as { tag?: unknown } | null | undefined)?.tag;
      if (tag === undefined) delete record.tags; // empty <tags/> element
      else record.tags = Array.isArray(tag) ? tag : [tag];
    }
    return record;
  }
}
