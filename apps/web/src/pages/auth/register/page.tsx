import { Link } from '@argon-router/react';
import { useForm } from '@effector-reform/react';
import { useUnit } from 'effector-react';
import { Alert, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { registerMutation } from '@/shared/api/auth';
import { routes } from '@/shared/routing';
import { form } from './model';

export default function RegisterPage() {
  const { fields, onSubmit, errors } = useForm(form);
  const pending = useUnit(registerMutation.$pending);
  const errorMessage = typeof errors.email === 'string' ? errors.email : null;

  return (
    <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
      <Title order={2} mb="md">
        Регистрация
      </Title>
      <form onSubmit={onSubmit}>
        <Stack>
          {errorMessage && <Alert color="red">{errorMessage}</Alert>}
          <TextInput
            label="Имя"
            value={fields.displayName.value}
            onChange={(e) => fields.displayName.onChange(e.currentTarget.value)}
            onBlur={fields.displayName.onBlur}
            error={typeof errors.displayName === 'string' ? errors.displayName : undefined}
            required
          />
          <TextInput
            label="Email"
            value={fields.email.value}
            onChange={(e) => fields.email.onChange(e.currentTarget.value)}
            onBlur={fields.email.onBlur}
            error={typeof errors.email === 'string' ? errors.email : undefined}
            required
          />
          <PasswordInput
            label="Пароль"
            value={fields.password.value}
            onChange={(e) => fields.password.onChange(e.currentTarget.value)}
            onBlur={fields.password.onBlur}
            error={typeof errors.password === 'string' ? errors.password : undefined}
            required
          />
          <Button type="submit" loading={pending}>
            Создать аккаунт
          </Button>
          <Link to={routes.login}>
            <Text size="sm">Уже есть аккаунт</Text>
          </Link>
        </Stack>
      </form>
    </Paper>
  );
}
