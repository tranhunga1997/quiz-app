import { Breadcrumb } from '@/components/Breadcrumb';
import { ImportForm } from './ImportForm';

export default function ImportPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Import' }]} />
      <h1 className="mb-4 text-xl font-bold text-ink">Import bộ đề mới</h1>
      <ImportForm />
    </main>
  );
}
