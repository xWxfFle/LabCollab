export function recordsEqual(a: Record<string, string>, b: Record<string, string>) {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length)
    return false

  for (const key of keysA) {
    if (a[key] !== b[key])
      return false
  }

  return true
}

export function stringArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length)
    return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i])
      return false
  }

  return true
}

export function checklistItemsEqual<T extends { id: string, text: string, done: boolean, order: number }>(
  a: T[],
  b: T[],
) {
  if (a.length !== b.length)
    return false

  for (let i = 0; i < a.length; i++) {
    const left = a[i]
    const right = b[i]
    if (
      left.id !== right.id
      || left.text !== right.text
      || left.done !== right.done
      || left.order !== right.order
    ) {
      return false
    }
  }

  return true
}
