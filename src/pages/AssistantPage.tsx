import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { askCopilotApi, createActionApi, createIdeaApi, getActionSummaryApi, getActionsApi, getBriefingHistoryApi, getCopilotHistoryApi, getDailyConditionApi, getDailyRoutineApi, getIdeasApi, getTodayBriefingApi, getTodayCopilotApi, getTodayPlanApi, getWeeklyReviewApi, getWeeklyReviewHistoryApi, updateActionApi, updateActionStatusApi, updateDailyConditionApi, updateDailyRoutineApi, updateIdeaApi } from '../api/assistantApi'
import type { AssistantAction, AssistantActionSummary, AssistantBriefing, AssistantBriefingHistory, AssistantCopilot, AssistantCopilotAskResponse, AssistantCopilotHistory, AssistantDailyCondition, AssistantDailyRoutine, AssistantIdea, AssistantPlan, AssistantWeeklyReview, AssistantWeeklyReviewSnapshot } from '../types/api'

export function AssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const suggestedQuestions = [
    '오늘 뭐부터 하면 좋을까?',
    '지금 열어둔 아이디어 중 뭘 먼저 진행할까?',
    '오늘 일정 기준으로 언제 집중 작업하는 게 좋을까?',
  ] as const

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
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [tags, setTags] = useState('')
  const [question, setQuestion] = useState('')
  const [copilotAnswer, setCopilotAnswer] = useState<AssistantCopilotAskResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null)
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingRawText, setEditingRawText] = useState('')
  const [editingTags, setEditingTags] = useState('')
  const [ideaFilter, setIdeaFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'DONE'>('ALL')
  const [ideaSearch, setIdeaSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL')
  const [actionFocusFilter, setActionFocusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'HIGH_PRIORITY'>('ALL')
  const [historyIntentFilter, setHistoryIntentFilter] = useState<'ALL' | 'PRIORITY' | 'TIME' | 'IDEA' | 'RISK' | 'SUMMARY'>('ALL')
  const [historySearch, setHistorySearch] = useState('')
  const [updatingIdeaId, setUpdatingIdeaId] = useState<string | null>(null)
  const [isSavingAction, setIsSavingAction] = useState<string | null>(null)
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null)
  const [showFallbackReason, setShowFallbackReason] = useState(false)
  const [editingActionId, setEditingActionId] = useState<string | null>(null)
  const [editingActionPriority, setEditingActionPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [editingActionDueDate, setEditingActionDueDate] = useState('')
  const [updatingRoutineKey, setUpdatingRoutineKey] = useState<string | null>(null)
  const [isUpdatingCondition, setIsUpdatingCondition] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    condition: true,
    routine: true,
    copilot: false,
    briefing: true,
    plan: true,
    execution: false,
    actions: false,
    history: true,
    ideas: true,
  })

  const intentLabels: Record<AssistantCopilotAskResponse['intent'], string> = {
    PRIORITY: '우선순위',
    TIME: '시간 계획',
    IDEA: '아이디어',
    RISK: '리스크',
    SUMMARY: '요약',
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getPriorityWeight = (priority: AssistantAction['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 3
      case 'MEDIUM':
        return 2
      case 'LOW':
        return 1
      default:
        return 0
    }
  }

  const getDueState = (action: AssistantAction) => {
    if (action.status === 'DONE' || !action.dueDate) {
      return 'NONE' as const
    }

    const dueTime = new Date(action.dueDate).getTime()
    const now = Date.now()
    const diffHours = (dueTime - now) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return 'OVERDUE' as const
    }

    if (diffHours <= 24) {
      return 'DUE_SOON' as const
    }

    return 'SCHEDULED' as const
  }

  const getDueStateLabel = (state: ReturnType<typeof getDueState>) => {
    switch (state) {
      case 'OVERDUE':
        return '지연'
      case 'DUE_SOON':
        return '임박'
      case 'SCHEDULED':
        return '예정'
      default:
        return '여유'
    }
  }

  const getRoutineRiskLabel = (riskLevel: AssistantDailyRoutine['riskLevel']) => {
    switch (riskLevel) {
      case 'HIGH':
        return '즉시 복구'
      case 'MEDIUM':
        return '관리 필요'
      default:
        return '안정'
    }
  }

  const getRoutineSignalLabel = (status: AssistantDailyRoutine['signals'][number]['status']) => {
    switch (status) {
      case 'GOOD':
        return '양호'
      case 'WATCH':
        return '주의'
      case 'ALERT':
        return '경고'
      default:
        return '준비'
    }
  }

  const getConditionTrendLabel = (trend: AssistantDailyCondition['trend']) => {
    switch (trend) {
      case 'UP':
        return '상승'
      case 'DOWN':
        return '하락'
      default:
        return '유지'
    }
  }

  const getOperatingModeLabel = (code: AssistantCopilot['operatingMode']['code']) => {
    switch (code) {
      case 'RESET':
        return '리셋'
      case 'RECOVERY':
        return '회복'
      case 'DEEP_FOCUS':
        return '딥포커스'
      default:
        return '안정'
    }
  }

  const toggleSection = (key: keyof typeof collapsedSections) => {
    setCollapsedSections((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  const tab = searchParams.get('tab')
  const activeTab: 'dashboard' | 'routine' | 'execution' | 'records' | 'ideas' =
    tab === 'routine' || tab === 'execution' || tab === 'records' || tab === 'ideas' ? tab : 'dashboard'

  const assistantTabs = [
    { key: 'dashboard', label: '대시보드', summary: '상태 판단과 오늘 모드' },
    { key: 'routine', label: '루틴', summary: '컨디션과 생활 체크' },
    { key: 'execution', label: '실행', summary: '브리핑, 질문, 액션' },
    { key: 'records', label: '기록', summary: '회고와 히스토리' },
    { key: 'ideas', label: '아이디어', summary: '캡처와 아카이브' },
  ] as const

  const renderTabContextActions = () => {
    switch (activeTab) {
      case 'routine':
        return (
          <>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('execution')}>
              실행으로 이동
            </button>
            <button
              type="button"
              className="filter-chip"
              onClick={() => setQuestion(topIncompleteRoutine ? `${topIncompleteRoutine.label} 체크를 오늘 언제 하는 게 좋을까?` : '오늘 컨디션 기준으로 루틴을 어떻게 회복하면 좋을까?')}
            >
              루틴 질문 만들기
            </button>
          </>
        )
      case 'execution':
        return (
          <>
            <button
              type="button"
              className="filter-chip"
              onClick={() => setQuestion(copilot?.suggestedNextAction ? `${copilot.suggestedNextAction}를 지금 바로 실행하려면 어떤 순서가 좋을까?` : suggestedQuestions[0])}
            >
              바로 질문 만들기
            </button>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('records')}>
              기록 보기
            </button>
          </>
        )
      case 'records':
        return (
          <>
            <button
              type="button"
              className="filter-chip"
              onClick={() => handleReuseQuestion(filteredCopilotHistory[0]?.question ?? suggestedQuestions[0])}
            >
              최근 질문 다시 열기
            </button>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('execution')}>
              실행으로 이동
            </button>
          </>
        )
      case 'ideas':
        return (
          <>
            <button
              type="button"
              className="filter-chip"
              onClick={() => {
                if (topSignalIdea) handleFocusIdea(topSignalIdea.id)
              }}
            >
              핵심 아이디어 열기
            </button>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('execution')}>
              실행 후보 보기
            </button>
          </>
        )
      default:
        return (
          <>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('routine')}>
              루틴으로 이동
            </button>
            <button
              type="button"
              className="filter-chip"
              onClick={() => loadAssistantData({ silent: true })}
              disabled={isRefreshing}
            >
              {isRefreshing ? '새로고침 중...' : '상태 새로고침'}
            </button>
          </>
        )
    }
  }

  const handleTabChange = (nextTab: typeof assistantTabs[number]['key']) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextTab === 'dashboard') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', nextTab)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const getModeActionBoost = (action: AssistantAction) => {
    const mode = copilot?.operatingMode.code

    if (!mode || action.status === 'DONE') {
      return 0
    }

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

    if (source.includes('copilot') || action.priority === 'HIGH') {
      return 180_000_000
    }

    return 0
  }

  const getModeActionHint = (action: AssistantAction) => {
    const mode = copilot?.operatingMode.code
    const source = action.sourceQuestion.toLowerCase()

    if (mode === 'RESET' && (source.includes('daily check') || source.includes('condition check-in'))) {
      return '오늘 모드 기준 최우선'
    }

    if (mode === 'RECOVERY' && (source.includes('condition check-in') || source.includes('daily check'))) {
      return '회복 모드와 직접 연결'
    }

    if (mode === 'DEEP_FOCUS' && (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing'))) {
      return '딥포커스 모드 핵심 작업'
    }

    return null
  }

  const getModeCandidateBoost = (candidate: { source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
    const mode = copilot?.operatingMode.code
    const source = candidate.source.toLowerCase()

    if (!mode) {
      return 0
    }

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

    if (mode === 'RESET' && (source.includes('condition check-in') || source.includes('daily check'))) {
      return '리셋 모드 우선 후보'
    }

    if (mode === 'RECOVERY' && (source.includes('condition check-in') || source.includes('daily check'))) {
      return '회복 모드 우선 후보'
    }

    if (mode === 'DEEP_FOCUS' && (source.includes('copilot') || source.includes('today plan') || source.includes('morning briefing'))) {
      return '집중 모드 우선 후보'
    }

    return null
  }

  const getActionSortWeight = (action: AssistantAction) => {
    const dueState = getDueState(action)
    const statusWeight = action.status === 'OPEN' ? 10_000_000_000 : 0
    const dueWeight =
      dueState === 'OVERDUE'
        ? 3_000_000_000
        : dueState === 'DUE_SOON'
          ? 2_000_000_000
          : dueState === 'SCHEDULED'
            ? 1_000_000_000
            : 0
    const priorityWeight = getPriorityWeight(action.priority) * 100_000_000
    const dueDateWeight = action.dueDate ? 10_000_000 - new Date(action.dueDate).getTime() / 1_000_000 : 0
    const createdAtWeight = 1_000_000 - new Date(action.createdAt).getTime() / 1_000_000
    const modeBoost = getModeActionBoost(action)
    return statusWeight + dueWeight + priorityWeight + dueDateWeight + createdAtWeight + modeBoost
  }

  const getIdeaSignalScore = (idea: AssistantIdea) => {
    const statusWeight =
      idea.status === 'IN_PROGRESS'
        ? 5
        : idea.status === 'OPEN'
          ? 3
          : 1
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
    const local = new Date(value.getTime() - offset * 60 * 1000)
    return local.toISOString().slice(0, 16)
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

  const loadAssistantData = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    Promise.all([getTodayBriefingApi(), getBriefingHistoryApi(), getTodayCopilotApi(), getCopilotHistoryApi(), getTodayPlanApi(), getIdeasApi(), getActionsApi(), getActionSummaryApi(), getDailyConditionApi(), getDailyRoutineApi(), getWeeklyReviewApi(), getWeeklyReviewHistoryApi()])
      .then(([briefingResponse, historyResponse, copilotResponse, copilotHistoryResponse, planResponse, ideasResponse, actionsResponse, actionSummaryResponse, dailyConditionResponse, dailyRoutineResponse, weeklyReviewResponse, weeklyReviewHistoryResponse]) => {
        if (!briefingResponse.success || !briefingResponse.data) {
          throw new Error('briefing')
        }

        if (!historyResponse.success || !historyResponse.data) {
          throw new Error('history')
        }

        if (!copilotResponse.success || !copilotResponse.data) {
          throw new Error('copilot')
        }

        if (!copilotHistoryResponse.success || !copilotHistoryResponse.data) {
          throw new Error('copilot-history')
        }

        if (!planResponse.success || !planResponse.data) {
          throw new Error('plan')
        }

        if (!ideasResponse.success || !ideasResponse.data) {
          throw new Error('ideas')
        }

        if (!actionsResponse.success || !actionsResponse.data) {
          throw new Error('actions')
        }

        if (!actionSummaryResponse.success || !actionSummaryResponse.data) {
          throw new Error('action-summary')
        }

        if (!dailyConditionResponse.success || !dailyConditionResponse.data) {
          throw new Error('daily-condition')
        }

        if (!dailyRoutineResponse.success || !dailyRoutineResponse.data) {
          throw new Error('daily-routine')
        }

        if (!weeklyReviewResponse.success || !weeklyReviewResponse.data) {
          throw new Error('weekly-review')
        }

        if (!weeklyReviewHistoryResponse.success || !weeklyReviewHistoryResponse.data) {
          throw new Error('weekly-review-history')
        }

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!title.trim() || !rawText.trim()) {
      setErrorMessage('제목과 내용을 입력해줘.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await createIdeaApi({
        title: title.trim(),
        rawText: rawText.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })

      if (!response.success || !response.data) {
        throw new Error('create')
      }

      setIdeas((previous) => [response.data!, ...previous])
      setTitle('')
      setRawText('')
      setTags('')
      setErrorMessage('')
    } catch {
      setErrorMessage('아이디어 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAskCopilot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!question.trim()) {
      setErrorMessage('질문을 입력해줘.')
      return
    }

    setIsAsking(true)

    try {
      const response = await askCopilotApi(question.trim())

      if (!response.success || !response.data) {
        throw new Error('ask')
      }

      setCopilotAnswer(response.data)
      setShowFallbackReason(false)
      setCopilotHistory((previous) => [
        {
          id: `${response.data.generatedAt}-${response.data.question}`,
          question: response.data.question,
          answer: response.data.answer,
          intent: response.data.intent,
          reasoning: response.data.reasoning,
          suggestedActions: response.data.suggestedActions,
          source: response.data.source,
          generatedAt: response.data.generatedAt,
        },
        ...previous,
      ].slice(0, 10))
      setQuestion('')
      setErrorMessage('')
    } catch {
      setErrorMessage('코파일럿 질문 처리에 실패했습니다.')
    } finally {
      setIsAsking(false)
    }
  }

  const latestHistory = briefingHistory[0]
  const recentIdeasCount = ideas.filter((idea) => idea.status === 'OPEN' || idea.status === 'IN_PROGRESS').length
  const openActionsCount = actions.filter((action) => action.status === 'OPEN').length
  const incompleteRoutineItems = dailyRoutine?.items.filter((item) => !item.completed) ?? []
  const filteredIdeas =
    ideaFilter === 'ALL' ? ideas : ideas.filter((idea) => idea.status === ideaFilter)
  const searchedIdeas = filteredIdeas.filter((idea) => {
    if (!ideaSearch.trim()) {
      return true
    }
    const keyword = ideaSearch.trim().toLowerCase()
    return (
      idea.title.toLowerCase().includes(keyword) ||
      idea.summary.toLowerCase().includes(keyword) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(keyword))
    )
  })
  const filteredActions =
    actionFilter === 'ALL' ? actions : actions.filter((action) => action.status === actionFilter)
  const focusedActions =
    actionFocusFilter === 'ALL'
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
    const searchMatched =
      !historySearch.trim() ||
      item.question.toLowerCase().includes(historySearch.trim().toLowerCase()) ||
      item.answer.toLowerCase().includes(historySearch.trim().toLowerCase())
    return intentMatched && searchMatched
  })
  const openIdeasCount = ideas.filter((idea) => idea.status === 'OPEN').length
  const inProgressIdeasCount = ideas.filter((idea) => idea.status === 'IN_PROGRESS').length
  const doneIdeasCount = ideas.filter((idea) => idea.status === 'DONE').length
  const highSignalIdeasCount = ideas.filter((idea) => getIdeaSignalLabel(idea) === '핵심').length
  const mediumSignalIdeasCount = ideas.filter((idea) => getIdeaSignalLabel(idea) === '유망').length
  const actionTitles = new Set(actions.map((action) => action.title.trim().toLowerCase()))
  const sortedIdeas = [...searchedIdeas].sort((left, right) => {
    const signalDelta = getIdeaSignalScore(right) - getIdeaSignalScore(left)
    if (signalDelta !== 0) {
      return signalDelta
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
  const topSignalIdea = sortedIdeas[0] ?? null
  const topOpenAction = sortedActions.find((action) => action.status === 'OPEN') ?? null
  const topIncompleteRoutine = incompleteRoutineItems[0] ?? null
  const routineActionTitles = new Set(
    actions
      .filter((action) => action.sourceQuestion.startsWith('Daily Check · '))
      .map((action) => action.title.trim().toLowerCase()),
  )
  const executionCandidates = [
    dailyCondition?.suggestions[0]
      ? {
        title: dailyCondition.suggestions[0],
        source: `Condition Check-in · 준비도 ${dailyCondition.readinessScore}`,
        priority: dailyCondition.readinessScore < 45 ? 'HIGH' as const : 'MEDIUM' as const,
        dueDate: buildCandidateDueDate(dailyCondition.readinessScore < 45 ? 'TODAY' : 'MORNING'),
      }
      : null,
    copilot?.topPriority
      ? {
        title: copilot.topPriority,
        source: 'Copilot Priority',
        priority: 'HIGH' as const,
        dueDate: buildCandidateDueDate('TODAY'),
      }
      : null,
    copilot?.suggestedNextAction
      ? {
        title: copilot.suggestedNextAction,
        source: 'Copilot Next Action',
        priority: 'HIGH' as const,
        dueDate: buildCandidateDueDate('TODAY'),
      }
      : null,
    ...((briefing?.tasks ?? []).slice(0, 2).map((task) => ({
      title: task.title,
      source: `Morning Briefing · ${task.priority}`,
      priority: task.priority === 'HIGH' ? 'HIGH' as const : 'MEDIUM' as const,
      dueDate: buildCandidateDueDate('TODAY'),
    }))),
    ...((plan?.topPriorities ?? []).slice(0, 2).map((priority, index) => ({
      title: priority,
      source: 'Today Plan',
      priority: index === 0 ? 'HIGH' as const : 'MEDIUM' as const,
      dueDate: buildCandidateDueDate(index === 0 ? 'TODAY' : 'MORNING'),
    }))),
    ...((weeklyReview?.nextFocus ?? []).slice(0, 2).map((item) => ({
      title: item,
      source: 'Weekly Review',
      priority: 'MEDIUM' as const,
      dueDate: buildCandidateDueDate('END_OF_WEEK'),
    }))),
    ...incompleteRoutineItems.slice(0, 2).map((item) => ({
      title: `${item.label} 체크`,
      source: `Daily Check · ${item.targetTime}`,
      priority: item.category === 'HEALTH' ? 'HIGH' as const : 'MEDIUM' as const,
      dueDate: buildCandidateDueDate(item.targetTime === '밤' ? 'TODAY' : 'MORNING'),
    })),
  ]
    .filter((item): item is { title: string; source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate: string } => Boolean(item?.title?.trim()))
    .filter((item, index, collection) =>
      collection.findIndex((candidate) => candidate.title.trim().toLowerCase() === item.title.trim().toLowerCase()) === index)
    .sort((left, right) => getModeCandidateBoost(right) - getModeCandidateBoost(left))
    .slice(0, 6)

  const activeTabContext = (() => {
    switch (activeTab) {
      case 'routine':
        return {
          title: '컨디션과 루틴을 따로 관리하는 생활 탭',
          summary: '오늘 몸 상태와 생활 루틴을 한곳에서 보고, 누락된 항목을 바로 회복하는 탭이야.',
          chips: [
            dailyCondition ? `준비도 ${dailyCondition.readinessScore}` : '컨디션 대기',
            dailyRoutine ? `완료율 ${dailyRoutine.completionRate}%` : '루틴 대기',
            dailyRoutine ? `남은 체크 ${incompleteRoutineItems.length}개` : '체크 대기',
          ],
        }
      case 'execution':
        return {
          title: '지금 처리할 것만 남겨둔 실행 공간',
          summary: '코파일럿 우선순위, 오늘 브리핑, 질문과 액션만 이어서 처리하는 탭이야.',
          chips: [
            `실행 후보 ${executionCandidates.length}개`,
            `열린 액션 ${openActionsCount}건`,
            copilotAnswer ? `최근 질문 ${intentLabels[copilotAnswer.intent]}` : '질문 대기',
          ],
        }
      case 'records':
        return {
          title: '질문, 회고, 브리핑 이력을 모아보는 기록 공간',
          summary: '이번 주 흐름과 저장된 대화/브리핑 이력을 한 줄기로 읽는 탭이야.',
          chips: [
            `회고 ${weeklyReviewHistory.length}건`,
            `질문 이력 ${filteredCopilotHistory.length}건`,
            `브리핑 이력 ${briefingHistory.length}건`,
          ],
        }
      case 'ideas':
        return {
          title: '아이디어를 쌓고 실행 후보로 바꾸는 공간',
          summary: '새로운 아이디어를 저장하고, 강한 신호를 가진 항목부터 액션으로 연결하는 탭이야.',
          chips: [
            `아이디어 ${ideas.length}건`,
            `핵심 신호 ${highSignalIdeasCount}건`,
            `진행 중 ${inProgressIdeasCount}건`,
          ],
        }
      default:
        return {
          title: '오늘 상태를 먼저 판단하는 대시보드',
          summary: '오늘 모드, 핵심 리스크, 다음 행동만 빠르게 읽고 다른 탭으로 넘어가는 시작 화면이야.',
          chips: [
            copilot ? `모드 ${getOperatingModeLabel(copilot.operatingMode.code)}` : '모드 대기',
            topRisk ? '리스크 확인 필요' : '리스크 안정',
            topOpenAction ? '다음 액션 있음' : '액션 대기',
          ],
        }
    }
  })()

  const compactStats = (() => {
    switch (activeTab) {
      case 'routine':
        return [
          { label: 'Condition', value: dailyCondition ? `${dailyCondition.readinessScore}점` : '대기', detail: '오늘 컨디션 준비도' },
          { label: 'Routine', value: dailyRoutine ? `${dailyRoutine.completedCount}/${dailyRoutine.totalCount}` : '대기', detail: '오늘 루틴 체크 수' },
          { label: 'Recovery', value: dailyRoutine?.recoveryScore ?? '-', detail: '회복 점수' },
        ]
      case 'execution':
        return [
          { label: 'Execution', value: executionCandidates.length, detail: '실행 후보 수' },
          { label: 'Open Actions', value: openActionsCount, detail: '남아 있는 액션' },
          { label: 'Question', value: copilotAnswer ? intentLabels[copilotAnswer.intent] : '대기', detail: '최근 질문 상태' },
        ]
      case 'records':
        return [
          { label: 'Review', value: weeklyReviewHistory.length, detail: '저장된 회고' },
          { label: 'History', value: filteredCopilotHistory.length, detail: '질문 이력 수' },
          { label: 'Briefings', value: briefingHistory.length, detail: '브리핑 이력 수' },
        ]
      case 'ideas':
        return [
          { label: 'Ideas', value: ideas.length, detail: '저장된 아이디어' },
          { label: 'High Signal', value: highSignalIdeasCount, detail: '핵심 신호 아이디어' },
          { label: 'In Progress', value: inProgressIdeasCount, detail: '진행 중 아이디어' },
        ]
      default:
        return []
    }
  })()

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

  const handleIdeaStatusChange = async (ideaId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    setUpdatingIdeaId(ideaId)

    try {
      const response = await updateIdeaApi(ideaId, { status })

      if (!response.success || !response.data) {
        throw new Error('update')
      }

      setIdeas((previous) =>
        previous.map((idea) => (idea.id === ideaId ? response.data! : idea))
      )
      setErrorMessage('')
    } catch {
      setErrorMessage('아이디어 상태 변경에 실패했습니다.')
    } finally {
      setUpdatingIdeaId(null)
    }
  }

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

  const handleIdeaEditSave = async (ideaId: string) => {
    if (!editingTitle.trim() || !editingRawText.trim()) {
      setErrorMessage('아이디어 제목과 내용을 입력해줘.')
      return
    }

    setUpdatingIdeaId(ideaId)

    try {
      const response = await updateIdeaApi(ideaId, {
        title: editingTitle.trim(),
        rawText: editingRawText.trim(),
        tags: editingTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })

      if (!response.success || !response.data) {
        throw new Error('edit')
      }

      setIdeas((previous) => previous.map((idea) => (idea.id === ideaId ? response.data! : idea)))
      resetIdeaEdit()
      setErrorMessage('')
    } catch {
      setErrorMessage('아이디어 수정에 실패했습니다.')
    } finally {
      setUpdatingIdeaId(null)
    }
  }

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
    if (target) {
      startActionEdit(target)
    }
    window.scrollTo({ top: document.body.scrollHeight * 0.45, behavior: 'smooth' })
  }

  const handleCreateActionFromSuggestion = async (actionTitle: string) => {
    if (!copilotAnswer) {
      return
    }

    const suggestedPlan = copilotAnswer.suggestedActionPlans.find((item) => item.title === actionTitle)

    const key = `${copilotAnswer.generatedAt}-${actionTitle}`
    setIsSavingAction(key)

    try {
      const response = await createActionApi({
        title: actionTitle,
        sourceQuestion: copilotAnswer.question,
        priority: suggestedPlan?.priority,
        dueDate: suggestedPlan?.dueDate ?? null,
      })
      if (!response.success || !response.data) {
        throw new Error('create-action')
      }
      setActions((previous) => [response.data!, ...previous])
      loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('액션 저장에 실패했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const handleCreateActionCandidate = async (candidate: { title: string; source: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate: string }) => {
    const key = `candidate-${candidate.title}`
    setIsSavingAction(key)

    try {
      const response = await createActionApi({
        title: candidate.title,
        sourceQuestion: candidate.source,
        priority: candidate.priority,
        dueDate: candidate.dueDate,
      })

      if (!response.success || !response.data) {
        throw new Error('candidate-action')
      }

      setActions((previous) => [response.data!, ...previous])
      loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('실행 후보를 액션으로 저장하지 못했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const handleCreateAllExecutionCandidates = async () => {
    const pendingCandidates = executionCandidates.filter((candidate) => !actionTitles.has(candidate.title.trim().toLowerCase()))

    if (pendingCandidates.length === 0) {
      setErrorMessage('이미 저장 가능한 실행 후보가 없어.')
      return
    }

    setIsSavingAction('candidate-bulk')

    try {
      for (const candidate of pendingCandidates) {
        const response = await createActionApi({
          title: candidate.title,
          sourceQuestion: candidate.source,
          priority: candidate.priority,
          dueDate: candidate.dueDate,
        })

        if (!response.success || !response.data) {
          throw new Error('bulk-candidate-action')
        }
      }

      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('실행 후보 일괄 저장에 실패했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const handleCreateActionFromIdea = async (idea: AssistantIdea, actionTitle: string) => {
    const key = `idea-${idea.id}-${actionTitle}`
    setIsSavingAction(key)

    try {
      const response = await createActionApi({
        title: actionTitle,
        sourceQuestion: `Idea · ${idea.title}`,
        priority: idea.status === 'IN_PROGRESS' ? 'HIGH' : 'MEDIUM',
        dueDate: buildCandidateDueDate(idea.status === 'IN_PROGRESS' ? 'TODAY' : 'MORNING'),
      })

      if (!response.success || !response.data) {
        throw new Error('idea-action')
      }

      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('아이디어 추천 액션 저장에 실패했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const handleCaptureHeadlineAsIdea = async (headline: { source: string; title: string }) => {
    const key = `headline-${headline.source}-${headline.title}`
    setIsSubmitting(true)

    try {
      const response = await createIdeaApi({
        title: `${headline.source} 이슈: ${headline.title}`,
        rawText: `${headline.source}에서 확인한 이슈를 개인 아이디어/검토 항목으로 보관한다.\n\n헤드라인: ${headline.title}`,
        tags: ['briefing', 'signal', headline.source.toLowerCase()],
      })

      if (!response.success || !response.data) {
        throw new Error('capture-headline')
      }

      setIdeas((previous) => [response.data!, ...previous])
      setErrorMessage('')
    } catch {
      setErrorMessage('헤드라인을 아이디어로 저장하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateActionFromHistory = async (history: AssistantCopilotHistory, actionTitle: string) => {
    const key = `history-${history.id}-${actionTitle}`
    setIsSavingAction(key)

    try {
      const response = await createActionApi({
        title: actionTitle,
        sourceQuestion: `History · ${history.question}`,
        priority: history.intent === 'PRIORITY' || history.intent === 'RISK' ? 'HIGH' : 'MEDIUM',
        dueDate: buildCandidateDueDate(history.intent === 'TIME' ? 'TODAY' : 'MORNING'),
      })

      if (!response.success || !response.data) {
        throw new Error('history-action')
      }

      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('질문 이력에서 액션 저장에 실패했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const handleActionStatusChange = async (actionId: string, status: 'OPEN' | 'DONE') => {
    setUpdatingActionId(actionId)
    try {
      const response = await updateActionStatusApi(actionId, status)
      if (!response.success || !response.data) {
        throw new Error('update-action')
      }
      setActions((previous) =>
        previous.map((action) => (action.id === actionId ? response.data! : action))
      )
      loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('액션 상태 변경에 실패했습니다.')
    } finally {
      setUpdatingActionId(null)
    }
  }

  const handleActionMetaSave = async (actionId: string) => {
    setUpdatingActionId(actionId)
    try {
      const response = await updateActionApi(actionId, {
        priority: editingActionPriority,
        dueDate: editingActionDueDate ? new Date(editingActionDueDate).toISOString() : null,
      })
      if (!response.success || !response.data) {
        throw new Error('update-action-meta')
      }
      setActions((previous) =>
        previous.map((action) => (action.id === actionId ? response.data! : action))
      )
      loadAssistantData({ silent: true })
      resetActionEdit()
      setErrorMessage('')
    } catch {
      setErrorMessage('액션 메타 정보 저장에 실패했습니다.')
    } finally {
      setUpdatingActionId(null)
    }
  }

  const handleRoutineToggle = async (itemKey: string, completed: boolean) => {
    setUpdatingRoutineKey(itemKey)

    try {
      const response = await updateDailyRoutineApi(itemKey, { completed })
      if (!response.success || !response.data) {
        throw new Error('routine')
      }
      setDailyRoutine(response.data)
      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('Daily Check 업데이트에 실패했습니다.')
    } finally {
      setUpdatingRoutineKey(null)
    }
  }

  const handleConditionQuickUpdate = async (
    key: 'energy' | 'focus' | 'mood' | 'stress' | 'sleepQuality',
    value: number,
    note?: string,
  ) => {
    if (!dailyCondition) {
      return
    }

    setIsUpdatingCondition(true)
    try {
      const response = await updateDailyConditionApi({
        energy: key === 'energy' ? value : dailyCondition.energy,
        focus: key === 'focus' ? value : dailyCondition.focus,
        mood: key === 'mood' ? value : dailyCondition.mood,
        stress: key === 'stress' ? value : dailyCondition.stress,
        sleepQuality: key === 'sleepQuality' ? value : dailyCondition.sleepQuality,
        note: note ?? dailyCondition.note,
      })
      if (!response.success || !response.data) {
        throw new Error('condition')
      }
      setDailyCondition(response.data)
      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('Condition Check-in 업데이트에 실패했습니다.')
    } finally {
      setIsUpdatingCondition(false)
    }
  }

  const handleRoutineNotePreset = async (itemKey: string, note: string, completed = false) => {
    setUpdatingRoutineKey(itemKey)

    try {
      const response = await updateDailyRoutineApi(itemKey, { completed, note })
      if (!response.success || !response.data) {
        throw new Error('routine-note')
      }
      setDailyRoutine(response.data)
      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('루틴 메모 저장에 실패했습니다.')
    } finally {
      setUpdatingRoutineKey(null)
    }
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

  const handleCreateActionFromRoutine = async (itemKey: string, label: string, targetTime: string, category: string) => {
    const key = `routine-${itemKey}`
    setIsSavingAction(key)

    try {
      const response = await createActionApi({
        title: `${label} 체크`,
        sourceQuestion: `Daily Check · ${targetTime}`,
        priority: category === 'HEALTH' ? 'HIGH' : 'MEDIUM',
        dueDate: buildCandidateDueDate(targetTime === '밤' ? 'TODAY' : 'MORNING'),
      })
      if (!response.success || !response.data) {
        throw new Error('routine-action')
      }
      await loadAssistantData({ silent: true })
      setErrorMessage('')
    } catch {
      setErrorMessage('루틴을 액션으로 저장하는 데 실패했습니다.')
    } finally {
      setIsSavingAction(null)
    }
  }

  const applyActionDuePreset = (preset: 'TODAY' | 'TOMORROW_MORNING' | 'THIS_FRIDAY') => {
    const now = new Date()

    if (preset === 'TODAY') {
      now.setHours(18, 0, 0, 0)
      setEditingActionDueDate(now.toISOString().slice(0, 16))
      return
    }

    if (preset === 'TOMORROW_MORNING') {
      now.setDate(now.getDate() + 1)
      now.setHours(9, 0, 0, 0)
      setEditingActionDueDate(now.toISOString().slice(0, 16))
      return
    }

    const day = now.getDay()
    const diff = day === 5 ? 0 : (5 - day + 7) % 7
    now.setDate(now.getDate() + diff)
    now.setHours(18, 0, 0, 0)
    setEditingActionDueDate(now.toISOString().slice(0, 16))
  }

  return (
    <main className="page-shell assistant-dashboard">
      <header className="assistant-hero">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h1>개인 비서 대시보드</h1>
          <p className="hero-summary">
            아침 브리핑, 오늘 계획, 아이디어 저장을 한 화면에서 다루는 개인용 보조 공간
          </p>
          {copilot ? (
            <div className="assistant-news-highlight">
              <span className="control-label">Today Mode</span>
              <strong>{copilot.operatingMode.title} · {getOperatingModeLabel(copilot.operatingMode.code)}</strong>
              <p>{copilot.operatingMode.summary}</p>
              <div className="assistant-tags">
                <span className="tag-chip">권장 블록 {copilot.operatingMode.recommendedBlockMinutes}분</span>
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => setQuestion(`${copilot.operatingMode.title} 기준으로 오늘 일정을 어떻게 운영하면 좋을까?`)}
                >
                  모드 기준으로 질문하기
                </button>
              </div>
            </div>
          ) : null}
          <div className="hero-actions">
            <button
              className="secondary-link action-button"
              type="button"
              onClick={() => loadAssistantData({ silent: true })}
              disabled={isRefreshing}
            >
              {isRefreshing ? '새로고침 중...' : '새로고침'}
            </button>
            <Link className="secondary-link" to="/">
              Back Home
            </Link>
          </div>
        </div>
        <div className="assistant-status-card">
          <span className="control-label">Assistant Status</span>
          <strong>{briefing?.weather.location ?? 'Seoul'}</strong>
          <p>
            {briefing
              ? `${briefing.weather.condition} · ${briefing.weather.temperatureCelsius}°C`
              : '연결 대기 중'}
          </p>
          <div className="assistant-status-meta">
            <span>최근 브리핑 {briefing ? formatDateTime(briefing.generatedAt) : '-'}</span>
            <span>열린 아이디어 {recentIdeasCount}건</span>
          </div>
        </div>
      </header>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {activeTab === 'dashboard' ? (
      <section className="assistant-stats-grid">
        <article className="assistant-stat-card">
          <span className="control-label">Today</span>
          <strong>{briefing?.tasks.length ?? 0}</strong>
          <p>오늘 브리핑에 포함된 주요 작업 수</p>
        </article>
        <article className="assistant-stat-card">
          <span className="control-label">Plan Blocks</span>
          <strong>{plan?.timeBlocks.length ?? 0}</strong>
          <p>시간 블록 기준으로 정리된 오늘 계획</p>
        </article>
        <article className="assistant-stat-card">
          <span className="control-label">Headline Sources</span>
          <strong>{uniqueHeadlineSources}</strong>
          <p>오늘 브리핑에 반영된 뉴스 소스 수</p>
        </article>
        <article className="assistant-stat-card">
          <span className="control-label">Ideas</span>
          <strong>{ideas.length}</strong>
          <p>보관 중인 아이디어 아카이브 수</p>
        </article>
        <article className="assistant-stat-card">
          <span className="control-label">Action Tracker</span>
          <strong>{openActionsCount}</strong>
          <p>아직 완료하지 않은 실행 액션 수</p>
        </article>
        <article className="assistant-stat-card">
          <span className="control-label">Daily Check</span>
          <strong>{dailyRoutine ? `${dailyRoutine.completedCount}/${dailyRoutine.totalCount}` : '-'}</strong>
          <p>{dailyRoutine ? `오늘 완료율 ${dailyRoutine.completionRate}%` : '루틴 체크를 불러오는 중'}</p>
        </article>
      </section>
      ) : (
      <section className="assistant-mini-stats-grid">
        {compactStats.map((item) => (
          <article key={item.label} className="assistant-mini-stat-card">
            <span className="control-label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>
      )}

      <section className="assistant-tab-bar">
        {assistantTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`assistant-tab-button ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => handleTabChange(item.key)}
          >
            <strong>{item.label}</strong>
            <span>{item.summary}</span>
          </button>
        ))}
      </section>

      <section className="assistant-tab-context">
        <div>
          <p className="eyebrow">Current View</p>
          <h2>{activeTabContext.title}</h2>
          <p className="assistant-summary">{activeTabContext.summary}</p>
        </div>
        <div className="assistant-context-side">
          <div className="assistant-tags">
            {activeTabContext.chips.map((chip) => (
              <span key={chip} className="tag-chip">
                {chip}
              </span>
            ))}
          </div>
          <div className="assistant-tags assistant-context-actions">
            {renderTabContextActions()}
          </div>
        </div>
      </section>

      {activeTab === 'dashboard' ? (
        <>
      <section className="assistant-overview-grid">
        <article className="assistant-overview-card assistant-overview-card-primary">
          <span className="control-label">Today Mode Snapshot</span>
          <strong>{copilot?.operatingMode.title ?? '모드 계산 중'}</strong>
          <p>{copilot?.headline ?? '오늘 상태를 분석하는 중이야.'}</p>
          <div className="assistant-tags">
            {copilot ? <span className="tag-chip">권장 블록 {copilot.operatingMode.recommendedBlockMinutes}분</span> : null}
            <button type="button" className="filter-chip" onClick={() => handleTabChange('execution')}>
              실행 탭으로 이동
            </button>
          </div>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Routine Health</span>
          <strong>{dailyCondition ? `${dailyCondition.readinessScore}점` : '대기 중'}</strong>
          <p>{dailyCondition?.summary ?? '컨디션 체크인을 불러오는 중이야.'}</p>
          <div className="assistant-tags">
            {dailyCondition ? <span className="tag-chip">추세 {getConditionTrendLabel(dailyCondition.trend)}</span> : null}
            <button type="button" className="filter-chip" onClick={() => handleTabChange('routine')}>
              루틴 탭 보기
            </button>
          </div>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Routine Snapshot</span>
          <strong>{dailyRoutine ? `${dailyRoutine.completedCount}/${dailyRoutine.totalCount}` : '대기 중'}</strong>
          <p>{dailyRoutine?.insight ?? '오늘 루틴 상태를 계산하는 중이야.'}</p>
          <div className="assistant-tags">
            {dailyRoutine ? <span className="tag-chip">{getRoutineRiskLabel(dailyRoutine.riskLevel)}</span> : null}
            <button type="button" className="filter-chip" onClick={() => handleTabChange('routine')}>
              루틴 탭 보기
            </button>
          </div>
        </article>
        <article className="assistant-overview-card assistant-overview-card-accent">
          <span className="control-label">Next Move</span>
          <strong>{topOpenAction?.title ?? copilot?.suggestedNextAction ?? '다음 액션 계산 중'}</strong>
          <p>{topRisk ?? '급한 리스크는 아직 없어. 실행 탭에서 액션과 질문을 이어서 처리하면 돼.'}</p>
          <div className="assistant-tags">
            <button type="button" className="filter-chip" onClick={() => handleTabChange('records')}>
              기록 보기
            </button>
            <button type="button" className="filter-chip" onClick={() => handleTabChange('ideas')}>
              아이디어 보기
            </button>
          </div>
        </article>
      </section>
        </>
      ) : null}

      {activeTab === 'routine' ? (
        <>
      <section className="assistant-overview-grid">
        <article className="assistant-overview-card assistant-overview-card-primary">
          <span className="control-label">Condition Snapshot</span>
          <strong>{dailyCondition ? `${dailyCondition.readinessScore}점` : '대기 중'}</strong>
          <p>{dailyCondition?.summary ?? '컨디션 체크인을 불러오는 중이야.'}</p>
          <div className="assistant-tags">
            {dailyCondition ? <span className="tag-chip">추세 {getConditionTrendLabel(dailyCondition.trend)}</span> : null}
            {dailyCondition?.suggestions[0] ? (
              <button type="button" className="filter-chip" onClick={() => setQuestion(`${dailyCondition.suggestions[0]}를 기준으로 오늘 일을 어떻게 조절하면 좋을까?`)}>
                컨디션 질문 만들기
              </button>
            ) : null}
          </div>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Routine Snapshot</span>
          <strong>{dailyRoutine ? `${dailyRoutine.completedCount}/${dailyRoutine.totalCount}` : '대기 중'}</strong>
          <p>{dailyRoutine?.insight ?? '오늘 루틴 상태를 계산하는 중이야.'}</p>
          <div className="assistant-tags">
            {dailyRoutine ? <span className="tag-chip">{getRoutineRiskLabel(dailyRoutine.riskLevel)}</span> : null}
            {topIncompleteRoutine ? <span className="tag-chip">다음 {topIncompleteRoutine.label}</span> : null}
          </div>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Recovery Score</span>
          <strong>{dailyRoutine?.recoveryScore ?? '-'}</strong>
          <p>{dailyRoutine ? `${dailyRoutine.streakDays}일 연속 흐름과 수면 준비 상태를 반영한 점수야.` : '회복 점수를 계산하는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card assistant-overview-card-accent">
          <span className="control-label">Recovery Action</span>
          <strong>{topIncompleteRoutine?.label ?? dailyRoutine?.suggestedActions[0] ?? '복구 액션 계산 중'}</strong>
          <p>{dailyRoutine?.focusMode.summary ?? '누락된 루틴을 먼저 복구하면 오늘 모드가 더 안정된다.'}</p>
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card" id="condition-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Condition Check-in</p>
              <h2>오늘 컨디션 신호</h2>
            </div>
            <div className="assistant-tags">
              <span className="tag-chip">{dailyCondition ? `준비도 ${dailyCondition.readinessScore}` : '대기 중'}</span>
              <span className="tag-chip">{dailyCondition ? `추세 ${getConditionTrendLabel(dailyCondition.trend)}` : '추세 대기'}</span>
              <button type="button" className="filter-chip" onClick={() => toggleSection('condition')}>
                {collapsedSections.condition ? '펼치기' : '접기'}
              </button>
            </div>
          </div>
          {!collapsedSections.condition ? (
            <>
          <p className="assistant-summary">
            {dailyCondition
              ? '에너지, 집중, 기분, 스트레스, 수면 상태를 5점 기준으로 빠르게 남겨서 오늘 작업 강도를 조절하는 영역이야.'
              : 'Condition Check-in 데이터를 불러오는 중이야.'}
          </p>
          {dailyCondition ? (
            <>
              <div className="assistant-insight-panel routine-insight-panel">
                <span className="control-label">Condition Summary</span>
                <p className="assistant-detail-text">{dailyCondition.summary}</p>
                <div className="assistant-tags">
                  {dailyCondition.suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="filter-chip"
                      onClick={() => setQuestion(`${item}를 기준으로 오늘 일을 어떻게 조절하면 좋을까?`)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="condition-grid">
                {[
                  ['energy', '에너지', dailyCondition.energy],
                  ['focus', '집중', dailyCondition.focus],
                  ['mood', '기분', dailyCondition.mood],
                  ['stress', '스트레스', dailyCondition.stress],
                  ['sleepQuality', '수면', dailyCondition.sleepQuality],
                ].map(([key, label, score]) => (
                  <article key={key} className="condition-card">
                    <span className="control-label">{label}</span>
                    <strong>{score}/5</strong>
                    <div className="condition-score-buttons">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={`${key}-${value}`}
                          type="button"
                          className={`filter-chip ${Number(score) === value ? 'active' : ''}`}
                          disabled={isUpdatingCondition}
                          onClick={() => handleConditionQuickUpdate(key as 'energy' | 'focus' | 'mood' | 'stress' | 'sleepQuality', value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="assistant-secondary-section">
                <span className="control-label">Quick Notes</span>
                <div className="assistant-tags">
                  {['오전 컨디션 좋음', '잠이 부족함', '스트레스 높음', '산책 후 나아짐'].map((note) => (
                    <button
                      key={note}
                      type="button"
                      className="filter-chip"
                      disabled={isUpdatingCondition}
                      onClick={() => handleConditionQuickUpdate('energy', dailyCondition.energy, note)}
                    >
                      {note}
                    </button>
                  ))}
                  {dailyCondition.note ? <span className="tag-chip">{dailyCondition.note}</span> : null}
                </div>
              </div>
              <div className="assistant-secondary-section">
                <span className="control-label">Recent Readiness</span>
                <div className="assistant-tags">
                  {dailyCondition.recentReadiness.map((item) => (
                    <span key={item.date} className="tag-chip">
                      {item.date.slice(5)} · {item.readinessScore}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : null}
            </>
          ) : (
            <p className="assistant-summary">핵심 수치만 남기고 컨디션 세부 패널은 접어뒀어.</p>
          )}
        </article>

        <article className="assistant-card" id="routine-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily Check</p>
              <h2>오늘 루틴 체크</h2>
            </div>
            <div className="assistant-tags">
              <span className="tag-chip">{dailyRoutine ? `${dailyRoutine.completionRate}% 완료` : '대기 중'}</span>
              <span className="tag-chip">{dailyRoutine ? `${dailyRoutine.streakDays}일 연속` : '0일 연속'}</span>
              <button type="button" className="filter-chip" onClick={() => toggleSection('routine')}>
                {collapsedSections.routine ? '펼치기' : '접기'}
              </button>
            </div>
          </div>
          {!collapsedSections.routine ? (
            <>
          <p className="assistant-summary">
            {dailyRoutine
              ? `비타민, 물, 운동, 산책, 약 복용, 수면 준비 같은 생활 루틴을 오늘 기준으로 빠르게 체크하는 영역이야.`
              : 'Daily Check 데이터를 불러오는 중이야.'}
          </p>
          {dailyRoutine ? (
            <div className="assistant-subgrid routine-intelligence-grid">
              <article className="assistant-radar-card routine-score-card">
                <span className="control-label">Energy Score</span>
                <strong>{dailyRoutine.energyScore}</strong>
                <p>식사, 건강, 움직임 루틴을 묶어서 본 오늘의 기초 에너지 점수.</p>
              </article>
              <article className="assistant-radar-card routine-score-card">
                <span className="control-label">Recovery Score</span>
                <strong>{dailyRoutine.recoveryScore}</strong>
                <p>최근 7일 흐름과 수면 준비 상태를 반영한 회복 점수.</p>
              </article>
              <article className="assistant-radar-card routine-score-card">
                <span className="control-label">Risk Level</span>
                <strong>{getRoutineRiskLabel(dailyRoutine.riskLevel)}</strong>
                <p>오늘 루틴 누락이 컨디션 저하로 이어질 가능성을 압축한 상태값.</p>
              </article>
            </div>
          ) : null}
          {dailyRoutine ? (
            <div className="assistant-subgrid routine-intelligence-grid">
              <div className="assistant-insight-panel routine-focus-panel">
                <span className="control-label">Focus Mode</span>
                <strong>{dailyRoutine.focusMode.title}</strong>
                <p className="assistant-detail-text">{dailyRoutine.focusMode.summary}</p>
                <div className="assistant-tags">
                  <span className="tag-chip">{dailyRoutine.focusMode.durationMinutes}분 블록</span>
                  <span className="tag-chip">{dailyRoutine.focusMode.trigger}</span>
                </div>
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => setQuestion(`${dailyRoutine.focusMode.title} 모드로 오늘 일정을 어떻게 재배치하면 좋을까?`)}
                  >
                    코파일럿에게 묻기
                  </button>
                </div>
              </div>
              <div className="assistant-secondary-section routine-signal-panel">
                <span className="control-label">Body Signals</span>
                <ul className="assistant-list compact-list">
                  {dailyRoutine.signals.map((signal) => (
                    <li key={signal.label}>
                      <strong>{signal.label} · {getRoutineSignalLabel(signal.status)}</strong>
                      <span>{signal.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          {dailyRoutine ? (
            <div className="assistant-insight-panel routine-insight-panel">
              <span className="control-label">Routine Insight</span>
              <p className="assistant-detail-text">{dailyRoutine.insight}</p>
              <div className="assistant-tags">
                {dailyRoutine.suggestedActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="filter-chip"
                    onClick={() => setQuestion(`${action}를 오늘 어떤 순서로 처리하면 좋을까?`)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {dailyRoutine?.reminders.length ? (
            <div className="assistant-secondary-section">
              <span className="control-label">Routine Reminders</span>
              <ul className="assistant-list compact-list">
                {dailyRoutine.reminders.map((reminder) => (
                  <li key={`${reminder.itemKey}-${reminder.reminderTime}`}>
                    <strong>{reminder.reminderTime} · {reminder.label}</strong>
                    <span>{reminder.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {dailyRoutine ? (
            <div className="routine-list">
              {dailyRoutine.items.map((item) => (
                <article
                  key={item.key}
                  className={`routine-item ${item.completed ? 'routine-item-completed' : ''}`}
                >
                  <div>
                    <div className="routine-item-header">
                      <strong>{item.label}</strong>
                      <span className="tag-chip">{item.targetTime}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="assistant-tags history-card-tags">
                      <span className="tag-chip">{item.category}</span>
                      {item.completedAt ? <span className="tag-chip">{formatDateTime(item.completedAt)}</span> : null}
                      {item.note ? <span className="tag-chip">{item.note}</span> : null}
                    </div>
                    {!item.completed ? (
                      <div className="assistant-tags routine-note-presets">
                        {getRoutineNotePresets(item).map((preset) => (
                          <button
                            key={`${item.key}-${preset.label}`}
                            type="button"
                            className="filter-chip"
                            onClick={() => handleRoutineNotePreset(item.key, preset.note, preset.completed)}
                            disabled={updatingRoutineKey === item.key}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="routine-item-actions">
                    <button
                      type="button"
                      className={`filter-chip ${item.completed ? 'active' : ''}`}
                      onClick={() => handleRoutineToggle(item.key, !item.completed)}
                      disabled={updatingRoutineKey === item.key}
                    >
                      {updatingRoutineKey === item.key ? '저장 중...' : item.completed ? '완료됨' : '체크하기'}
                    </button>
                    {!item.completed ? (
                      <button
                        type="button"
                        className="filter-chip"
                        onClick={() => handleCreateActionFromRoutine(item.key, item.label, item.targetTime, item.category)}
                        disabled={routineActionTitles.has(`${item.label} 체크`.toLowerCase()) || isSavingAction === `routine-${item.key}`}
                      >
                        {routineActionTitles.has(`${item.label} 체크`.toLowerCase())
                          ? '이미 액션 있음'
                          : isSavingAction === `routine-${item.key}`
                            ? '저장 중...'
                            : '액션으로 저장'}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          <div className="assistant-subgrid action-summary-grid">
            <div className="action-summary-card">
              <span className="control-label">남은 체크</span>
              <strong>{incompleteRoutineItems.length}</strong>
              <p>오늘 아직 남아 있는 루틴 항목</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">가장 먼저 볼 항목</span>
              <strong>{topIncompleteRoutine?.label ?? '완료'}</strong>
              <p>{topIncompleteRoutine?.description ?? '오늘 루틴을 모두 체크했어.'}</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">주간 완료율</span>
              <strong>{dailyRoutine ? `${dailyRoutine.weeklyCompletionRate}%` : '-'}</strong>
              <p>{dailyRoutine ? `최근 7일 중 ${dailyRoutine.weeklyCompletedDays}일은 3개 이상 완료` : '집계 중'}</p>
            </div>
          </div>
          {dailyRoutine ? (
            <div className="assistant-subgrid">
              <div>
                <span className="control-label">최근 7일 루틴 흐름</span>
                <div className="assistant-tags">
                  {dailyRoutine.recentDays.map((day) => (
                    <span key={day.date} className="tag-chip">
                      {day.date.slice(5)} · {day.completedCount}/{day.totalCount}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="control-label">카테고리별 상태</span>
                <div className="assistant-tags">
                  {dailyRoutine.categoryStats.map((item) => (
                    <span key={item.category} className="tag-chip">
                      {item.category} {item.completedCount}/{item.totalCount}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
            </>
          ) : (
            <p className="assistant-summary">루틴 상세를 접어두고 오늘 모드와 완료율만 빠르게 볼 수 있어.</p>
          )}
        </article>
      </section>
        </>
      ) : null}

      {activeTab === 'dashboard' ? (
        <>
      <section className="assistant-grid">
        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Decision Radar</p>
              <h2>지금 봐야 할 신호</h2>
            </div>
            <span className="tag-chip">실행 우선</span>
          </div>
          <div className="assistant-subgrid">
            <article className="assistant-radar-card">
              <span className="control-label">External Signal</span>
              <strong>{leadHeadline?.title ?? '브리핑 신호 없음'}</strong>
              <p>{leadHeadline?.source ?? '브리핑이 쌓이면 대표 헤드라인이 보여.'}</p>
              {leadHeadline ? (
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => handleCaptureHeadlineAsIdea(leadHeadline)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '저장 중...' : '아이디어로 저장'}
                  </button>
                </div>
              ) : null}
            </article>
            <article className="assistant-radar-card">
              <span className="control-label">Top Risk</span>
              <strong>{topRisk ?? '리스크 없음'}</strong>
              <p>오늘 대응이 필요한 리스크를 바로 질문으로 넘길 수 있어.</p>
              {topRisk ? (
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => handleReuseQuestion(`${topRisk} 이 리스크를 오늘 어떻게 대응하면 좋을까?`)}
                  >
                    대응 질문 만들기
                  </button>
                </div>
              ) : null}
            </article>
            <article className="assistant-radar-card">
              <span className="control-label">Idea Hotspot</span>
              <strong>{topSignalIdea?.title ?? '아이디어 없음'}</strong>
              <p>
                {topSignalIdea
                  ? `${getIdeaSignalLabel(topSignalIdea)} 신호 · 액션 후보 ${topSignalIdea.suggestedActions.length}개`
                  : '아이디어가 쌓이면 지금 검토할 아이디어를 자동으로 올려줘.'}
              </p>
              {topSignalIdea ? (
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => handleFocusIdea(topSignalIdea.id)}
                  >
                    아이디어 보기
                  </button>
                </div>
              ) : null}
            </article>
            <article className="assistant-radar-card">
              <span className="control-label">Execution Pressure</span>
              <strong>{topOpenAction?.title ?? '열린 액션 없음'}</strong>
              <p>
                {topOpenAction
                  ? `${getDueStateLabel(getDueState(topOpenAction))} · ${topOpenAction.priority} 우선순위`
                  : '액션이 생기면 가장 압박이 큰 실행 항목을 여기서 바로 보여줘.'}
              </p>
              {topOpenAction ? (
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => handleFocusAction(topOpenAction.id)}
                  >
                    액션 보기
                  </button>
                </div>
              ) : null}
            </article>
          </div>
        </article>
      </section>

        </>
      ) : null}

      {activeTab === 'records' ? (
        <>
      <section className="assistant-overview-grid">
        <article className="assistant-overview-card assistant-overview-card-primary">
          <span className="control-label">Weekly Snapshot</span>
          <strong>{weeklyReview ? `${weeklyReview.metrics.actionsCompleted}건 완료` : '회고 계산 중'}</strong>
          <p>{weeklyReview?.summary ?? '이번 주 흐름을 요약하는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Question Archive</span>
          <strong>{filteredCopilotHistory.length}건</strong>
          <p>{filteredCopilotHistory[0]?.question ?? '저장된 질문 이력을 불러오는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Briefing Archive</span>
          <strong>{briefingHistory.length}건</strong>
          <p>{briefingHistory[0]?.summary ?? '브리핑 이력을 아직 불러오는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card assistant-overview-card-accent">
          <span className="control-label">Lead Signal</span>
          <strong>{leadHeadline?.source ?? '신호 대기'}</strong>
          <p>{leadHeadline?.title ?? latestHistory?.summary ?? '기록 탭에서 최근 외부 신호와 저장 이력을 같이 본다.'}</p>
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card assistant-history-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Weekly Review</p>
              <h2>주간 회고</h2>
            </div>
            <span className="tag-chip">{weeklyReview ? `${weeklyReview.metrics.actionsCompleted} done` : '대기 중'}</span>
          </div>
          {weeklyReview ? (
            <div className="assistant-copilot-panel">
              <div className="assistant-insight-panel">
                <span className="control-label">Summary</span>
                <p className="assistant-detail-text">{weeklyReview.summary}</p>
              </div>
              <div className="assistant-subgrid assistant-copilot-subgrid">
                <div>
                  <span className="control-label">Metrics</span>
                  <ul className="assistant-list compact-list">
                    <li>질문 {weeklyReview.metrics.questionsAsked}건</li>
                    <li>액션 생성 {weeklyReview.metrics.actionsCreated}건</li>
                    <li>액션 완료 {weeklyReview.metrics.actionsCompleted}건</li>
                    <li>열린 액션 {weeklyReview.metrics.openActions}건</li>
                    <li>아이디어 {weeklyReview.metrics.ideasCaptured}건</li>
                    <li>루틴 체크 {weeklyReview.metrics.routineChecksCompleted}건</li>
                    <li>루틴 완료일 {weeklyReview.metrics.routineCompletionDays}일</li>
                  </ul>
                </div>
                <div>
                  <span className="control-label">Next Focus</span>
                  <ul className="assistant-list compact-list">
                    {weeklyReview.nextFocus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="assistant-subgrid assistant-copilot-subgrid">
                <div>
                  <span className="control-label">Wins</span>
                  <ul className="assistant-list compact-list">
                    {weeklyReview.wins.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="control-label">Risks</span>
                  <ul className="assistant-list compact-list">
                    {weeklyReview.risks.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="assistant-secondary-section">
                <span className="control-label">Review History</span>
                <ul className="assistant-list compact-list">
                  {weeklyReviewHistory.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <strong>{formatDateTime(item.generatedAt)}</strong>
                      <span>{item.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="assistant-summary">주간 회고 데이터를 불러오는 중이야.</p>
          )}
        </article>
      </section>
        </>
      ) : null}

      {activeTab === 'execution' ? (
        <>
      <section className="assistant-overview-grid">
        <article className="assistant-overview-card assistant-overview-card-primary">
          <span className="control-label">Execution Focus</span>
          <strong>{copilot?.topPriority ?? '우선순위 계산 중'}</strong>
          <p>{copilot?.suggestedNextAction ?? '오늘 실행 우선순위를 불러오는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Queue</span>
          <strong>{executionCandidates.length}개</strong>
          <p>{executionCandidates.length > 0 ? executionCandidates[0].title : '실행 후보를 만드는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">Action Load</span>
          <strong>{openActionsCount}건</strong>
          <p>{overdueActionsCount > 0 ? `지연 ${overdueActionsCount}건 포함` : '열린 액션을 정리하면 돼.'}</p>
        </article>
        <article className="assistant-overview-card assistant-overview-card-accent">
          <span className="control-label">Question</span>
          <strong>{copilotAnswer ? intentLabels[copilotAnswer.intent] : '질문 대기'}</strong>
          <p>{copilotAnswer?.answer ?? '막히는 지점이 있으면 아래 질문 카드에서 바로 물어보면 돼.'}</p>
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card assistant-copilot-card" id="copilot-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Copilot</p>
              <h2>오늘의 코파일럿</h2>
            </div>
            <div className="assistant-tags">
              <span className="tag-chip">{copilot ? formatDateTime(copilot.generatedAt) : '대기 중'}</span>
              <button type="button" className="filter-chip" onClick={() => toggleSection('copilot')}>
                {collapsedSections.copilot ? '펼치기' : '접기'}
              </button>
            </div>
          </div>
          {!collapsedSections.copilot ? (
          <div className="assistant-copilot-panel">
            <div className="assistant-copilot-highlight">
              <span className="control-label">Top Priority</span>
              <strong>{copilot?.headline ?? (isLoading ? '코파일럿을 불러오는 중' : '코파일럿 정보 없음')}</strong>
              <p>{copilot?.overview ?? '오늘 흐름을 한 문장으로 정리해주는 영역이야.'}</p>
            </div>
            <div className="assistant-subgrid assistant-copilot-subgrid">
              <div>
                <span className="control-label">우선순위</span>
                <p className="assistant-detail-text">{copilot?.topPriority ?? '우선순위 정보 없음'}</p>
              </div>
              <div>
                <span className="control-label">다음 액션</span>
                <p className="assistant-detail-text">{copilot?.suggestedNextAction ?? '다음 액션 정보 없음'}</p>
              </div>
            </div>
            <div className="assistant-insight-panel routine-insight-panel">
              <span className="control-label">Routine Signal</span>
              <p className="assistant-detail-text">{copilot?.routineSummary ?? '루틴 요약 정보 없음'}</p>
              {copilot?.routineSuggestedAction ? (
                <div className="assistant-tags">
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => setQuestion(`${copilot.routineSuggestedAction}를 오늘 어떤 순서로 처리하면 좋을까?`)}
                  >
                    {copilot.routineSuggestedAction}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="assistant-insight-panel routine-insight-panel">
              <span className="control-label">Condition Signal</span>
              <p className="assistant-detail-text">
                {copilot?.conditionSummary ?? '컨디션 요약 정보 없음'}
              </p>
              <div className="assistant-tags">
                {copilot ? <span className="tag-chip">준비도 {copilot.conditionReadinessScore}</span> : null}
                {copilot?.conditionSuggestedAction ? (
                  <button
                    type="button"
                    className="filter-chip"
                    onClick={() => setQuestion(`${copilot.conditionSuggestedAction}를 기준으로 오늘 작업 강도를 어떻게 조절하면 좋을까?`)}
                  >
                    {copilot.conditionSuggestedAction}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="assistant-subgrid assistant-copilot-subgrid">
              <div>
                <span className="control-label">리스크</span>
                <ul className="assistant-list compact-list">
                  {copilot?.risks.length ? (
                    copilot.risks.map((risk) => <li key={risk}>{risk}</li>)
                  ) : (
                    <li>리스크 정보 없음</li>
                  )}
                </ul>
              </div>
              <div>
                <span className="control-label">추천 아이디어 액션</span>
                <ul className="assistant-list compact-list">
                  {copilot?.recommendedIdeas.length ? (
                    copilot.recommendedIdeas.map((idea) => (
                      <li key={idea.id}>
                        <strong>{idea.title}</strong>
                        <span>{idea.recommendedAction}</span>
                      </li>
                    ))
                  ) : (
                    <li>추천 아이디어 없음</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="assistant-secondary-section">
              <span className="control-label">추천 시간 흐름</span>
              <ul className="assistant-list">
                {copilot?.todayFlow.length ? (
                  copilot.todayFlow.map((item) => (
                    <li key={`${item.time}-${item.focus}`}>
                      <strong>{item.time} · {item.focus}</strong>
                      <span>{item.reason}</span>
                    </li>
                  ))
                ) : (
                  <li>추천 시간 흐름 없음</li>
                )}
              </ul>
            </div>
          </div>
          ) : (
            <p className="assistant-summary">코파일럿 세부 패널을 접어뒀어. Today Mode와 핵심 요약 위주로 볼 수 있다.</p>
          )}
        </article>

        <article className="assistant-card" id="execution-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Morning Briefing</p>
              <h2>오늘 브리핑</h2>
            </div>
          </div>
          <p className="assistant-summary">
            {briefing ? briefing.summary : isLoading ? '브리핑을 불러오는 중' : '브리핑 정보 없음'}
          </p>
          {leadHeadline ? (
            <div className="assistant-news-highlight">
              <span className="control-label">Lead Headline</span>
              <strong>{leadHeadline.title}</strong>
              <p>{leadHeadline.source}</p>
              <div className="assistant-tags">
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => handleCaptureHeadlineAsIdea(leadHeadline)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : '아이디어로 저장'}
                </button>
              </div>
            </div>
          ) : null}
          <div className="assistant-subgrid">
            <div>
              <span className="control-label">Calendar</span>
              <ul className="assistant-list">
                {briefing?.calendar.map((item) => (
                  <li key={`${item.time}-${item.title}`}>
                    <strong>{item.time}</strong>
                    <span>{item.title}</span>
                  </li>
                )) ?? <li>일정 없음</li>}
              </ul>
            </div>
            <div>
              <span className="control-label">Tasks</span>
              <ul className="assistant-list">
                {briefing?.tasks.map((task) => (
                  <li key={`${task.priority}-${task.title}`}>
                    <strong>{task.priority}</strong>
                    <span>{task.title}</span>
                  </li>
                )) ?? <li>할 일 없음</li>}
              </ul>
            </div>
          </div>
          {briefing ? (
            <p className="assistant-focus">
              <strong>Focus:</strong> {briefing.focusSuggestion}
            </p>
          ) : null}
        </article>

        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today Plan</p>
              <h2>오늘 계획</h2>
            </div>
          </div>
          <ul className="assistant-list">
            {plan?.timeBlocks.map((block) => (
              <li key={`${block.start}-${block.activity}`}>
                <strong>
                  {block.start} - {block.end}
                </strong>
                <span>{block.activity}</span>
              </li>
            )) ?? <li>계획 없음</li>}
          </ul>
          <div className="assistant-tags">
            {plan?.topPriorities.map((priority) => (
              <span key={priority} className="tag-chip">
                {priority}
              </span>
            ))}
          </div>
          <div className="assistant-secondary-section">
            <span className="control-label">Reminders</span>
            <ul className="assistant-list compact-list">
              {plan?.reminders.length ? (
                plan.reminders.map((reminder) => <li key={reminder}>{reminder}</li>)
              ) : (
                <li>추가 리마인더 없음</li>
              )}
            </ul>
          </div>
        </article>

        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Execution Queue</p>
              <h2>오늘 실행 후보</h2>
            </div>
            <div className="assistant-tags">
              <span className="tag-chip">후보 {executionCandidates.length}</span>
              <button
                type="button"
                className="filter-chip"
                onClick={handleCreateAllExecutionCandidates}
                disabled={isSavingAction === 'candidate-bulk' || executionCandidates.every((candidate) => actionTitles.has(candidate.title.trim().toLowerCase()))}
              >
                {isSavingAction === 'candidate-bulk' ? '일괄 저장 중...' : '후보 전체 저장'}
              </button>
            </div>
          </div>
          {executionCandidates.length === 0 ? (
            <p className="assistant-summary">브리핑과 계획이 채워지면 실행 후보를 여기서 바로 액션으로 만들 수 있어.</p>
          ) : (
            <div className="briefing-history-list">
              {executionCandidates.map((candidate) => {
                const exists = actionTitles.has(candidate.title.trim().toLowerCase())

                return (
                  <article key={`${candidate.source}-${candidate.title}`} className="briefing-history-item">
                    <div className="project-card-header">
                      <div>
                        <h3>{candidate.title}</h3>
                        <span className="project-category">{candidate.source}</span>
                      </div>
                      <div className="assistant-tags history-card-tags">
                        <span className={`tag-chip action-priority-${candidate.priority.toLowerCase()}`}>{candidate.priority}</span>
                        <span className="tag-chip">{formatDateTime(candidate.dueDate)}</span>
                        {getModeCandidateHint(candidate) ? <span className="tag-chip">{getModeCandidateHint(candidate)}</span> : null}
                      </div>
                    </div>
                    <div className="assistant-tags">
                      <button
                        type="button"
                        className="filter-chip action-save-button"
                        onClick={() => handleCreateActionCandidate(candidate)}
                        disabled={exists || isSavingAction === `candidate-${candidate.title}`}
                      >
                        {exists ? '이미 액션 있음' : isSavingAction === `candidate-${candidate.title}` ? '저장 중...' : '액션으로 저장'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ask Copilot</p>
              <h2>질문하기</h2>
            </div>
          </div>
          <div className="assistant-question-suggestions">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                type="button"
                className="filter-chip"
                onClick={() => setQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <form className="idea-form" onSubmit={handleAskCopilot}>
            <label>
              질문
              <textarea
                rows={4}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="예: 오늘 뭐부터 하면 좋을까? 지금 열어둔 아이디어 중 뭘 먼저 진행할까?"
              />
            </label>
            <button className="primary-button" type="submit" disabled={isAsking}>
              {isAsking ? '답변 생성 중...' : '코파일럿에게 질문'}
            </button>
          </form>
        </article>

        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Copilot Answer</p>
              <h2>답변</h2>
            </div>
            {copilotAnswer ? (
              <div className="assistant-tags">
                <span className="tag-chip">{copilotAnswer.source}</span>
                <span className="tag-chip">{intentLabels[copilotAnswer.intent]}</span>
              </div>
            ) : null}
          </div>
          {copilotAnswer ? (
            <div className="assistant-copilot-panel">
              <div className="assistant-insight-panel">
                <span className="control-label">Question</span>
                <p className="assistant-detail-text">{copilotAnswer.question}</p>
                <span className="control-label">Answer</span>
                <p className="assistant-detail-text">{copilotAnswer.answer}</p>
                {copilotAnswer.fallbackReason ? (
                  <>
                    <button
                      type="button"
                      className="history-toggle-button"
                      onClick={() => setShowFallbackReason((current) => !current)}
                    >
                      {showFallbackReason ? 'Fallback 숨기기' : 'Fallback 보기'}
                    </button>
                    {showFallbackReason ? (
                      <>
                        <span className="control-label">Fallback Reason</span>
                        <p className="assistant-detail-text">{copilotAnswer.fallbackReason}</p>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div className="assistant-subgrid assistant-copilot-subgrid">
                <div>
                  <span className="control-label">Reasoning</span>
                  <ul className="assistant-list compact-list">
                    {copilotAnswer.reasoning.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="control-label">Suggested Actions</span>
                  <ul className="assistant-list compact-list">
                    {copilotAnswer.suggestedActions.map((item, index) => {
                      const plan = copilotAnswer.suggestedActionPlans.find((candidate) => candidate.title === item)

                      return (
                      <li key={`${item}-${index}`}>
                        <div className="suggested-action-block">
                          <span>{item}</span>
                          {plan ? (
                            <div className="assistant-tags suggested-action-meta">
                              <span className={`tag-chip action-priority-${plan.priority.toLowerCase()}`}>{plan.priority}</span>
                              <span className="tag-chip">{plan.dueLabel}</span>
                            </div>
                          ) : null}
                          {plan ? <p className="assistant-detail-text suggested-action-reason">{plan.reason}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="filter-chip action-save-button"
                          onClick={() => handleCreateActionFromSuggestion(item)}
                          disabled={isSavingAction === `${copilotAnswer.generatedAt}-${item}`}
                        >
                          {isSavingAction === `${copilotAnswer.generatedAt}-${item}` ? '저장 중...' : '액션으로 저장'}
                        </button>
                      </li>
                    )})}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="assistant-summary">아직 질문하지 않았어. 코파일럿에게 지금 우선순위나 다음 액션을 물어보면 돼.</p>
          )}
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card assistant-history-card" id="actions-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Action Tracker</p>
              <h2>실행 액션 추적</h2>
            </div>
            <div className="assistant-tags">
              <span className="tag-chip">OPEN {openActionsCount}</span>
              <span className={`tag-chip${overdueActionsCount > 0 ? ' tag-chip-alert' : ''}`}>지연 {overdueActionsCount}</span>
              <button type="button" className="filter-chip" onClick={() => toggleSection('actions')}>
                {collapsedSections.actions ? '펼치기' : '접기'}
              </button>
              <button type="button" className={`filter-chip${actionFilter === 'ALL' ? ' active' : ''}`} onClick={() => setActionFilter('ALL')}>ALL</button>
              <button type="button" className={`filter-chip${actionFilter === 'OPEN' ? ' active' : ''}`} onClick={() => setActionFilter('OPEN')}>OPEN</button>
              <button type="button" className={`filter-chip${actionFilter === 'DONE' ? ' active' : ''}`} onClick={() => setActionFilter('DONE')}>DONE</button>
            </div>
          </div>
          {!collapsedSections.actions ? (
            <>
          {actionSummary ? (
            <div className="assistant-subgrid action-summary-grid">
              <div className="action-summary-card">
                <span className="control-label">완료율</span>
                <strong>{actionSummary.completionRate}%</strong>
                <p>전체 액션 {actionSummary.totalCount}건 기준</p>
              </div>
              <div className="action-summary-card">
                <span className="control-label">긴급 처리</span>
                <strong>{actionSummary.overdueCount}</strong>
                <p>지금 바로 봐야 하는 지연 액션</p>
              </div>
              <div className="action-summary-card">
                <span className="control-label">24시간 내</span>
                <strong>{actionSummary.dueSoonCount}</strong>
                <p>오늘 안에 정리할 가능성이 높은 액션</p>
              </div>
              <div className="action-summary-card">
                <span className="control-label">HIGH OPEN</span>
                <strong>{actionSummary.highPriorityOpenCount}</strong>
                <p>고우선으로 남아 있는 작업</p>
              </div>
            </div>
          ) : null}
          <div className="idea-filter-group">
            <button type="button" className={`filter-chip${actionFocusFilter === 'ALL' ? ' active' : ''}`} onClick={() => setActionFocusFilter('ALL')}>전체 보기</button>
            <button type="button" className={`filter-chip${actionFocusFilter === 'OVERDUE' ? ' active' : ''}`} onClick={() => setActionFocusFilter('OVERDUE')}>지연만</button>
            <button type="button" className={`filter-chip${actionFocusFilter === 'DUE_SOON' ? ' active' : ''}`} onClick={() => setActionFocusFilter('DUE_SOON')}>24시간 내</button>
            <button type="button" className={`filter-chip${actionFocusFilter === 'HIGH_PRIORITY' ? ' active' : ''}`} onClick={() => setActionFocusFilter('HIGH_PRIORITY')}>HIGH 우선</button>
          </div>
          {sortedActions.length === 0 ? (
            <p className="assistant-summary">아직 저장된 액션이 없어. 답변의 Suggested Actions에서 바로 저장해봐.</p>
          ) : (
            <div className="briefing-history-list">
              {sortedActions.map((action) => {
                const dueState = getDueState(action)
                const dueStateLabel = getDueStateLabel(dueState)

                return (
                <article key={action.id} className={`briefing-history-item action-card ${dueState !== 'NONE' ? `action-card-${dueState.toLowerCase()}` : ''}`}>
                  <div className="project-card-header">
                    <div>
                      <h3>{action.title}</h3>
                      <span className="project-category">{formatDateTime(action.createdAt)}</span>
                    </div>
                    <div className="assistant-tags">
                      <span className={`tag-chip ${action.status === 'DONE' ? 'tag-chip-muted' : ''}`}>{action.status}</span>
                      <span className={`tag-chip action-priority-chip action-priority-${action.priority.toLowerCase()}`}>{action.priority}</span>
                      {dueState !== 'NONE' ? <span className={`tag-chip action-due-chip action-due-${dueState.toLowerCase()}`}>{dueStateLabel}</span> : null}
                    </div>
                  </div>
                  <p className="project-summary">질문: {action.sourceQuestion}</p>
                  <div className="action-meta-row">
                    <p className="assistant-detail-text">
                      마감일: {action.dueDate ? formatDateTime(action.dueDate) : '미설정'}
                    </p>
                    {action.status === 'OPEN' ? (
                      <p className="assistant-detail-text action-sort-hint">
                        {dueState === 'OVERDUE'
                          ? '우선 처리 필요'
                          : dueState === 'DUE_SOON'
                            ? '24시간 내 처리 권장'
                            : getModeActionHint(action)
                              ? getModeActionHint(action)
                              : action.priority === 'HIGH'
                              ? '우선순위 높음'
                              : '일정 여유 있음'}
                      </p>
                    ) : null}
                  </div>
                  {editingActionId === action.id ? (
                    <div className="idea-edit-form">
                      <label>
                        우선순위
                        <select
                          value={editingActionPriority}
                          onChange={(event) => setEditingActionPriority(event.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                        >
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      </label>
                      <label>
                        마감일
                        <input
                          type="datetime-local"
                          value={editingActionDueDate}
                          onChange={(event) => setEditingActionDueDate(event.target.value)}
                        />
                      </label>
                      <div className="idea-card-actions">
                        <button type="button" className="filter-chip" onClick={() => applyActionDuePreset('TODAY')}>오늘 18시</button>
                        <button type="button" className="filter-chip" onClick={() => applyActionDuePreset('TOMORROW_MORNING')}>내일 09시</button>
                        <button type="button" className="filter-chip" onClick={() => applyActionDuePreset('THIS_FRIDAY')}>이번 주 금요일</button>
                      </div>
                    </div>
                  ) : null}
                  <div className="assistant-tags">
                    <button
                      type="button"
                      className="history-toggle-button"
                      onClick={() => editingActionId === action.id ? resetActionEdit() : startActionEdit(action)}
                    >
                      {editingActionId === action.id ? '편집 취소' : '우선순위/마감일 편집'}
                    </button>
                    {editingActionId === action.id ? (
                      <button
                        type="button"
                        className="history-toggle-button"
                        onClick={() => handleActionMetaSave(action.id)}
                        disabled={updatingActionId === action.id}
                      >
                        {updatingActionId === action.id ? '저장 중...' : '메타 저장'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="history-toggle-button"
                      onClick={() => handleActionStatusChange(action.id, action.status === 'OPEN' ? 'DONE' : 'OPEN')}
                      disabled={updatingActionId === action.id}
                    >
                      {updatingActionId === action.id
                        ? '변경 중...'
                        : action.status === 'OPEN'
                          ? 'DONE 처리'
                          : 'OPEN으로 되돌리기'}
                    </button>
                  </div>
                </article>
              )})}
            </div>
          )}
            </>
          ) : (
            <p className="assistant-summary">액션 보드를 접어두고 전체 카운트와 지연 개수만 빠르게 볼 수 있어.</p>
          )}
        </article>
      </section>

        </>
      ) : null}

      {activeTab === 'records' ? (
        <>
      <section className="assistant-grid">
        <article className="assistant-card assistant-history-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Copilot History</p>
              <h2>최근 질문 이력</h2>
            </div>
          </div>
          <div className="idea-filter-group">
            <button type="button" className={`filter-chip${historyIntentFilter === 'ALL' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('ALL')}>전체</button>
            <button type="button" className={`filter-chip${historyIntentFilter === 'PRIORITY' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('PRIORITY')}>우선순위</button>
            <button type="button" className={`filter-chip${historyIntentFilter === 'TIME' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('TIME')}>시간</button>
            <button type="button" className={`filter-chip${historyIntentFilter === 'IDEA' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('IDEA')}>아이디어</button>
            <button type="button" className={`filter-chip${historyIntentFilter === 'RISK' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('RISK')}>리스크</button>
            <button type="button" className={`filter-chip${historyIntentFilter === 'SUMMARY' ? ' active' : ''}`} onClick={() => setHistoryIntentFilter('SUMMARY')}>요약</button>
          </div>
          <div className="idea-form assistant-inline-search">
            <label>
              질문 검색
              <input
                type="text"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="질문 또는 답변 내용 검색"
              />
            </label>
          </div>
          <div className="briefing-history-list">
            {filteredCopilotHistory.length === 0 ? (
              <p className="assistant-summary">아직 저장된 질문 이력이 없어.</p>
            ) : (
              filteredCopilotHistory.map((item) => (
                <article key={item.id} className="briefing-history-item">
                  <div className="project-card-header">
                    <div>
                      <h3>{item.question}</h3>
                      <span className="project-category">{formatDateTime(item.generatedAt)}</span>
                    </div>
                    <div className="assistant-tags history-card-tags">
                      <span className="tag-chip">{item.source}</span>
                      <span className="tag-chip">{intentLabels[item.intent]}</span>
                    </div>
                  </div>
                  <p className="project-summary">{item.answer}</p>
                  <button
                    className="history-toggle-button"
                    type="button"
                    onClick={() => handleReuseQuestion(item.question)}
                  >
                    다시 질문하기
                  </button>
                  <div className="history-detail-grid">
                    <div>
                      <span className="control-label">Reasoning</span>
                      <ul className="assistant-list compact-list">
                        {item.reasoning.map((reason) => (
                          <li key={`${item.id}-${reason}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="control-label">Suggested Actions</span>
                      <ul className="assistant-list compact-list">
                        {item.suggestedActions.map((action) => (
                          <li key={`${item.id}-${action}`}>
                            <div className="suggested-action-block">
                              <span>{action}</span>
                              <p className="assistant-detail-text suggested-action-reason">
                                {item.intent === 'PRIORITY' || item.intent === 'RISK'
                                  ? '우선순위 판단이나 리스크 대응과 연결된 액션이라 바로 등록해두는 편이 좋다.'
                                  : item.intent === 'TIME'
                                    ? '시간 블록과 연결된 답변이라 오늘 일정 안으로 넣기 좋다.'
                                    : '질문 이력에서 바로 실행으로 연결할 수 있는 액션이다.'}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="filter-chip action-save-button"
                              onClick={() => handleCreateActionFromHistory(item, action)}
                              disabled={
                                actionTitles.has(action.trim().toLowerCase()) ||
                                isSavingAction === `history-${item.id}-${action}`
                              }
                            >
                              {actionTitles.has(action.trim().toLowerCase())
                                ? '이미 액션 있음'
                                : isSavingAction === `history-${item.id}-${action}`
                                  ? '저장 중...'
                                  : '액션으로 저장'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card" id="ideas-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Signals</p>
              <h2>헤드라인 및 빠른 판단</h2>
            </div>
          </div>
          <div className="assistant-subgrid">
            <div>
              <span className="control-label">Headlines</span>
              <ul className="assistant-list">
                {briefing?.headlines.length ? (
                  briefing.headlines.map((headline) => (
                    <li key={`${headline.source}-${headline.title}`}>
                      <strong>{headline.source}</strong>
                      <span>{headline.title}</span>
                    </li>
                  ))
                ) : (
                  <li>헤드라인 없음</li>
                )}
              </ul>
            </div>
            <div>
              <span className="control-label">Quick Summary</span>
              <div className="assistant-insight-panel">
                <p>{latestHistory?.summary ?? briefing?.summary ?? '아직 요약 정보가 없어.'}</p>
                <div className="assistant-tags">
                  {(plan?.topPriorities ?? []).slice(0, 3).map((priority) => (
                    <span key={priority} className="tag-chip">
                      {priority}
                    </span>
                  ))}
                </div>
                {leadHeadline ? (
                  <div className="assistant-secondary-section">
                    <span className="control-label">Lead Signal</span>
                    <p className="assistant-detail-text">
                      {leadHeadline.title} <strong>· {leadHeadline.source}</strong>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="assistant-grid">
        <article className="assistant-card assistant-history-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Briefing History</p>
              <h2>최근 브리핑 이력</h2>
            </div>
          </div>
          <div className="briefing-history-list">
            {briefingHistory.length === 0 ? (
              <p className="assistant-summary">아직 저장된 브리핑 이력이 없어.</p>
            ) : (
              briefingHistory.map((history) => (
                <article key={history.id} className="briefing-history-item">
                  <div className="project-card-header">
                    <div>
                      <h3>{formatDateTime(history.generatedAt)}</h3>
                      <span className="project-category">
                        {history.weather.location} · {history.weather.condition} · {history.weather.temperatureCelsius}°C
                      </span>
                    </div>
                    <span className="tag-chip">Saved</span>
                  </div>
                  <p className="project-summary">{history.summary}</p>
                  <ul className="assistant-list compact-list">
                    {history.tasks.slice(0, 2).map((task) => (
                      <li key={`${history.id}-${task.priority}-${task.title}`}>
                        <strong>{task.priority}</strong> {task.title}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="history-toggle-button"
                    type="button"
                    onClick={() => setExpandedHistoryId((current) => (current === history.id ? null : history.id))}
                  >
                    {expandedHistoryId === history.id ? '간단히 보기' : '상세 보기'}
                  </button>
                  {expandedHistoryId === history.id ? (
                    <div className="history-detail-grid">
                      <div>
                        <span className="control-label">Calendar</span>
                        <ul className="assistant-list compact-list">
                          {history.calendar.map((item) => (
                            <li key={`${history.id}-${item.time}-${item.title}`}>
                              <strong>{item.time}</strong> {item.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="control-label">Headlines</span>
                        <ul className="assistant-list compact-list">
                          {history.headlines.map((headline) => (
                            <li key={`${history.id}-${headline.source}-${headline.title}`}>
                              <strong>{headline.source}</strong> {headline.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>
      </section>

        </>
      ) : null}

      {activeTab === 'ideas' ? (
        <>
      <section className="assistant-overview-grid">
        <article className="assistant-overview-card assistant-overview-card-primary">
          <span className="control-label">Idea Volume</span>
          <strong>{ideas.length}건</strong>
          <p>{topSignalIdea?.title ?? '아이디어 저장소를 계속 쌓아가는 중이야.'}</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">핵심 신호</span>
          <strong>{highSignalIdeasCount}건</strong>
          <p>바로 제품이나 액션으로 연결할 가치가 높은 아이디어 수.</p>
        </article>
        <article className="assistant-overview-card">
          <span className="control-label">진행 중</span>
          <strong>{inProgressIdeasCount}건</strong>
          <p>{sortedIdeas.find((idea) => idea.status === 'IN_PROGRESS')?.title ?? '현재 진행 중인 아이디어가 없으면 OPEN부터 보면 돼.'}</p>
        </article>
        <article className="assistant-overview-card assistant-overview-card-accent">
          <span className="control-label">추천 전환</span>
          <strong>{topSignalIdea?.suggestedActions[0] ?? '액션 후보 대기'}</strong>
          <p>{topSignalIdea ? '가장 강한 신호의 아이디어를 바로 액션으로 바꿀 수 있어.' : '아이디어를 더 쌓으면 자동 추천 액션이 같이 뜬다.'}</p>
        </article>
      </section>

      <section className="assistant-grid assistant-bottom-grid">
        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Idea Capture</p>
              <h2>아이디어 저장</h2>
            </div>
          </div>
          <form className="idea-form" onSubmit={handleSubmit}>
            <label>
              제목
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 아침 브리핑 자동화" />
            </label>
            <label>
              내용
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={7}
                placeholder="정리하고 싶은 생각이나 아이디어를 자유롭게 적어줘"
              />
            </label>
            <label>
              태그
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="assistant, automation" />
            </label>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '아이디어 저장'}
            </button>
          </form>
        </article>

        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Idea Archive</p>
              <h2>저장된 아이디어</h2>
            </div>
            <div className="idea-filter-group">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-chip ${ideaFilter === status ? 'active' : ''}`}
                  onClick={() => setIdeaFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="assistant-subgrid action-summary-grid">
            <div className="action-summary-card">
              <span className="control-label">OPEN</span>
              <strong>{openIdeasCount}</strong>
              <p>바로 검토 가능한 아이디어</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">IN PROGRESS</span>
              <strong>{inProgressIdeasCount}</strong>
              <p>현재 진행 중인 아이디어</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">DONE</span>
              <strong>{doneIdeasCount}</strong>
              <p>완료 처리된 아이디어</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">검색 결과</span>
              <strong>{searchedIdeas.length}</strong>
              <p>현재 필터 기준으로 보이는 아이디어</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">핵심 신호</span>
              <strong>{highSignalIdeasCount}</strong>
              <p>바로 제품/액션으로 연결할 가치가 높은 아이디어</p>
            </div>
            <div className="action-summary-card">
              <span className="control-label">유망 신호</span>
              <strong>{mediumSignalIdeasCount}</strong>
              <p>조금 더 다듬으면 실행 후보가 될 아이디어</p>
            </div>
          </div>
          <div className="idea-form assistant-inline-search">
            <label>
              아이디어 검색
              <input
                type="text"
                value={ideaSearch}
                onChange={(event) => setIdeaSearch(event.target.value)}
                placeholder="제목, 요약, 태그 검색"
              />
            </label>
          </div>
          <div className="idea-archive">
            {searchedIdeas.length === 0 ? (
              <p className="assistant-summary">아직 저장된 아이디어가 없어.</p>
            ) : (
              sortedIdeas.map((idea) => (
                <article key={idea.id} className="idea-card">
                  <div className="project-card-header">
                    <div>
                      <h3>{idea.title}</h3>
                      <span className="project-category">{formatDateTime(idea.updatedAt)}</span>
                    </div>
                    <div className="assistant-tags history-card-tags">
                      <span className={`project-status ${idea.status.toLowerCase()}`}>{idea.status}</span>
                      <span
                        className={`tag-chip idea-signal-${
                          getIdeaSignalLabel(idea) === '핵심'
                            ? 'high'
                            : getIdeaSignalLabel(idea) === '유망'
                              ? 'medium'
                              : 'low'
                        }`}
                      >
                        {getIdeaSignalLabel(idea)}
                      </span>
                    </div>
                  </div>
                  <p className="project-summary">{idea.summary}</p>
                  <div className="tag-list">
                    {idea.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ul className="assistant-list compact-list">
                    {idea.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="idea-card-actions">
                    {(['OPEN', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`filter-chip ${idea.status === status ? 'active' : ''}`}
                        disabled={updatingIdeaId === idea.id}
                        onClick={() => handleIdeaStatusChange(idea.id, status)}
                      >
                        {updatingIdeaId === idea.id && idea.status !== status ? '변경 중...' : status}
                      </button>
                    ))}
                    <button
                      className="history-toggle-button"
                      type="button"
                      onClick={() => startIdeaEdit(idea)}
                    >
                      수정
                    </button>
                    <button
                      className="history-toggle-button"
                      type="button"
                      onClick={() => setExpandedIdeaId((current) => (current === idea.id ? null : idea.id))}
                    >
                      {expandedIdeaId === idea.id ? '간단히 보기' : '상세 보기'}
                    </button>
                  </div>
                  {expandedIdeaId === idea.id ? (
                    <div className="history-detail-grid">
                      <div>
                        <span className="control-label">Raw Text</span>
                        {editingIdeaId === idea.id ? (
                          <div className="idea-edit-form">
                            <label>
                              제목
                              <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                            </label>
                            <label>
                              내용
                              <textarea
                                rows={6}
                                value={editingRawText}
                                onChange={(event) => setEditingRawText(event.target.value)}
                              />
                            </label>
                            <label>
                              태그
                              <input value={editingTags} onChange={(event) => setEditingTags(event.target.value)} />
                            </label>
                            <div className="idea-card-actions">
                              <button
                                className="primary-button"
                                type="button"
                                disabled={updatingIdeaId === idea.id}
                                onClick={() => handleIdeaEditSave(idea.id)}
                              >
                                {updatingIdeaId === idea.id ? '저장 중...' : '저장'}
                              </button>
                              <button className="secondary-link action-button" type="button" onClick={resetIdeaEdit}>
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="assistant-detail-text">{idea.rawText}</p>
                        )}
                      </div>
                      <div>
                        <span className="control-label">Suggested Actions</span>
                        <ul className="assistant-list compact-list">
                          {idea.suggestedActions.map((action) => {
                            const exists = actionTitles.has(action.trim().toLowerCase())

                            return (
                            <li key={`${idea.id}-${action}`}>
                              <div className="suggested-action-block">
                                <span>{action}</span>
                                <p className="assistant-detail-text suggested-action-reason">
                                  {idea.status === 'IN_PROGRESS' ? '진행 중 아이디어라 오늘 바로 액션으로 전환하는 게 좋다.' : '아이디어를 실제 작업으로 바꾸는 첫 단계로 쓰기 좋다.'}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="filter-chip action-save-button"
                                onClick={() => handleCreateActionFromIdea(idea, action)}
                                disabled={exists || isSavingAction === `idea-${idea.id}-${action}`}
                              >
                                {exists ? '이미 액션 있음' : isSavingAction === `idea-${idea.id}-${action}` ? '저장 중...' : '액션으로 저장'}
                              </button>
                            </li>
                          )})}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>
      </section>
        </>
      ) : null}
    </main>
  )
}
