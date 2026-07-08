/**
 * Deterministic sample-data generator (Deliverable 3). Regenerate with:
 *   node apps/api/scripts/generate-fixtures.mjs
 * Subjects/descriptions cycle through classifier keywords so bulk imports
 * exercise every category and priority.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'test', 'fixtures');
const invalidDir = join(fixturesDir, 'invalid');
mkdirSync(invalidDir, { recursive: true });

const SEEDS = [
  { subject: 'Cannot reset my password', description: 'I forgot my password and now I am locked out of my account.', tags: ['auth'] },
  { subject: 'Payment failed twice', description: 'My invoice shows a duplicate charge on my subscription, need a refund.', tags: ['billing', 'money'] },
  { subject: 'App crash on startup', description: 'The application throws an error and crashes every time I open it.', tags: [] },
  { subject: 'Found a bug in export', description: 'Steps to reproduce: open the report, click export, the file is corrupted.', tags: ['export'] },
  { subject: 'Please add dark mode', description: 'It would be nice to have a dark mode feature, just a suggestion.', tags: ['ui'] },
  { subject: 'Production down for all users', description: 'Critical outage, production down since 09:00, this is blocking everyone.', tags: ['outage', 'critical'] },
  { subject: 'Question about my plan', description: 'I would like to understand what my current plan includes exactly.', tags: [] },
];
const SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'];
const DEVICES = ['desktop', 'mobile', 'tablet'];

function ticket(i) {
  const seed = SEEDS[i % SEEDS.length];
  return {
    customer_id: `cust-${String(i + 1).padStart(3, '0')}`,
    customer_email: `customer${i + 1}@example.com`,
    customer_name: `Customer ${i + 1}`,
    subject: `${seed.subject} (#${i + 1})`,
    description: seed.description,
    tags: seed.tags,
    metadata: { source: SOURCES[i % SOURCES.length], device_type: DEVICES[i % DEVICES.length] },
  };
}

// --- sample_tickets.csv (50 records) ---
const csvHeader =
  'customer_id,customer_email,customer_name,subject,description,tags,metadata_source,metadata_device_type';
const csvEscape = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const csvRows = Array.from({ length: 50 }, (_, i) => {
  const t = ticket(i);
  return [
    t.customer_id, t.customer_email, t.customer_name, t.subject, t.description,
    t.tags.join('|'), t.metadata.source, t.metadata.device_type,
  ].map(csvEscape).join(',');
});
writeFileSync(join(fixturesDir, 'sample_tickets.csv'), [csvHeader, ...csvRows].join('\n') + '\n');

// --- sample_tickets.json (20 records) ---
writeFileSync(
  join(fixturesDir, 'sample_tickets.json'),
  JSON.stringify({ records: Array.from({ length: 20 }, (_, i) => ticket(i)) }, null, 2) + '\n',
);

// --- sample_tickets.xml (30 records) ---
const xmlEscape = (v) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const xmlTickets = Array.from({ length: 30 }, (_, i) => {
  const t = ticket(i);
  const tags = t.tags.map((tag) => `<tag>${xmlEscape(tag)}</tag>`).join('');
  return `  <ticket>
    <customer_id>${t.customer_id}</customer_id>
    <customer_email>${t.customer_email}</customer_email>
    <customer_name>${xmlEscape(t.customer_name)}</customer_name>
    <subject>${xmlEscape(t.subject)}</subject>
    <description>${xmlEscape(t.description)}</description>
    <tags>${tags}</tags>
    <metadata><source>${t.metadata.source}</source><device_type>${t.metadata.device_type}</device_type></metadata>
  </ticket>`;
});
writeFileSync(
  join(fixturesDir, 'sample_tickets.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n${xmlTickets.join('\n')}\n</tickets>\n`,
);

// --- invalid files for negative tests ---
writeFileSync(join(invalidDir, 'malformed.csv'),
  'customer_id,customer_email,subject\n"unclosed quote,bad@example.com,Broken row\n');
writeFileSync(join(invalidDir, 'invalid-rows.json'),
  JSON.stringify({ records: [
    { ...ticket(0), customer_email: 'not-an-email' },
    { customer_id: 'cust-x' },
    ticket(2),
  ] }, null, 2) + '\n');
writeFileSync(join(invalidDir, 'broken.xml'), '<?xml version="1.0"?>\n<tickets><ticket><subject>Unclosed\n');
writeFileSync(join(invalidDir, 'empty.csv'), '');
console.log(`Fixtures written to ${fixturesDir}`);
