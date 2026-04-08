export type ApiResponse<T> = {
  success: boolean
  data: T | null
  message: string | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginUser = {
  email: string
  name: string
}

export type LoginData = {
  token: string
  user: LoginUser
}

export type Project = {
  id: string
  name: string
  status: string
  category: string
  summary: string
  liveUrl: string | null
  repositoryUrl: string | null
  docsUrl: string | null
  tags: string[]
}

export type Profile = {
  name: string
  title: string
  summary: string
  strengths: string[]
  links: Record<string, string>
}

export type AssistantBriefing = {
  id?: string
  generatedAt: string
  summary: string
  weather: {
    location: string
    condition: string
    temperatureCelsius: number
  }
  calendar: Array<{
    time: string
    title: string
  }>
  headlines: Array<{
    source: string
    title: string
  }>
  tasks: Array<{
    priority: string
    title: string
  }>
  focusSuggestion: string
}

export type AssistantBriefingHistory = {
  id: string
  generatedAt: string
  summary: string
  weather: {
    location: string
    condition: string
    temperatureCelsius: number
  }
  calendar: Array<{
    time: string
    title: string
  }>
  headlines: Array<{
    source: string
    title: string
  }>
  tasks: Array<{
    priority: string
    title: string
  }>
  focusSuggestion: string
}

export type AssistantPlan = {
  date: string
  topPriorities: string[]
  timeBlocks: Array<{
    start: string
    end: string
    activity: string
  }>
  reminders: string[]
}

export type AssistantIdea = {
  id: string
  title: string
  rawText: string
  summary: string
  keyPoints: string[]
  suggestedActions: string[]
  tags: string[]
  status: string
  createdAt: string
  updatedAt: string
}

export type AssistantCopilot = {
  generatedAt: string
  headline: string
  overview: string
  topPriority: string
  suggestedNextAction: string
  routineSummary: string
  routineSuggestedAction: string
  risks: string[]
  recommendedIdeas: Array<{
    id: string
    title: string
    status: string
    recommendedAction: string
  }>
  todayFlow: Array<{
    time: string
    focus: string
    reason: string
  }>
}

export type AssistantCopilotAskResponse = {
  question: string
  answer: string
  intent: 'PRIORITY' | 'TIME' | 'IDEA' | 'RISK' | 'SUMMARY'
  reasoning: string[]
  suggestedActions: string[]
  suggestedActionPlans: Array<{
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate: string | null
    dueLabel: string
    reason: string
  }>
  source: string
  fallbackReason?: string | null
  generatedAt: string
}

export type AssistantCopilotHistory = {
  id: string
  question: string
  answer: string
  intent: 'PRIORITY' | 'TIME' | 'IDEA' | 'RISK' | 'SUMMARY'
  reasoning: string[]
  suggestedActions: string[]
  source: string
  generatedAt: string
}

export type AssistantAction = {
  id: string
  title: string
  sourceQuestion: string
  status: 'OPEN' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type AssistantActionSummary = {
  totalCount: number
  openCount: number
  doneCount: number
  overdueCount: number
  dueSoonCount: number
  highPriorityOpenCount: number
  completionRate: number
}

export type AssistantDailyRoutine = {
  date: string
  completionRate: number
  completedCount: number
  totalCount: number
  streakDays: number
  weeklyCompletionRate: number
  weeklyCompletedDays: number
  energyScore: number
  recoveryScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  insight: string
  suggestedActions: string[]
  signals: Array<{
    label: string
    status: 'GOOD' | 'WATCH' | 'ALERT' | 'READY'
    detail: string
  }>
  focusMode: {
    title: string
    durationMinutes: number
    summary: string
    trigger: string
  }
  reminders: Array<{
    itemKey: string
    label: string
    reminderTime: string
    reason: string
  }>
  recentDays: Array<{
    date: string
    completedCount: number
    totalCount: number
    completionRate: number
  }>
  categoryStats: Array<{
    category: string
    completedCount: number
    totalCount: number
  }>
  items: AssistantDailyRoutineItem[]
}

export type AssistantDailyRoutineItem = {
  key: string
  label: string
  description: string
  category: string
  targetTime: string
  completed: boolean
  completedAt: string | null
  note: string | null
}

export type AssistantDailyCondition = {
  date: string
  energy: number
  focus: number
  mood: number
  stress: number
  sleepQuality: number
  note: string | null
  readinessScore: number
  trend: 'UP' | 'STABLE' | 'DOWN'
  summary: string
  suggestions: string[]
  recentReadiness: Array<{
    date: string
    readinessScore: number
  }>
}

export type AssistantWeeklyReview = {
  periodStart: string
  periodEnd: string
  summary: string
  metrics: {
    questionsAsked: number
    actionsCreated: number
    actionsCompleted: number
    openActions: number
    ideasCaptured: number
    routineChecksCompleted: number
    routineCompletionDays: number
  }
  wins: string[]
  risks: string[]
  nextFocus: string[]
}

export type AssistantWeeklyReviewSnapshot = AssistantWeeklyReview & {
  id: string
  generatedAt: string
}
