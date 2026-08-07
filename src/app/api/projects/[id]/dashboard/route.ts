import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/store';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const summary = await getDashboardSummary(id);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json({ success: false, message: '대시보드 통계 불러오기 실패' }, { status: 500 });
  }
}
