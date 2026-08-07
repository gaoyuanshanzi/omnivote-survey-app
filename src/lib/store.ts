import { ProjectItem, ResponseItem, DashboardSummary } from './types';
import { prisma } from './prisma';

// Initial Mock Seed Data for instant out-of-the-box demonstration
let mockProjects: ProjectItem[] = [
  {
    id: 'proj-1',
    title: '2026 하반기 신기술 개발 프로젝트 주제 선정 투표',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    responseCount: 24,
    questions: [
      {
        id: 'q-1',
        projectId: 'proj-1',
        type: 'MULTIPLE_CHOICE',
        title: '가장 도전해보고 싶은 핵심 기술 분야를 선택해주세요. (최대 2개)',
        minSelect: 1,
        maxSelect: 2,
        order: 1,
        options: [
          { id: 'opt-1', questionId: 'q-1', text: '생성형 AI & LLM 에이전트 구축', order: 1 },
          { id: 'opt-2', questionId: 'q-1', text: 'Neon PostgreSQL 기반 서버리스 데이터베이스', order: 2 },
          { id: 'opt-3', questionId: 'q-1', text: 'Next.js 15 & React 19 웹 플랫폼', order: 3 },
          { id: 'opt-4', questionId: 'q-1', text: '실시간 데이터 시각화 & 대시보드', order: 4 },
        ]
      },
      {
        id: 'q-2',
        projectId: 'proj-1',
        type: 'SUBJECTIVE',
        title: '선택하신 주된 이유나 추가하고 싶은 프로젝트 의견을 자유롭게 적어주세요.',
        minSelect: 0,
        maxSelect: 0,
        order: 2,
        options: []
      }
    ]
  },
  {
    id: 'proj-2',
    title: '팀 내부 워크샵 장소 선호도 조사',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    responseCount: 15,
    questions: [
      {
        id: 'q-3',
        projectId: 'proj-2',
        type: 'MULTIPLE_CHOICE',
        title: '희망하는 워크샵 장소를 선택하세요.',
        minSelect: 1,
        maxSelect: 1,
        order: 1,
        options: [
          { id: 'opt-5', questionId: 'q-3', text: '제주도 액티비티 워크샵', order: 1 },
          { id: 'opt-6', questionId: 'q-3', text: '강원도 리조트 힐링 워크샵', order: 2 },
          { id: 'opt-7', questionId: 'q-3', text: '도심 속 프리미엄 호캉스', order: 3 },
        ]
      }
    ]
  },
  {
    id: 'proj-3',
    title: '2026 상반기 분기 실적 및 복지 만족도 조사',
    status: 'CLOSED',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    responseCount: 38,
    questions: [
      {
        id: 'q-4',
        projectId: 'proj-3',
        type: 'MULTIPLE_CHOICE',
        title: '현재 직무 만족도 점수',
        minSelect: 1,
        maxSelect: 1,
        order: 1,
        options: [
          { id: 'opt-8', questionId: 'q-4', text: '매우 만족 (5점)', order: 1 },
          { id: 'opt-9', questionId: 'q-4', text: '만족 (4점)', order: 2 },
          { id: 'opt-10', questionId: 'q-4', text: '보통 (3점)', order: 3 },
          { id: 'opt-11', questionId: 'q-4', text: '개선 필요 (1-2점)', order: 4 },
        ]
      }
    ]
  }
];

let mockResponses: ResponseItem[] = [
  {
    id: 'resp-1',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    answers: [
      { questionId: 'q-1', selectedOptions: ['opt-1', 'opt-3'] },
      { questionId: 'q-2', selectedOptions: [], textAnswer: '생성형 AI와 Next.js 결합 시너지 효과가 매우 기대됩니다!' }
    ]
  },
  {
    id: 'resp-2',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    answers: [
      { questionId: 'q-1', selectedOptions: ['opt-1', 'opt-2'] },
      { questionId: 'q-2', selectedOptions: [], textAnswer: 'Neon DB 클라우드 도입으로 서버리스 아키텍처를 테스트해보고 싶습니다.' }
    ]
  },
  {
    id: 'resp-3',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    answers: [
      { questionId: 'q-1', selectedOptions: ['opt-4'] },
      { questionId: 'q-2', selectedOptions: [], textAnswer: '실시간 대시보드 차트 기능이 핵심 UX라고 생각합니다.' }
    ]
  },
  {
    id: 'resp-4',
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    answers: [
      { questionId: 'q-1', selectedOptions: ['opt-1', 'opt-4'] },
      { questionId: 'q-2', selectedOptions: [], textAnswer: '모바일 반응형 투표 시스템의 완성도를 높였으면 합니다.' }
    ]
  }
];

// Seed extra mock responses to populate stats nicely
for (let i = 0; i < 20; i++) {
  const optIds = ['opt-1', 'opt-2', 'opt-3', 'opt-4'];
  const pick1 = optIds[i % 4];
  const pick2 = optIds[(i + 1) % 4];
  mockResponses.push({
    id: `resp-seed-${i}`,
    projectId: 'proj-1',
    createdAt: new Date(Date.now() - 3600000 * (i + 5)).toISOString(),
    answers: [
      { questionId: 'q-1', selectedOptions: [pick1, pick2] },
      { questionId: 'q-2', selectedOptions: [], textAnswer: i % 2 === 0 ? `피드백 #${i + 1}: 빠른 실시간 대시보드와 내보내기 기능 추천` : undefined }
    ]
  });
}

// Fetch all projects
export async function getProjects(): Promise<ProjectItem[]> {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      const dbProjects = await prisma.project.findMany({
        include: {
          questions: {
            include: { options: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' }
          },
          _count: { select: { responses: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (dbProjects.length > 0) {
        return dbProjects.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          responseCount: p._count.responses
        }));
      }
    }
  } catch (error) {
    console.warn('Prisma DB connect warning, falling back to mock DB:', error);
  }
  return mockProjects.map(p => ({
    ...p,
    responseCount: mockResponses.filter(r => r.projectId === p.id).length
  }));
}

// Get single project by ID
export async function getProjectById(id: string): Promise<ProjectItem | null> {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      const p = await prisma.project.findUnique({
        where: { id },
        include: {
          questions: {
            include: { options: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' }
          },
          _count: { select: { responses: true } }
        }
      });
      if (p) {
        return {
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          responseCount: p._count.responses
        };
      }
    }
  } catch (error) {
    console.warn('Prisma getProjectById error:', error);
  }
  const found = mockProjects.find(p => p.id === id);
  if (found) {
    return {
      ...found,
      responseCount: mockResponses.filter(r => r.projectId === found.id).length
    };
  }
  return null;
}

// Save or Update Project
export async function saveProject(projectData: Partial<ProjectItem>): Promise<ProjectItem> {
  const isEdit = !!projectData.id && mockProjects.some(p => p.id === projectData.id);
  const projId = projectData.id || `proj-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedQuestions = (projectData.questions || []).map((q, qIdx) => ({
    id: q.id || `q-${projId}-${qIdx}-${Date.now()}`,
    projectId: projId,
    type: q.type,
    title: q.title || '제목 없는 질문',
    minSelect: Math.max(1, q.minSelect || 1),
    maxSelect: Math.max(1, q.maxSelect || 1),
    order: qIdx + 1,
    options: (q.options || []).map((opt, oIdx) => ({
      id: opt.id || `opt-${projId}-${qIdx}-${oIdx}-${Date.now()}`,
      questionId: q.id,
      text: opt.text || `항목 ${oIdx + 1}`,
      order: oIdx + 1
    }))
  }));

  const updatedProject: ProjectItem = {
    id: projId,
    title: projectData.title || '새 투표 프로젝트',
    status: projectData.status || 'DRAFT',
    createdAt: projectData.createdAt || now,
    updatedAt: now,
    questions: formattedQuestions,
    responseCount: mockResponses.filter(r => r.projectId === projId).length
  };

  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      // Upsert into Neon DB
      if (isEdit) {
        await prisma.project.update({
          where: { id: projId },
          data: {
            title: updatedProject.title,
            status: updatedProject.status,
            questions: {
              deleteMany: {},
              create: updatedProject.questions.map(q => ({
                id: q.id,
                type: q.type,
                title: q.title,
                minSelect: q.minSelect,
                maxSelect: q.maxSelect,
                order: q.order,
                options: {
                  create: q.options.map(o => ({
                    id: o.id,
                    text: o.text,
                    order: o.order
                  }))
                }
              }))
            }
          }
        });
      } else {
        await prisma.project.create({
          data: {
            id: updatedProject.id,
            title: updatedProject.title,
            status: updatedProject.status,
            questions: {
              create: updatedProject.questions.map(q => ({
                id: q.id,
                type: q.type,
                title: q.title,
                minSelect: q.minSelect,
                maxSelect: q.maxSelect,
                order: q.order,
                options: {
                  create: q.options.map(o => ({
                    id: o.id,
                    text: o.text,
                    order: o.order
                  }))
                }
              }))
            }
          }
        });
      }
    }
  } catch (error) {
    console.warn('Prisma saveProject error, saved to memory DB:', error);
  }

  if (isEdit) {
    mockProjects = mockProjects.map(p => p.id === projId ? updatedProject : p);
  } else {
    mockProjects.unshift(updatedProject);
  }
  return updatedProject;
}

// Delete Project
export async function deleteProject(id: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      await prisma.project.delete({ where: { id } });
    }
  } catch (error) {
    console.warn('Prisma deleteProject error:', error);
  }
  mockProjects = mockProjects.filter(p => p.id !== id);
  mockResponses = mockResponses.filter(r => r.projectId !== id);
  return true;
}

// Submit Response
export async function submitResponse(projectId: string, answers: { questionId: string; selectedOptions: string[]; textAnswer?: string }[]): Promise<ResponseItem> {
  const newResp: ResponseItem = {
    id: `resp-${Date.now()}`,
    projectId,
    createdAt: new Date().toISOString(),
    answers
  };

  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      await prisma.response.create({
        data: {
          id: newResp.id,
          projectId,
          answers: {
            create: answers.map(a => ({
              questionId: a.questionId,
              selectedOptions: a.selectedOptions,
              textAnswer: a.textAnswer
            }))
          }
        }
      });
    }
  } catch (error) {
    console.warn('Prisma submitResponse error:', error);
  }

  mockResponses.push(newResp);
  return newResp;
}

// Get Dashboard Summary Statistics
export async function getDashboardSummary(projectId: string): Promise<DashboardSummary> {
  const project = await getProjectById(projectId);
  if (!project) {
    return { totalResponses: 0, questionStats: [] };
  }

  let responses = mockResponses.filter(r => r.projectId === projectId);
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      const dbResps = await prisma.response.findMany({
        where: { projectId },
        include: { answers: true }
      });
      if (dbResps.length > 0) {
        responses = dbResps.map(r => ({
          id: r.id,
          projectId: r.projectId,
          createdAt: r.createdAt.toISOString(),
          answers: r.answers.map(a => ({
            id: a.id,
            questionId: a.questionId,
            selectedOptions: a.selectedOptions,
            textAnswer: a.textAnswer || undefined
          }))
        }));
      }
    }
  } catch (error) {
    console.warn('Prisma getDashboardSummary error:', error);
  }

  const totalResponses = responses.length;

  const questionStats = project.questions.map(q => {
    let totalAnswers = 0;
    const optionMap: { [optId: string]: number } = {};
    q.options.forEach(o => { optionMap[o.id] = 0; });
    const subjectiveAnswers: { id: string; text: string; createdAt: string }[] = [];

    responses.forEach(r => {
      const ans = r.answers.find(a => a.questionId === q.id);
      if (ans) {
        totalAnswers++;
        if (q.type === 'MULTIPLE_CHOICE' && ans.selectedOptions) {
          ans.selectedOptions.forEach(optIdOrText => {
            // match by id or text
            const foundOpt = q.options.find(o => o.id === optIdOrText || o.text === optIdOrText);
            if (foundOpt) {
              optionMap[foundOpt.id] = (optionMap[foundOpt.id] || 0) + 1;
            }
          });
        }
        if (q.type === 'SUBJECTIVE' && ans.textAnswer && ans.textAnswer.trim().length > 0) {
          subjectiveAnswers.push({
            id: r.id,
            text: ans.textAnswer,
            createdAt: r.createdAt
          });
        }
      }
    });

    const optionCounts = q.options.map(o => {
      const count = optionMap[o.id] || 0;
      const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
      return {
        optionId: o.id,
        text: o.text,
        count,
        percentage
      };
    });

    let topOption: { text: string; count: number; percentage: number } | undefined = undefined;
    if (q.type === 'MULTIPLE_CHOICE' && optionCounts.length > 0) {
      const sorted = [...optionCounts].sort((a, b) => b.count - a.count);
      if (sorted[0] && sorted[0].count > 0) {
        topOption = {
          text: sorted[0].text,
          count: sorted[0].count,
          percentage: sorted[0].percentage
        };
      }
    }

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      totalAnswers,
      optionCounts,
      subjectiveAnswers,
      topOption
    };
  });

  return {
    totalResponses,
    questionStats
  };
}
