import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  askCopilotApi,
  createActionApi,
  createIdeaApi,
  getActionSummaryApi,
  getActionsApi,
  getBriefingAudioApi,
  getBriefingHistoryApi,
  getCopilotHistoryApi,
  getDailyConditionApi,
  getDailyRoutineApi,
  getIdeasApi,
  getTodayBriefingApi,
  getTodayCopilotApi,
  getTodayPlanApi,
  getWeeklyReviewApi,
  getWeeklyReviewHistoryApi,
  updateActionApi,
  updateActionStatusApi,
  updateDailyConditionApi,
  updateDailyRoutineApi,
  updateIdeaApi,
} from '../../api/assistantApi'
import type {
  AssistantAction,
  AssistantActionSummary,
  AssistantBriefing,
  AssistantBriefingHistory,
  AssistantCopilot,
  AssistantCopilotAskResponse,
  AssistantCopilotHistory,
  AssistantDailyCondition,
  AssistantDailyRoutine,
  AssistantIdea,
  AssistantPlan,
  AssistantWeeklyReview,
  AssistantWeeklyReviewSnapshot,
} from '../../types/api'

export type ActiveTab = 'dashboard' | 'routine' | 'execution' | 'records' | 'ideas'

export function useAssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Data state ─────────────────────────────────────────────────────────────
  const [briefing, setBriefing] = useState<AssistantBriefing | null>(null)
  const [briefingHistory, setBriefingHistory] = useState<AssistantBriefingHistory[]>([])
  const [copilot, setCopilot] = useState<AssistantCopilot | null>(null)
  const [copilotHistory, setCopilotHistory] = useState<AssistantCopilotHistory[]>([])
  const [plan, setPlan] = useState<AssistantPlan | null>(null)
  const [ideas, setIdeas] = useState<AssistantIdea[]>([])
  const [actions, setActions] = useState<AssistantAction[]>([])
  const [actionSummary, setActionSummary] = useState<AssistantActionSummary | null>(null)
  const [dailyCondition, setDailyCondition] = useState<AssistantDailyCondition | null>(null)
  const [dailyRoutine, setDailyRoutine] = useState<AssistantDailyRoutine | null>(null)
  const [weeklyReview, setWeeklyReview] = useState<AssistantWeeklyReview | null>(null)
  const [weeklyReviewHistory, setWeeklyReviewHistory] = useState<AssistantWeeklyReviewSnapshot[]>([])

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [tags, setTags] = useState('')
  const [question, setQuestion] = useState('')
  const [copilotAnswer, setCopilotAnswer] = useState<AssistantCopilotAskResponse | null>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showFallbackReason, setShowFallbackReason] = useState(false)

  // ── Expansion / editing state ──────────────────────────────────────────────
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingRawText, setEditingRawText] = useState('')
  const [editingTags, setEditingTags] = useState('')
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editingActionPriority, setEditingActionPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [editingActionDueDate, setEditingActionDueDate] = useState('')

  // ── Filter state ───────────────────────────────────────────────────────────
  const [ideaFilter, setIdeaFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DONE'>('ALL')
  const [ideaSearch, setIdeaSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL')
  const [actionFocusFilter, setActionFocusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'HIGH_PRIORITY'>('ALL')
  const [historyIntentFilter, setHistoryIntentFilter] = useState<'ALL' | 'PRIORITY' | 'TIME' | 'IDEA' | 'RISK' | 'SUMMARY'>('ALL')
  const [historySearch, setHistorySearch] = useState('')

  // ── Async operation state ──────────────────────────────────────────────────
  const [updatingIdeaId, setUpdatingIdeaId] = useState<string | null>(null)
  const [isSavingAction, setIsSavingAction] = useState<string | null>(null)
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null)
  const [updatingRoutineKey, setUpdatingRoutineKey] = useState<string | null>(null)
  const [isUpdatingCondition, setIsUpdatingCondition] = useState(false)

  // ── Section collapse state ─────────────────────────────────────────────────
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    condition: true,
    routine: true,
    routineCompleted: true,
    copilot: false,
    briefing: true,
    plan: true,
    execution: false,
    actions: false,
    history: true,
    ideas: true,
  })

  // ── Tab ────────────────────────────────────────────────────────────────────
  const tab = searchParams.get('tab')
  const activeTab: ActiveTab =
    tab === 'routine' || tab === 'execution' || tab === 'records' || tab === 'ideas' ? tab : 'dashboard'

  const handleTabChange = (nextTab: ActiveTab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextTab === 'dashboard') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', nextTab)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const toggleSection = (key: keyof typeof collapsedSections) => {
    setCollapsedSections((previous) => ({ ...previous, [key]: !previous[key] }))
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadAssistantData = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    Promise.all([
      getTodayBriefingApi(), getBriefingHistoryApi(), getTodayCopilotApi(), getCopilotHistoryApi(),
      getTodayPlanApi(), getIdeasApi(), getActionsApi(), getActionSummaryApi(),
      getDailyConditionApi(), getDailyRoutineApi(), getWeeklyReviewApi(), getWeeklyReviewHistoryApi(),
    ])
      .then(([briefingResponse, historyResponse, copilotResponse, copilotHistoryResponse, planResponse, ideasResponse, actionsResponse, actionSummaryResponse, dailyConditionResponse, dailyRoutineResponse, weeklyReviewResponse, weeklyReviewHistoryResponse]) => {
        if (!briefingResponse.success || !briefingResponse.data) throw new Error('briefing')
        if (!historyResponse.success || !historyResponse.data) throw new Error('history')
        if (!copilotResponse.success || !copilotResponse.data) throw new Error('copilot')
        if (!copilotHistoryResponse.success || !copilotHistoryResponse.data) throw new Error('copilot-history')
        if (!planResponse.success || !planResponse.data) throw new Error('plan')
        if (!ideasResponse.success || !ideasResponse.data) throw new Error('ideas')
        if (!actionsResponse.success || !actionsResponse.data) throw new Error('actions')
        if (!actionSummaryResponse.success || !actionSummaryResponse.data) throw new Error('action-summary')
        if (!dailyConditionResponse.success || !dailyConditionResponse.data) throw new Error('daily-condition')
        if (!dailyRoutineResponse.success || !dailyRoutineResponse.data) throw new Error('daily-routine')
        if (!weeklyReviewResponse.success || !weeklyReviewResponse.data) throw new Error('weekly-review')
        if (!weeklyReviewHistoryResponse.success || !weeklyReviewHistoryResponse.data) throw new Error('weekly-review-history')

        setBriefing(briefingResponse.data)
        setBriefingHistory(historyResponse.data)
        setCopilot(copilotResponse.data)
        setCopilotHistory(copilotHistoryResponse.data)
        setPlan(planResponse.data)
        setIdeas(ideasResponse.data)
        setActions(actionsResponse.data)
        setActionSummary(actionSummaryResponse.data)
        setDailyCondition(dailyConditionResponse.data)
        setDailyRoutine(dailyRoutineResponse.data)
        setWeeklyReview(weeklyReviewResponse.data)
        setWeeklyReviewHistory(weeklyReviewHistoryResponse.data)
        setErrorMessage('')
      })
      .catch(() => {
        setErrorMessage('AI 비서 데이터를 불러오지 못했습니다. giwon-assistant-api 실행 상태를 확인해줘.')
      })
      .finally(() => {
        setIsLoading(false)
        setIsRefreshing(false)
      })
  }

  useEffect(() => {
    loadAssistantData()
  }, [])

  // ── Utility functions ──────────────────────────────────────────────────────
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getPriorityWeight = (priority: AssistantAction['priority']) => {
    switch (priority) {
      case 'HIGH': return 3
      case 'MEDIUM': return 2
      case 'LOW': return 1
      default: return 0
    }
  }

  const getDueState = (action: AssistantAction) => {
    if (action.status === 'DONE' || !action.dueDate) return 'NONE' as const
    const diffHours = (new Date(action.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
    if (diffHours < 0) return 'OVERDUE' as const
    if (diffHours <= 24) return 'DUE_SOON' as const
    return 'SCHEDULED' as const
  }

  const getDueStateLabel = (state: ReturnType<typeof getDueState>) => {
    switch (state) {
      case 'OVERDUE': return '지연'
      case 'DUE_SOON': return '임박'
      case 'SCHEDULED': return '예정'
      default: return '여유'
    }
  }

  const getRoutineRiskLabel = (riskLevel: AssistantDailyRoutine['riskLevel']) => {
    switch (riskLevel) {
      case 'HIGH': return '즉시 복구'
      case 'MEDIUM': return '관리 필요'
      default: return '안정'
    }
  }

  const getRoutineSignalLabel = (status: AssistantDailyRoutine['signals'][number]['status']) => {
    switch (status) {
      case 'GOOD': return '양호'
      case 'WATCH': return '주의'
      case 'ALERT': return '경고'
      default: return '준비'
    }
  }

  const getConditionTrendLabel = (trend: AssistantDailyCondition['trend']) => {
    switch (trend) {
      case 'UP': return '상승'
      case 'DOWN': return '하락'
      default: return '유지'
    }
  }

  const getOperatingModeLabel = (code: AssistantCopilot['operatingMode']['code']) => {
    switch (code) {
      case 'RESET': return '리셋'
      case 'RECOVERY': return '회복'
      case 'DEEP_FOCUS': return '딥포커스'
      default: return '안정'
    }
  }

  const getIdeaSignalScore = (idea: AssistantIdea) => {
    const statusWeight = idea.status === 'IN_PROGRESS' ? 5 : idea.status === 'OPEN' ? 3 : 1
    const actionWeight = Math.min(idea.suggestedActions.length, 3)
    const tagWeight = idea.tags.some((tag) => ['assistant', 'automation', 'product', 'ai'].includes(tag.toLowerCase())) ? 2 : 0
    return statusWeight + actionWeight + tagWeight
  }

  const getIdeaSignalLabel = (idea: AssistantIdea) => {
    const score = getIdeaSignalScore(idea)
    if (score >= 8) return '핵심'
    if (score >= 5) return '유망'
    return '보관'
  }

  const toLocalDateTimeValue = (value: Date) => {
    const offset = value.getTimezoneOffset()
    return new Date(value.getTime() - offset * 60 * 1000).toISOString().slice(0, 16)
  }

  const buildCandidateDueDate = (kind: 'TODAY' | 'MORNING' | 'END_OF_WEEK') => {
    const now = new Date()
    const candidate = new Date(now)
    if (kind === 'TODAY') {
      candidate.setHours(18, 0, 0, 0)
      if (candidate <= now) candidate.setDate(candidate.getDate() + 1)
      return candidate.toISOString()
    }
    if (kind === 'MORNING') {
      candidate.setDate(candidate.getDate() + 1)
      candidate.setHours(9, 0, 0, 0)
      return candidate.toISOString()
    }
    const day = candidate.getDay()
    const diff = day === 5 ? 0 : (5 - day + 7) % 7
    candidate.setDate(candidate.getDate() + diff)
    candidate.setHours(18, 0, 0, 0)
    if (candidate <= now) candidate.setDate(candidate.getDate() + 7)
    return candidate.toISOString()
  }

  const getModeActionBoost = (action: AssistantAction) => {
    const mode = copilot?.operatingMode.code
    if (!mode || action.status === 'DONE') return 0
    const source = action.sourceQuestion.toLowerCase()
    if (mode === 'RESET') {
      if (source.includes('daily check') || source.includes('condition check-in')) return 700_000_000
      if (action.priority === 'HIGH') return 200_000_000
      return 0
    }
    if (mode === 'RECOVERY') {
      if (source.includes('condition check-in') || source.includes('daily check')) return 500_000_000
      if (source.includes('weekly review') || source.includes('history')) return 250_000_000
      return 0
    }
    if (mode === 'DEEP_FOCUS') {
      if (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing')) return 550_000_000
      if (action.priority === 'HIGH') return 250_000_000
      return 0
    }
    return source.includes('copilot') || action.priority === 'HIGH' ? 180_000_000 : 0
  }

  const getModeActionHint = (action: AssistantAction) => {
    const mode = copilot?.operatingMode.code
    const source = action.sourceQuestion.toLowerCase()
    if (mode === 'RESET' && (source.includes('daily check') || source.includes('condition check-in'))) return '오늘 모드 기준 최우선'
    if (mode === 'RECOVERY' && (source.includes('condition check-in') || source.includes('daily check'))) return '회복 모드와 직접 연결'
    if (mode === 'DEEP_FOCUS' && (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing'))) return '딥포커스 모드 핵심 작업'
    return null
  }

  const getModeCandidateBoost = (candidate: { source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
    const mode = copilot?.operatingMode.code
    const source = candidate.source.toLowerCase()
    if (!mode) return 0
    if (mode === 'RESET') {
      if (source.includes('condition check-in') || source.includes('daily check')) return 10
      return candidate.priority === 'HIGH' ? 2 : 0
    }
    if (mode === 'RECOVERY') {
      if (source.includes('condition check-in') || source.includes('daily check')) return 8
      if (source.includes('weekly review')) return 4
      return 0
    }
    if (mode === 'DEEP_FOCUS') {
      if (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing')) return 9
      return candidate.priority === 'HIGH' ? 3 : 0
    }
    return candidate.priority === 'HIGH' ? 2 : 0
  }

  const getModeCandidateHint = (candidate: { source: string }) => {
    const mode = copilot?.operatingMode.code
    const source = candidate.source.toLowerCase()
    if (mode === 'RESET' && (source.includes('condition check-in') || source.includes('daily check'))) return '리셋 모드 우선 후보'
    if (mode === 'RECOVERY' && (source.includes('condition check-in') || source.includes('daily check'))) return '회복 모드 우선 후보'
    if (mode === 'DEEP_FOCUS' && (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing'))) return '집중 모드 우선 후보'
    return null
  }

  const getActionSortWeight = (action: AssistantAction) => {
    const dueState = getDueState(action)
    const statusWeight = action.status === 'OPEN' ? 10_000_000_000 : 0
    const dueWeight = dueState === 'OVERDUE' ? 3_000_000_000 : dueState === 'DUE_SOON' ? 2_000_000_000 : dueState === 'SCHEDULED' ? 1_000_000_000 : 0
    const priorityWeight = getPriorityWeight(action.priority) * 100_000_000
    const dueDateWeight = action.dueDate ? 10_000_000 - new Date(action.dueDate).getTime() / 1_000_000 : 0
    const createdAtWeight = 1_000_000 - new Date(action.createdAt).getTime() / 1_000_000
    return statusWeight + dueWeight + priorityWeight + dueDateWeight + createdAtWeight + getModeActionBoost(action)
  }

  const getRoutineNotePresets = (item: AssistantDailyRoutine['items'][number]) => {
    if (item.category === 'NUTRITION') {
      return [
        { label: '간단히 먹음', note: '간단히 먹음', completed: true },
        { label: '밖에서 먹음', note: '밖에서 먹음', completed: true },
        { label: '거름', note: '거름', completed: false },
        { label: '늦게 먹을 예정', note: '늦게 먹을 예정', completed: false },
      ] as const
    }
    return [
      { label: '까먹음', note: '까먹음', completed: false },
      { label: '외출 중', note: '외출 중', completed: false },
      { label: '저녁에 할 예정', note: '저녁에 할 예정', completed: false },
      { label: '이미 했음', note: '완료했는데 기록 안함', completed: true },
    ] as const
  }

  // ── Computed values ────────────────────────────────────────────────────────
  const latestHistory = briefingHistory[0]
  const recentIdeasCount = ideas.filter((idea) => idea.status === 'OPEN' || idea.status === 'IN_PROGRESS').length
  const openActionsCount = actions.filter((action) => action.status === 'OPEN').length
  const incompleteRoutineItems = dailyRoutine?.items.filter((item) => !item.completed) ?? []
  const completedRoutineItems = dailyRoutine?.items.filter((item) => item.completed) ?? []
  const filteredIdeas = ideaFilter === 'ALL' ? ideas : ideas.filter((idea) => idea.status === ideaFilter)
  const searchedIdeas = filteredIdeas.filter((idea) => {
    if (!ideaSearch.trim()) return true
    const keyword = ideaSearch.trim().toLowerCase()
    return idea.title.toLowerCase().includes(keyword) || idea.summary.toLowerCase().includes(keyword) || idea.tags.some((tag) => tag.toLowerCase().includes(keyword))
  })
  const filteredActions = actionFilter === 'ALL' ? actions : actions.filter((action) => action.status === actionFilter)
  const focusedActions = actionFocusFilter === 'ALL'
    ? filteredActions
    : filteredActions.filter((action) => {
      if (actionFocusFilter === 'OVERDUE') return getDueState(action) === 'OVERDUE'
      if (actionFocusFilter === 'DUE_SOON') return getDueState(action) === 'DUE_SOON'
      if (actionFocusFilter === 'HIGH_PRIORITY') return action.status === 'OPEN' && action.priority === 'HIGH'
      return true
    })
  const sortedActions = [...focusedActions].sort((left, right) => getActionSortWeight(right) - getActionSortWeight(left))
  const uniqueHeadlineSources = new Set((briefing?.headlines ?? []).map((headline) => headline.source)).size
  const leadHeadline = briefing?.headlines[0] ?? latestHistory?.headlines[0] ?? null
  const overdueActionsCount = actions.filter((action) => getDueState(action) === 'OVERDUE').length
  const topRisk = copilot?.risks[0] ?? weeklyReview?.risks[0] ?? null
  const filteredCopilotHistory = copilotHistory.filter((item) => {
    const intentMatched = historyIntentFilter === 'ALL' || item.intent === historyIntentFilter
    const searchMatched = !historySearch.trim() || item.question.toLowerCase().includes(historySearch.trim().toLowerCase()) || item.answer.toLowerCase().includes(historySearch.trim().toLowerCase())
    return intentMatched && searchMatched
  })
  const inProgressIdeasCount = ideas.filter((idea) => idea.status === 'IN_PROGRESS').length
  const highSignalIdeasCount = ideas.filter((idea) => getIdeaSignalLabel(idea) === '핵심').length
  const actionTitles = new Set(actions.map((action) => action.title.trim().toLowerCase()))
  const sortedIdeas = [...searchedIdeas].sort((left, right) => {
    const signalDelta = getIdeaSignalScore(right) - getIdeaSignalScore(left)
    return signalDelta !== 0 ? signalDelta : new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
  const topSignalIdea = sortedIdeas[0] ?? null
  const topOpenAction = sortedActions.find((action) => action.status === 'OPEN') ?? null
  const topIncompleteRoutine = incompleteRoutineItems[0] ?? null
  const routineActionTitles = new Set(
    actions.filter((action) => action.sourceQuestion.startsWith('Daily Check · ')).map((action) => action.title.trim().toLowerCase()),
  )
  const executionCandidates = [
    dailyCondition?.suggestions[0] ? { title: dailyCondition.suggestions[0], source: `Condition Check-in · 준비도 ${dailyCondition.readinessScore}`, priority: dailyCondition.readinessScore < 45 ? 'HIGH' as const : 'MEDIUM' as const, dueDate: buildCandidateDueDate(dailyCondition.readinessScore < 45 ? 'TODAY' : 'MORNING') } : null,
    copilot?.topPriority ? { title: copilot.topPriority, source: 'Copilot Priority', priority: 'HIGH' as const, dueDate: buildCandidateDueDate('TODAY') } : null,
    copilot?.suggestedNextAction ? { title: copilot.suggestedNextAction, source: 'Copilot Next Action', priority: 'HIGH' as const, dueDate: buildCandidateDueDate('TODAY') } : null,
    ...((briefing?.tasks ?? []).slice(0, 2).map((task) => ({ title: task.title, source: `Morning Briefing · ${task.priority}`, priority: task.priority === 'HIGH' ? 'HIGH' as const : 'MEDIUM' as const, dueDate: buildCandidateDueDate('TODAY') }))),
    ...((plan?.topPriorities ?? []).slice(0, 2).map((priority, index) => ({ title: priority, source: 'Today Plan', priority: index === 0 ? 'HIGH' as const : 'MEDIUM' as const, dueDate: buildCandidateDueDate(index === 0 ? 'TODAY' : 'MORNING') }))),
    ...((weeklyReview?.nextFocus ?? []).slice(0, 2).map((item) => ({ title: item, source: 'Weekly Review', priority: 'MEDIUM' as const, dueDate: buildCandidateDueDate('END_OF_WEEK') }))),
    ...incompleteRoutineItems.slice(0, 2).map((item) => ({ title: `${item.label} 체크`, source: `Daily Check · ${item.targetTime}`, priority: item.category === 'HEALTH' ? 'HIGH' as const : 'MEDIUM' as const, dueDate: buildCandidateDueDate(item.targetTime === '밤' ? 'TODAY' : 'MORNING') })),
  ]
    .filter((item): item is { title: string; source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate: string } => Boolean(item?.title?.trim()))
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.title.trim().toLowerCase() === item.title.trim().toLowerCase()) === index)
    .sort((left, right) => getModeCandidateBoost(right) - getModeCandidateBoost(left))
    .slice(0, 6)

  // ── Action editing ─────────────────────────────────────────────────────────
  const startActionEdit = (action: AssistantAction) => {
    setEditingActionId(action.id)
    setEditingActionPriority(action.priority)
    setEditingActionDueDate(action.dueDate ? action.dueDate.slice(0, 16) : '')
  }

  const resetActionEdit = () => {
    setEditingActionId(null)
    setEditingActionPriority('MEDIUM')
    setEditingActionDueDate('')
  }

  const applyActionDuePreset = (preset: 'TODAY' | 'TOMORROW_MORNING' | 'THIS_FRIDAY') => {
    const now = new Date()
    if (preset === 'TODAY') { now.setHours(18, 0, 0, 0); setEditingActionDueDate(now.toISOString().slice(0, 16)); return }
    if (preset === 'TOMORROW_MORNING') { now.setDate(now.getDate() + 1); now.setHours(9, 0, 0, 0); setEditingActionDueDate(now.toISOString().slice(0, 16)); return }
    const day = now.getDay()
    const diff = day === 5 ? 0 : (5 - day + 7) % 7
    now.setDate(now.getDate() + diff)
    now.setHours(18, 0, 0, 0)
    setEditingActionDueDate(now.toISOString().slice(0, 16))
  }

  // ── Idea editing ───────────────────────────────────────────────────────────
  const startIdeaEdit = (idea: AssistantIdea) => {
    setEditingIdeaId(idea.id)
    setEditingTitle(idea.title)
    setEditingRawText(idea.rawText)
    setEditingTags(idea.tags.join(', '))
    setExpandedIdeaId(idea.id)
  }

  const resetIdeaEdit = () => {
    setEditingIdeaId(null)
    setEditingTitle('')
    setEditingRawText('')
    setEditingTags('')
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleReuseQuestion = (value: string) => {
    setQuestion(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFocusIdea = (ideaId: string) => {
    setIdeaFilter('ALL')
    setExpandedIdeaId(ideaId)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleFocusAction = (actionId: string) => {
    const target = actions.find((action) => action.id === actionId)
    setActionFilter('OPEN')
    setActionFocusFilter('ALL')
    if (target) startActionEdit(target)
    window.scrollTo({ top: document.body.scrollHeight * 0.45, behavior: 'smooth' })
  }

  // ── Async handlers ─────────────────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !rawText.trim()) { setErrorMessage('제목과 내용을 입력해줘.'); return }
    setIsSubmitting(true)
    try {
      const response = await createIdeaApi({ title: title.trim(), rawText: rawText.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) })
      if (!response.success || !response.data) throw new Error('create')
      setIdeas((previous) => [response.data!, ...previous])
      setTitle(''); setRawText(''); setTags(''); setErrorMessage('')
    } catch { setErrorMessage('아이디어 저장에 실패했습니다.') }
    finally { setIsSubmitting(false) }
  }

  const handleAskCopilot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question.trim()) { setErrorMessage('질문을 입력해줘.'); return }
    setIsAsking(true)
    try {
      const response = await askCopilotApi(question.trim())
      if (!response.success || !response.data) throw new Error('ask')
      setCopilotAnswer(response.data)
      setShowFallbackReason(false)
      setCopilotHistory((previous) => [{ id: `${response.data.generatedAt}-${response.data.question}`, question: response.data.question, answer: response.data.answer, intent: response.data.intent, reasoning: response.data.reasoning, suggestedActions: response.data.suggestedActions, source: response.data.source, generatedAt: response.data.generatedAt }, ...previous].slice(0, 10))
      setQuestion(''); setErrorMessage('')
    } catch { setErrorMessage('코파일럿 질문 처리에 실패했습니다.') }
    finally { setIsAsking(false) }
  }

  const handleIdeaStatusChange = async (ideaId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    setUpdatingIdeaId(ideaId)
    try {
      const response = await updateIdeaApi(ideaId, { status })
      if (!response.success || !response.data) throw new Error('update')
      setIdeas((previous) => previous.map((idea) => (idea.id === ideaId ? response.data! : idea)))
      setErrorMessage('')
    } catch { setErrorMessage('아이디어 상태 변경에 실패했습니다.') }
    finally { setUpdatingIdeaId(null) }
  }

  const handleIdeaEditSave = async (ideaId: string) => {
    if (!editingTitle.trim() || !editingRawText.trim()) { setErrorMessage('아이디어 제목과 내용을 입력해줘.'); return }
    setUpdatingIdeaId(ideaId)
    try {
      const response = await updateIdeaApi(ideaId, { title: editingTitle.trim(), rawText: editingRawText.trim(), tags: editingTags.split(',').map((tag) => tag.trim()).filter(Boolean) })
      if (!response.success || !response.data) throw new Error('edit')
      setIdeas((previous) => previous.map((idea) => (idea.id === ideaId ? response.data! : idea)))
      resetIdeaEdit(); setErrorMessage('')
    } catch { setErrorMessage('아이디어 수정에 실패했습니다.') }
    finally { setUpdatingIdeaId(null) }
  }

  const handleCreateActionFromSuggestion = async (actionTitle: string) => {
    if (!copilotAnswer) return
    const suggestedPlan = copilotAnswer.suggestedActionPlans.find((item) => item.title === actionTitle)
    const key = `${copilotAnswer.generatedAt}-${actionTitle}`
    setIsSavingAction(key)
    try {
      const response = await createActionApi({ title: actionTitle, sourceQuestion: copilotAnswer.question, priority: suggestedPlan?.priority, dueDate: suggestedPlan?.dueDate ?? null })
      if (!response.success || !response.data) throw new Error('create-action')
      setActions((previous) => [response.data!, ...previous])
      loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('액션 저장에 실패했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handleCreateActionCandidate = async (candidate: { title: string; source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate: string }) => {
    const key = `candidate-${candidate.title}`
    setIsSavingAction(key)
    try {
      const response = await createActionApi({ title: candidate.title, sourceQuestion: candidate.source, priority: candidate.priority, dueDate: candidate.dueDate })
      if (!response.success || !response.data) throw new Error('candidate-action')
      setActions((previous) => [response.data!, ...previous])
      loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('실행 후보를 액션으로 저장하지 못했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handleCreateAllExecutionCandidates = async () => {
    const pendingCandidates = executionCandidates.filter((candidate) => !actionTitles.has(candidate.title.trim().toLowerCase()))
    if (pendingCandidates.length === 0) { setErrorMessage('이미 저장 가능한 실행 후보가 없어.'); return }
    setIsSavingAction('candidate-bulk')
    try {
      for (const candidate of pendingCandidates) {
        const response = await createActionApi({ title: candidate.title, sourceQuestion: candidate.source, priority: candidate.priority, dueDate: candidate.dueDate })
        if (!response.success || !response.data) throw new Error('bulk-candidate-action')
      }
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('실행 후보 일괄 저장에 실패했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handleCreateActionFromIdea = async (idea: AssistantIdea, actionTitle: string) => {
    const key = `idea-${idea.id}-${actionTitle}`
    setIsSavingAction(key)
    try {
      const response = await createActionApi({ title: actionTitle, sourceQuestion: `Idea · ${idea.title}`, priority: idea.status === 'IN_PROGRESS' ? 'HIGH' : 'MEDIUM', dueDate: buildCandidateDueDate(idea.status === 'IN_PROGRESS' ? 'TODAY' : 'MORNING') })
      if (!response.success || !response.data) throw new Error('idea-action')
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('아이디어에서 액션 저장에 실패했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handleCaptureHeadlineAsIdea = async (headline: { source: string; title: string }) => {
    const key = `headline-${headline.source}-${headline.title}`
    setIsSubmitting(true)
    try {
      const response = await createIdeaApi({ title: `${headline.source} 이슈: ${headline.title}`, rawText: `${headline.source}에서 확인한 이슈를 개인 아이디어/검토 항목으로 보관한다.\n\n헤드라인: ${headline.title}`, tags: ['briefing', 'signal', headline.source.toLowerCase()] })
      if (!response.success || !response.data) throw new Error('capture-headline')
      setIdeas((previous) => [response.data!, ...previous])
      setErrorMessage('')
    } catch { setErrorMessage('헤드라인 아이디어 저장에 실패했습니다.') }
    finally { setIsSubmitting(false) }
  }

  const handleCreateActionFromHistory = async (history: AssistantCopilotHistory, actionTitle: string) => {
    const key = `history-${history.id}-${actionTitle}`
    setIsSavingAction(key)
    try {
      const response = await createActionApi({ title: actionTitle, sourceQuestion: `History · ${history.question}`, priority: history.intent === 'PRIORITY' || history.intent === 'RISK' ? 'HIGH' : 'MEDIUM', dueDate: buildCandidateDueDate(history.intent === 'TIME' ? 'TODAY' : 'MORNING') })
      if (!response.success || !response.data) throw new Error('history-action')
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('질문 이력에서 액션 저장에 실패했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handleActionStatusChange = async (actionId: string, status: 'OPEN' | 'DONE') => {
    setUpdatingActionId(actionId)
    try {
      const response = await updateActionStatusApi(actionId, status)
      if (!response.success || !response.data) throw new Error('update-action')
      setActions((previous) => previous.map((action) => (action.id === actionId ? response.data! : action)))
      loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('액션 상태 변경에 실패했습니다.') }
    finally { setUpdatingActionId(null) }
  }

  const handleActionMetaSave = async (actionId: string) => {
    setUpdatingActionId(actionId)
    try {
      const response = await updateActionApi(actionId, { priority: editingActionPriority, dueDate: editingActionDueDate ? new Date(editingActionDueDate).toISOString() : null })
      if (!response.success || !response.data) throw new Error('update-action-meta')
      setActions((previous) => previous.map((action) => (action.id === actionId ? response.data! : action)))
      loadAssistantData({ silent: true }); resetActionEdit(); setErrorMessage('')
    } catch { setErrorMessage('액션 메타 정보 저장에 실패했습니다.') }
    finally { setUpdatingActionId(null) }
  }

  const handleRoutineToggle = async (itemKey: string, completed: boolean) => {
    setUpdatingRoutineKey(itemKey)
    try {
      const response = await updateDailyRoutineApi(itemKey, { completed })
      if (!response.success || !response.data) throw new Error('routine')
      setDailyRoutine(response.data)
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('Daily Check 업데이트에 실패했습니다.') }
    finally { setUpdatingRoutineKey(null) }
  }

  const handleConditionQuickUpdate = async (key: 'energy' | 'focus' | 'mood' | 'stress' | 'sleepQuality', value: number, note?: string) => {
    if (!dailyCondition) return
    setIsUpdatingCondition(true)
    try {
      const response = await updateDailyConditionApi({ energy: key === 'energy' ? value : dailyCondition.energy, focus: key === 'focus' ? value : dailyCondition.focus, mood: key === 'mood' ? value : dailyCondition.mood, stress: key === 'stress' ? value : dailyCondition.stress, sleepQuality: key === 'sleepQuality' ? value : dailyCondition.sleepQuality, note: note ?? dailyCondition.note })
      if (!response.success || !response.data) throw new Error('condition')
      setDailyCondition(response.data)
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('Condition Check-in 업데이트에 실패했습니다.') }
    finally { setIsUpdatingCondition(false) }
  }

  const handleRoutineNotePreset = async (itemKey: string, note: string, completed = false) => {
    setUpdatingRoutineKey(itemKey)
    try {
      const response = await updateDailyRoutineApi(itemKey, { completed, note })
      if (!response.success || !response.data) throw new Error('routine-note')
      setDailyRoutine(response.data)
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('루틴 메모 저장에 실패했습니다.') }
    finally { setUpdatingRoutineKey(null) }
  }

  const handleCreateActionFromRoutine = async (itemKey: string, label: string, targetTime: string, category: string) => {
    const key = `routine-${itemKey}`
    setIsSavingAction(key)
    try {
      const response = await createActionApi({ title: `${label} 체크`, sourceQuestion: `Daily Check · ${targetTime}`, priority: category === 'HEALTH' ? 'HIGH' : 'MEDIUM', dueDate: buildCandidateDueDate(targetTime === '밤' ? 'TODAY' : 'MORNING') })
      if (!response.success || !response.data) throw new Error('routine-action')
      await loadAssistantData({ silent: true }); setErrorMessage('')
    } catch { setErrorMessage('루틴을 액션으로 저장하는 데 실패했습니다.') }
    finally { setIsSavingAction(null) }
  }

  const handlePlayBriefingAudio = async () => {
    if (isPlayingAudio) return
    setIsPlayingAudio(true)
    try {
      const blob = await getBriefingAudioApi()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { setIsPlayingAudio(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlayingAudio(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch { setIsPlayingAudio(false) }
  }

  return {
    // State
    briefing, briefingHistory, copilot, copilotHistory, plan, ideas, actions, actionSummary,
    dailyCondition, dailyRoutine, weeklyReview, weeklyReviewHistory,
    title, setTitle, rawText, setRawText, tags, setTags, question, setQuestion,
    copilotAnswer, errorMessage, setErrorMessage,
    isSubmitting, isAsking, isLoading, isRefreshing, isPlayingAudio, showFallbackReason, setShowFallbackReason,
    expandedHistoryId, setExpandedHistoryId, expandedIdeaId, setExpandedIdeaId,
    editingIdeaId, editingTitle, setEditingTitle, editingRawText, setEditingRawText, editingTags, setEditingTags,
    editingActionId, editingActionPriority, setEditingActionPriority, editingActionDueDate, setEditingActionDueDate,
    ideaFilter, setIdeaFilter, ideaSearch, setIdeaSearch,
    actionFilter, setActionFilter, actionFocusFilter, setActionFocusFilter,
    historyIntentFilter, setHistoryIntentFilter, historySearch, setHistorySearch,
    updatingIdeaId, isSavingAction, updatingActionId, updatingRoutineKey, isUpdatingCondition,
    collapsedSections,
    // Tab
    activeTab, handleTabChange,
    toggleSection,
    // Computed
    latestHistory, recentIdeasCount, openActionsCount, overdueActionsCount,
    incompleteRoutineItems, completedRoutineItems,
    filteredIdeas, searchedIdeas, sortedIdeas, filteredCopilotHistory,
    filteredActions, focusedActions, sortedActions,
    uniqueHeadlineSources, leadHeadline, topRisk,
    inProgressIdeasCount, highSignalIdeasCount, actionTitles, routineActionTitles,
    topSignalIdea, topOpenAction, topIncompleteRoutine,
    executionCandidates,
    // Utility
    formatDateTime, getDueState, getDueStateLabel,
    getRoutineRiskLabel, getRoutineSignalLabel, getConditionTrendLabel, getOperatingModeLabel,
    getIdeaSignalScore, getIdeaSignalLabel, getModeActionHint, getModeCandidateHint,
    toLocalDateTimeValue, buildCandidateDueDate, getRoutineNotePresets,
    startActionEdit, resetActionEdit, applyActionDuePreset,
    startIdeaEdit, resetIdeaEdit,
    // Handlers
    loadAssistantData,
    handleSubmit, handleAskCopilot,
    handleIdeaStatusChange, handleIdeaEditSave,
    handleReuseQuestion, handleFocusIdea, handleFocusAction,
    handleCreateActionFromSuggestion, handleCreateActionCandidate, handleCreateAllExecutionCandidates,
    handleCreateActionFromIdea, handleCaptureHeadlineAsIdea, handleCreateActionFromHistory,
    handleActionStatusChange, handleActionMetaSave,
    handleRoutineToggle, handleConditionQuickUpdate, handleRoutineNotePreset, handleCreateActionFromRoutine,
    handlePlayBriefingAudio,
  }
}
