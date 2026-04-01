import { assistantApiFetch } from './client'
import type { ApiResponse, AssistantBriefing, AssistantIdea, AssistantPlan } from '../types/api'

export function getTodayBriefingApi() {
  return assistantApiFetch<ApiResponse<AssistantBriefing>>('/api/v1/briefings/today')
}

export function getTodayPlanApi() {
  return assistantApiFetch<ApiResponse<AssistantPlan>>('/api/v1/plans/today')
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
