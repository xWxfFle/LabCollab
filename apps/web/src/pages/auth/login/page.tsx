import { Link } from '@argon-router/react';
import { useForm } from '@effector-reform/react';
import { useUnit } from 'effector-react';
import { Alert, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { loginMutation } from '@/shared/api/auth';
import { routes } from '@/shared/routing';
import { form } from './model';

export default function LoginPage() {
  const { fields, onSubmit, errors } = useForm(form);
  const pending = useUnit(loginMutation.$pending);
  const errorMessage =
  typeof errors.email === 'string'
    ? errors.email
    : typeof errors.password === 'string'
      ? errors.password
      : null;

  return (
    <Paper maw={400} mx="auto" mt="xl" p="xl" withBorder>
      <Title order={2} mb="md">
        Вход
      </Title>
      <form onSubmit={onSubmit}>
        <Stack>
          {errorMessage && <Alert color="red">{errorMessage}</Alert>}
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
            Войти
          </Button>
          <Link to={routes.register}>
            <Text size="sm">Регистрация</Text>
          </Link>
        </Stack>
      </form>
    </Paper>
  );
}
