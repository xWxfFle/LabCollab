import { eq } from 'drizzle-orm'
import { db } from './db'
import { users } from './db/schema'
import { hashPassword } from './lib/auth-utils'
import {
  clearDemoSeed,
  clearLegacyDemoSeed,
  isDemoSeedApplied,
  runDemoSeed,
} from './lib/seed-demo-data'

const demoUsers = [
  { email: 'alice@lab.local', password: 'password123', displayName: 'Алиса Исследователь' },
  { email: 'bob@lab.local', password: 'password123', displayName: 'Боб Коллега' },
  { email: 'carol@lab.local', password: 'password123', displayName: 'Каролина Наблюдатель' },
] as const

async function upsertDemoUsers() {
  const userIds: string[] = []

  for (const u of demoUsers) {
    const passwordHash = await hashPassword(u.password)
    const [row] = await db
      .insert(users)
      .values({ email: u.email, passwordHash, displayName: u.displayName })
      .onConflictDoNothing()
      .returning()

    if (row) {
      userIds.push(row.id)
    }
    else {
      const [existing] = await db.select().from(users).where(eq(users.email, u.email)).limit(1)
      if (existing)
        userIds.push(existing.id)
    }
  }

  if (userIds.length < demoUsers.length)
    throw new Error('Seed: failed to resolve demo users')

  return {
    aliceId: userIds[0],
    bobId: userIds[1],
    carolId: userIds[2],
  }
}

async function seed() {
  const ids = await upsertDemoUsers()

  const force = process.env.SEED_FORCE === '1'
  if (force) {
    console.log('Seed: SEED_FORCE=1 — удаляем предыдущие demo-проекты')
    await clearDemoSeed()
  }

  if (!force && await isDemoSeedApplied()) {
    console.log('Seed: demo-данные уже есть (demo-seed-v2), пропуск', ids)
    return
  }

  await clearLegacyDemoSeed(ids.aliceId)

  const { projectIds } = await runDemoSeed(ids)

  console.log('Seed complete:', {
    ...ids,
    projectIds,
    projects: [
      'НИР: катализаторы',
      'Спектроскопия полимеров',
      'Электрохимия наночастиц',
    ],
    logins: demoUsers.map(u => u.email),
    password: 'password123',
    hint: 'Пересоздать: SEED_FORCE=1 bun run db:seed',
  })
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
