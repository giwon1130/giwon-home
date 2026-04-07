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
  reasoning: string[]
  suggestedActions: string[]
  source: string
  generatedAt: string
}
