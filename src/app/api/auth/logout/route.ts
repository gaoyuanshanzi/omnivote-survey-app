import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: '로그아웃 되었습니다.' });
  response.cookies.delete('admin_session');
  return response;
}
