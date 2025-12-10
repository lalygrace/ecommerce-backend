import { prisma } from '../db/prisma.js';

// Ensure the session.user includes the `role` field by reading from the database
export async function enrichSessionWithRole(session: any) {
  if (!session || !session.user || session.user.role) return session;
  try {
    const userId = session.user.id as string | undefined;
    if (!userId) return session;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user && user.role) {
      session.user = { ...(session.user || {}), role: user.role };
    }
  } catch (e) {
    // don't fail auth flow because role enrichment failed
    // eslint-disable-next-line no-console
    console.error('[sessionEnricher] failed to enrich session', e);
  }
  return session;
}

export default enrichSessionWithRole;
