import { assistantApiFetch } from './client'
import type {
  ApiResponse,
  AssistantBriefing,
  AssistantBriefingHistory,
  AssistantCopilot,
  AssistantCopilotAskResponse,
  AssistantCopilotHistory,
  AssistantAction,
  AssistantActionSummary,
  AssistantDailyCondition,
  AssistantDailyRoutine,
  AssistantIdea,
  AssistantPlan,
  AssistantWeeklyReview,
  AssistantWeeklyReviewSnapshot,
} from '../types/api'

export function getTodayBriefingApi() {
  return assistantApiFetch<ApiResponse<AssistantBriefing>>('/api/v1/briefings/today')
}

export function getBriefingHistoryApi() {
  return assistantApiFetch<ApiResponse<AssistantBriefingHistory[]>>('/api/v1/briefings/history')
}

export function getTodayPlanApi() {
  return assistantApiFetch<ApiResponse<AssistantPlan>>('/api/v1/plans/today')
}

export function getTodayCopilotApi() {
  return assistantApiFetch<ApiResponse<AssistantCopilot>>('/api/v1/copilot/today')
}

export function getCopilotHistoryApi() {
  return assistantApiFetch<ApiResponse<AssistantCopilotHistory[]>>('/api/v1/copilot/history')
}

export function askCopilotApi(question: string) {
  return assistantApiFetch<ApiResponse<AssistantCopilotAskResponse>>('/api/v1/copilot/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function getActionsApi(status?: 'OPEN' | 'DONE') {
  const query = status ? `?status=${status}` : ''
  return assistantApiFetch<ApiResponse<AssistantAction[]>>(`/api/v1/actions${query}`)
}

export function getActionSummaryApi() {
  return assistantApiFetch<ApiResponse<AssistantActionSummary>>('/api/v1/actions/summary')
}

export function getDailyRoutineApi(date?: string) {
  const query = date ? `?date=${date}` : ''
  return assistantApiFetch<ApiResponse<AssistantDailyRoutine>>(`/api/v1/routines/daily${query}`)
}

export function getDailyConditionApi(date?: string) {
  const query = date ? `?date=${date}` : ''
  return assistantApiFetch<ApiResponse<AssistantDailyCondition>>(`/api/v1/checkins/condition${query}`)
}

export function updateDailyConditionApi(
  payload: { energy: number; focus: number; mood: number; stress: number; sleepQuality: number; note?: string | null },
  date?: string,
) {
  const query = date ? `?date=${date}` : ''
  return assistantApiFetch<ApiResponse<AssistantDailyCondition>>(`/api/v1/checkins/condition${query}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateDailyRoutineApi(
  itemKey: string,
  payload: { completed: boolean; note?: string | null },
  date?: string,
) {
  const query = date ? `?date=${date}` : ''
  return assistantApiFetch<ApiResponse<AssistantDailyRoutine>>(`/api/v1/routines/daily/${itemKey}${query}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getWeeklyReviewApi() {
  return assistantApiFetch<ApiResponse<AssistantWeeklyReview>>('/api/v1/reviews/weekly')
}

export function getWeeklyReviewHistoryApi() {
  return assistantApiFetch<ApiResponse<AssistantWeeklyReviewSnapshot[]>>('/api/v1/reviews/weekly/history')
}

export function createActionApi(payload: { title: string; sourceQuestion: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate?: string | null }) {
  return assistantApiFetch<ApiResponse<AssistantAction>>('/api/v1/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateActionStatusApi(actionId: string, status: 'OPEN' | 'DONE') {
  return assistantApiFetch<ApiResponse<AssistantAction>>(`/api/v1/actions/${actionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateActionApi(
  actionId: string,
  payload: { title?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate?: string | null },
) {
  return assistantApiFetch<ApiResponse<AssistantAction>>(`/api/v1/actions/${actionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getIdeasApi() {
  return assistantApiFetch<ApiResponse<AssistantIdea[]>>('/api/v1/ideas')
}

export function createIdeaApi(payload: { title: string; rawText: string; tags: string[] }) {
  return assistantApiFetch<ApiResponse<AssistantIdea>>('/api/v1/ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateIdeaApi(
  ideaId: string,
  payload: { title?: string; rawText?: string; tags?: string[]; status?: string },
) {
  return assistantApiFetch<ApiResponse<AssistantIdea>>(`/api/v1/ideas/${ideaId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
