
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir directamente al login para esta fase
  redirect('/login');
}
