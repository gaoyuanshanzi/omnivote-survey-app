import { ProjectItem, ResponseItem, DashboardSummary } from './types';
import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

// File path for fallback persistent storage
const getStorageFilePath = () => {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return '/tmp/omnivote_store.json';
  }
  return path.join(process.cwd(), '.data_store.json');
};

interface PersistentData {
  projects: ProjectItem[];
  responses: ResponseItem[];
}

declare global {
  var __omnivote_store: PersistentData | undefined;
}

function loadStore(): PersistentData {
  if (globalThis.__omnivote_store) {
    return globalThis.__omnivote_store;
  }

  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.responses)) {
        globalThis.__omnivote_store = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load storage file:', err);
  }

  const initial: PersistentData = {
    projects: [],
    responses: []
  };
  globalThis.__omnivote_store = initial;
  return initial;
}

function saveStore(data: PersistentData) {
  globalThis.__omnivote_store = data;
  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write storage file:', err);
  }
}

// ── Fetch all projects ─────────────────────────────────────────
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
      return dbProjects.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        responseCount: p._count.responses
      }));
    }
  } catch (error) {
    console.warn('Prisma DB connect warning, falling back to persistent store:', error);
  }

  const store = loadStore();
  return store.projects.map(p => ({
    ...p,
    responseCount: store.responses.filter(r => r.projectId === p.id).length
  }));
}

// ── Get single project by ID ──────────────────────────────────
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

  const store = loadStore();
  const found = store.projects.find(p => p.id === id);
  if (found) {
    return {
      ...found,
      responseCount: store.responses.filter(r => r.projectId === found.id).length
    };
  }
  return null;
}

// ── Save or Update Project ─────────────────────────────────────
export async function saveProject(projectData: Partial<ProjectItem>): Promise<ProjectItem> {
  const store = loadStore();
  const isEdit = !!projectData.id && store.projects.some(p => p.id === projectData.id);
  const projId = projectData.id || `proj-${Date.now()}`;
  const now = projectData.updatedAt || new Date().toISOString();

  const formattedQuestions = (projectData.questions || []).map((q, qIdx) => {
    const qId = q.id || `q-${projId}-${qIdx}`;
    return {
      id: qId,
      projectId: projId,
      type: q.type,
      title: q.title || '제목 없는 질문',
      minSelect: Math.max(1, q.minSelect || 1),
      maxSelect: Math.max(1, q.maxSelect || 1),
      order: qIdx + 1,
      options: (q.options || []).map((opt, oIdx) => ({
        id: opt.id || `opt-${projId}-${qIdx}-${oIdx}`,
        questionId: qId,
        text: opt.text || `항목 ${oIdx + 1}`,
        order: oIdx + 1
      }))
    };
  });

  const updatedProject: ProjectItem = {
    id: projId,
    title: projectData.title || '새 투표 프로젝트',
    status: projectData.status || 'DRAFT',
    createdAt: projectData.createdAt || now,
    updatedAt: now,
    questions: formattedQuestions,
    responseCount: store.responses.filter(r => r.projectId === projId).length
  };

  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      if (isEdit) {
        // Check if questions have actually changed vs just a status update
        const existingProject = await getProjectById(projId);
        const questionsChanged = !existingProject ||
          JSON.stringify(existingProject.questions.map(q => ({ id: q.id, title: q.title, options: q.options.map(o => ({ id: o.id, text: o.text })) }))) !==
          JSON.stringify(updatedProject.questions.map(q => ({ id: q.id, title: q.title, options: q.options.map(o => ({ id: o.id, text: o.text })) })));

        if (questionsChanged) {
          // Full update: recreate questions (answers cascade-delete, so only do this when questions truly change)
          await prisma.project.update({
            where: { id: projId },
            data: {
              title: updatedProject.title,
              status: updatedProject.status as any,
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
          // Status/title-only update: do NOT touch questions or answers
          await prisma.project.update({
            where: { id: projId },
            data: {
              title: updatedProject.title,
              status: updatedProject.status as any,
            }
          });
        }
      } else {
        await prisma.project.create({
          data: {
            id: updatedProject.id,
            title: updatedProject.title,
            status: updatedProject.status as any,
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
    console.warn('Prisma saveProject error, saved to persistent store:', error);
  }

  // Update in-memory and persistent file store
  if (isEdit) {
    store.projects = store.projects.map(p => (p.id === projId ? updatedProject : p));
  } else {
    store.projects.unshift(updatedProject);
  }
  saveStore(store);

  return updatedProject;
}

// ── Delete Project ─────────────────────────────────────────────
export async function deleteProject(id: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      await prisma.project.delete({ where: { id } });
    }
  } catch (error) {
    console.warn('Prisma deleteProject error:', error);
  }

  const store = loadStore();
  store.projects = store.projects.filter(p => p.id !== id);
  store.responses = store.responses.filter(r => r.projectId !== id);
  saveStore(store);
  return true;
}

// ── Submit Response ────────────────────────────────────────────
export async function submitResponse(
  projectId: string,
  answers: { questionId: string; selectedOptions: string[]; textAnswer?: string }[],
  voterName?: string
): Promise<ResponseItem> {
  const newResp: ResponseItem = {
    id: `resp-${Date.now()}`,
    projectId,
    voterName: voterName || '익명 투표자',
    createdAt: new Date().toISOString(),
    answers
  };

  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      await prisma.response.create({
        data: {
          id: newResp.id,
          projectId,
          voterName: newResp.voterName,
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

  const store = loadStore();
  store.responses.unshift(newResp);
  // Also update response count on target project
  const targetProj = store.projects.find(p => p.id === projectId);
  if (targetProj) {
    targetProj.responseCount = store.responses.filter(r => r.projectId === projectId).length;
  }
  saveStore(store);

  return newResp;
}

// ── Get Dashboard Summary Statistics ────────────────────────────
export async function getDashboardSummary(projectId: string): Promise<DashboardSummary> {
  const project = await getProjectById(projectId);
  if (!project) {
    return { totalResponses: 0, rawResponses: [], questionStats: [] };
  }

  const store = loadStore();
  let responses = store.responses.filter(r => r.projectId === projectId);

  try {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      const dbResps = await prisma.response.findMany({
        where: { projectId },
        include: { answers: true },
        orderBy: { createdAt: 'desc' }
      });
      if (dbResps.length > 0) {
        responses = dbResps.map(r => ({
          id: r.id,
          projectId: r.projectId,
          voterName: r.voterName || '익명 투표자',
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

  const questionsList = Array.isArray(project.questions) ? project.questions : [];

  const questionStats = questionsList.map(q => {
    let totalAnswers = 0;
    const optionMap: { [optId: string]: number } = {};
    const optionsList = Array.isArray(q.options) ? q.options : [];
    optionsList.forEach(o => { if (o?.id) optionMap[o.id] = 0; });
    const subjectiveAnswers: { id: string; voterName?: string; text: string; createdAt: string }[] = [];

    responses.forEach(r => {
      const answersList = Array.isArray(r.answers) ? r.answers : [];
      const ans = answersList.find(a => a.questionId === q.id);
      if (ans) {
        totalAnswers++;
        if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(ans.selectedOptions)) {
          ans.selectedOptions.forEach(optIdOrText => {
            const foundOpt = optionsList.find(o => o.id === optIdOrText || o.text === optIdOrText);
            if (foundOpt) {
              optionMap[foundOpt.id] = (optionMap[foundOpt.id] || 0) + 1;
            }
          });
        }
        if (q.type === 'SUBJECTIVE' && ans.textAnswer && ans.textAnswer.trim().length > 0) {
          subjectiveAnswers.push({
            id: r.id,
            voterName: r.voterName || '익명 투표자',
            text: ans.textAnswer,
            createdAt: r.createdAt
          });
        }
      }
    });

    const optionCounts = optionsList.map(o => {
      const count = optionMap[o.id] || 0;
      const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
      return {
        optionId: o.id,
        text: o.text || '',
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
      title: q.title || '',
      type: q.type,
      totalAnswers,
      optionCounts,
      subjectiveAnswers,
      topOption
    };
  });

  return {
    totalResponses,
    rawResponses: responses,
    questionStats
  };
}
