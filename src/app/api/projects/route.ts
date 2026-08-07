import { NextResponse } from 'next/server';
import { getProjects, saveProject } from '@/lib/store';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json({ success: false, message: '프로젝트 목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProject = await saveProject(body);
    return NextResponse.json({ success: true, project: newProject });
  } catch (error) {
    return NextResponse.json({ success: false, message: '프로젝트 생성 실패' }, { status: 500 });
  }
}
