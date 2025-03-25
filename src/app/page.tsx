import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect to the dashboard
  redirect('/dashboard');
}
