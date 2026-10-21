import { redirect } from 'next/navigation';

export default function LegacyPrintPage() {
  redirect('/print/application');
}
