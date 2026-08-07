import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();

    const expectedAdminId = process.env.ADMIN_ID || 'admin';
    const expectedAdminPassword = process.env.ADMIN_PASSWORD || '123jesus';

    if (id === expectedAdminId && password === expectedAdminPassword) {
      const response = NextResponse.json({ success: true, message: '로그인 성공' });
      // Set secure HTTP-only auth cookie
      response.cookies.set('admin_session', 'authenticated_admin_user', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 1 day
      });
      return response;
    }

    return NextResponse.json(
      { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
