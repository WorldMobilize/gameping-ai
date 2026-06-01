/** Budget/price line under match badges — same copy as /recommend. */
export function resolveRecommendResultBudgetLine(params: {
  budgetNote?: string | null
  hasBudgetFilter: boolean
  preferItalian: boolean
}): string | null {
  const { budgetNote, hasBudgetFilter, preferItalian } = params
  if (!hasBudgetFilter && !budgetNote?.trim()) return null
  if (budgetNote?.trim()) return budgetNote.trim()
  return preferItalian
    ? "Prezzi verificati nella scheda gioco, quando disponibili."
    : "Verified prices on the game page when available."
}

export function prefersItalianRecommendCopy(prompt: string): boolean {
  const t = prompt.trim()
  if (!t) return false
  if (/[àèéìòù]/i.test(t)) return true
  return /\b(vorrei|giochi|simile|simili|tipo|però|sera|amici|cozy|quando|più|meno)\b/i.test(
    t
  )
}
