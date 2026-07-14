const notes = [
  { id: 1, title: 'Weekly Meeting Notes', body: 'Discuss roadmap for Q1', ownerId: 'u1', createdAt: '2026-01-05T09:00:00.000Z', updatedAt: '2026-01-05T09:00:00.000Z' },
  { id: 2, title: 'Grocery List', body: 'Milk, eggs, bread', ownerId: 'u1', createdAt: '2026-01-06T09:00:00.000Z', updatedAt: '2026-01-06T09:00:00.000Z' },
  { id: 3, title: 'Project Kickoff', body: 'Align on scope and owners', ownerId: 'u2', createdAt: '2026-01-07T09:00:00.000Z', updatedAt: '2026-01-07T09:00:00.000Z' },
  { id: 4, title: 'Vacation Ideas', body: 'Portugal or Greece', ownerId: 'u2', createdAt: '2026-01-08T09:00:00.000Z', updatedAt: '2026-01-08T09:00:00.000Z' },
  { id: 5, title: 'Budget Review', body: 'Check Q4 spend vs plan', ownerId: 'u1', createdAt: '2026-01-09T09:00:00.000Z', updatedAt: '2026-01-09T09:00:00.000Z' },
  { id: 6, title: 'Book Recommendations', body: 'Ask the team for reads', ownerId: 'u3', createdAt: '2026-01-10T09:00:00.000Z', updatedAt: '2026-01-10T09:00:00.000Z' },
  { id: 7, title: 'Client Feedback', body: 'Summarize call notes', ownerId: 'u2', createdAt: '2026-01-11T09:00:00.000Z', updatedAt: '2026-01-11T09:00:00.000Z' },
  { id: 8, title: 'Sprint Retro', body: 'What went well / what did not', ownerId: 'u1', createdAt: '2026-01-12T09:00:00.000Z', updatedAt: '2026-01-12T09:00:00.000Z' },
  { id: 9, title: 'Onboarding Checklist', body: 'New hire steps', ownerId: 'u3', createdAt: '2026-01-13T09:00:00.000Z', updatedAt: '2026-01-13T09:00:00.000Z' },
  { id: 10, title: 'Meeting Follow-up', body: 'Send action items', ownerId: 'u2', createdAt: '2026-01-14T09:00:00.000Z', updatedAt: '2026-01-14T09:00:00.000Z' },
  { id: 11, title: 'Recipe Ideas', body: 'Try the new pasta dish', ownerId: 'u1', createdAt: '2026-01-15T09:00:00.000Z', updatedAt: '2026-01-15T09:00:00.000Z' },
  { id: 12, title: 'Design Review', body: 'Feedback on new mockups', ownerId: 'u3', createdAt: '2026-01-16T09:00:00.000Z', updatedAt: '2026-01-16T09:00:00.000Z' },
];

let nextId = notes.length + 1;

function getNextId() {
  return nextId++;
}

module.exports = { notes, getNextId };
