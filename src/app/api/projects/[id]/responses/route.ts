import { NextResponse } from 'next/server';
import { submitResponse, getProjectById } from '@/lib/store';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, message: '존재하지 않는 투표입니다.' }, { status: 404 });
    }
    if (project.status === 'CLOSED') {
      return NextResponse.json({ success: false, message: '마감된 투표입니다.' }, { status: 400 });
    }
    if (project.status === 'DRAFT') {
      return NextResponse.json({ success: false, message: '아직 게시되지 않은 투표입니다.' }, { status: 400 });
    }

    const { answers } = await request.json();

    // Validate min/max selection bounds for each multiple choice question
    for (const q of project.questions) {
      if (q.type === 'MULTIPLE_CHOICE') {
        const userAns = answers.find((a: any) => a.questionId === q.id);
        const selected = userAns ? userAns.selectedOptions || [] : [];
        if (selected.length < q.minSelect) {
          return NextResponse.json(
            { success: false, message: `'${q.title}' 질문은 최소 ${q.minSelect}개 이상 선택해야 합니다.` },
            { status: 400 }
          );
        }
        if (selected.length > q.maxSelect) {
          return NextResponse.json(
            { success: false, message: `'${q.title}' 질문은 최대 ${q.maxSelect}개까지 선택 가능합니다.` },
            { status: 400 }
          );
        }
      }
    }

    const newResponse = await submitResponse(id, answers);
    return NextResponse.json({ success: true, message: '투표가 완료되었습니다!', response: newResponse });
  } catch (error) {
    return NextResponse.json({ success: false, message: '투표 제출 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
