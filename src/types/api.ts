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
