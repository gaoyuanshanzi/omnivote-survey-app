import { NextResponse } from 'next/server';
import { getProjectById, saveProject, deleteProject } from '@/lib/store';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ success: false, message: '프로젝트 조회 실패' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await saveProject({ ...body, id });
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: '프로젝트 수정 실패' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await deleteProject(id);
    return NextResponse.json({ success: true, message: '삭제 되었습니다.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '프로젝트 삭제 실패' }, { status: 500 });
  }
}
