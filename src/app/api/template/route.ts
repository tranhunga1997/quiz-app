import { TEMPLATE_CSV } from '../../../lib/csv-template';

export async function GET(): Promise<Response> {
  return new Response(TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="quiz-import-template.csv"',
    },
  });
}
