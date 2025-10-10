import { prisma } from '@/database';

export function listTranslations() {
  return prisma.translation.findMany();
}

export async function getTranslation(id: number) {
  const translation = await prisma.translation.findUnique({
    where: { id },
  });

  return translation;
}

export async function deleteTranslation(id: number) {
  await prisma.translation.delete({
    where: { id },
  });
}
