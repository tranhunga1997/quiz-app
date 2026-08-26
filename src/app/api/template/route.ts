export const TEMPLATE_CSV =
  'question,option1,option2,option3,option4,correct,explanation\n' +
  'Thủ đô của Việt Nam là gì?,Hà Nội,TP.HCM,Đà Nẵng,Huế,1,\n' +
  'Chọn các hệ điều hành,Windows,Linux,macOS,Photoshop,1;2;3,Photoshop là phần mềm chỉnh ảnh\n';

export async function GET(): Promise<Response> {
  return new Response(TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="quiz-import-template.csv"',
    },
  });
}
