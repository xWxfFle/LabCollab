import type { TablerIcon } from '@tabler/icons-react'
import { Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconFileExport,
  IconFileText,
  IconFlask,
  IconFolder,
  IconHistory,
  IconServer,
} from '@tabler/icons-react'

interface FeatureItem {
  icon: TablerIcon
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    icon: IconFolder,
    title: 'Проекты и workspace',
    description: 'Дерево папок, страниц документации и экспериментов в одном месте.',
  },
  {
    icon: IconFileText,
    title: 'Записи экспериментов',
    description: 'Настраиваемые шаблоны, чеклист и rich-text наблюдения с ручным сохранением.',
  },
  {
    icon: IconHistory,
    title: 'История версий',
    description: 'Снапшоты изменений и просмотр предыдущих состояний записи.',
  },
  {
    icon: IconFileExport,
    title: 'Экспорт в PDF',
    description: 'Отчёт по эксперименту для руководителя или архива лаборатории.',
  },
  {
    icon: IconServer,
    title: 'Self-hosted',
    description: 'Развёртывание на вашем сервере — все данные остаются у вас.',
  },
]

function FeatureRow({ icon: Icon, title, description }: FeatureItem) {
  return (
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <ThemeIcon color="violet" size={32} radius="md" variant="light">
        <Icon size={18} stroke={1.75} />
      </ThemeIcon>
      <Stack gap={2}>
        <Text fw={500} size="sm">
          {title}
        </Text>
        <Text c="dimmed" size="sm">
          {description}
        </Text>
      </Stack>
    </Group>
  )
}

export function AuthIntroPanel() {
  return (
    <Stack gap="lg" h="100%" justify="center">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon
          size={48}
          radius="md"
          variant="gradient"
          gradient={{ from: 'violet', to: 'grape', deg: 135 }}
        >
          <IconFlask size={26} stroke={1.75} />
        </ThemeIcon>
        <Stack gap={2}>
          <Title order={2}>LabCollab</Title>
          <Text c="dimmed" size="sm">
            Совместный электронный лабораторный журнал
          </Text>
        </Stack>
      </Group>

      <Text size="sm">
        Платформа для исследовательских групп: структурированные записи экспериментов,
        документация проекта и совместная работа без тяжёлых ELN и внешних SaaS.
      </Text>

      <Stack gap="md">
        {features.map(feature => (
          <FeatureRow key={feature.title} {...feature} />
        ))}
      </Stack>
    </Stack>
  )
}
