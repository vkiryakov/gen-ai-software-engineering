// apps/web/app/page.tsx
import { TriageApp } from '../components/ticket-system/TriageApp';

export default function Home() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return <TriageApp apiBaseUrl={apiBaseUrl} />;
}
