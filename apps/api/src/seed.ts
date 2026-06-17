import { eq } from 'drizzle-orm'
import { db } from './db'
import { projectMembers, projects, users } from './db/schema'
import { hashPassword } from './lib/auth-utils'

async function seed() {
  const demoUsers = [
    { email: 'alice@lab.local', password: 'password123', displayName: 'Алиса Исследователь' },
    { email: 'bob@lab.local', password: 'password123', displayName: 'Боб Коллега' },
  ]

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

  if (userIds.length < 2) {
    console.log('Seed: users already exist or failed')
    return
  }

  const [aliceId, bobId] = userIds

  const [project] = await db
    .insert(projects)
    .values({
      name: 'НИР: катализаторы',
      description: 'Демо-проект для SHWare',
      ownerId: aliceId,
    })
    .returning()

  await db.insert(projectMembers).values([
    { projectId: project.id, userId: aliceId, role: 'owner' },
    { projectId: project.id, userId: bobId, role: 'editor' },
  ])

  console.log('Seed complete:', { projectId: project.id, aliceId, bobId })
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
