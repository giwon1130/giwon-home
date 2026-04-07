import { assistantApiFetch } from './client'
import type {
  ApiResponse,
  AssistantBriefing,
  AssistantBriefingHistory,
  AssistantCopilot,
  AssistantCopilotAskResponse,
  AssistantIdea,
  AssistantPlan,
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

export function askCopilotApi(question: string) {
  return assistantApiFetch<ApiResponse<AssistantCopilotAskResponse>>('/api/v1/copilot/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
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
