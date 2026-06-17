import { createEvent } from 'effector'

/** Сессия недействительна (401) — сброс токена и переход на login. */
export const sessionUnauthorized = createEvent()
