import type { Summary } from '@prisma/client';
import { prisma } from '@/database';

export function listSummaries() {
  return prisma.summary.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSummary(
  params: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'>
) {
  const summary = await prisma.summary.create({
    data: {
      sourceText: params.sourceText,
      summaryText: params.summaryText,
      modelName: params.modelName,
      mode: params.mode,
      tone: params.tone,
    },
  });

  return summary;
}

export async function getSummary(id: number) {
  const summary = await prisma.summary.findUnique({
    where: { id },
  });

  return summary;
}

export async function deleteSummary(id: number) {
  await prisma.summary.delete({
    where: { id },
  });
}
