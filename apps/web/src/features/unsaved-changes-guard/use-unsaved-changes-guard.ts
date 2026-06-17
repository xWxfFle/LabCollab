import { useEffect } from 'react'
import { confirmAction } from '@/shared/lib'
import { history } from '@/shared/routing/router'

const leaveMessage = 'Есть несохранённые изменения. Уйти со страницы без сохранения?'

export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty)
      return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', onBeforeUnload)

    const unblock = history.block((tx) => {
      if (confirmAction(leaveMessage)) {
        unblock()
        tx.retry()
      }
    })

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      unblock()
    }
  }, [isDirty])
}
