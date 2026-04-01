import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createIdeaApi, getIdeasApi, getTodayBriefingApi, getTodayPlanApi } from '../api/assistantApi'
import type { AssistantBriefing, AssistantIdea, AssistantPlan } from '../types/api'

export function AssistantPage() {
  const [briefing, setBriefing] = useState<AssistantBriefing | null>(null)
  const [plan, setPlan] = useState<AssistantPlan | null>(null)
  const [ideas, setIdeas] = useState<AssistantIdea[]>([])
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [tags, setTags] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAssistantData = () => {
    Promise.all([getTodayBriefingApi(), getTodayPlanApi(), getIdeasApi()])
      .then(([briefingResponse, planResponse, ideasResponse]) => {
        if (!briefingResponse.success || !briefingResponse.data) {
          throw new Error('briefing')
        }

        if (!planResponse.success || !planResponse.data) {
          throw new Error('plan')
        }

        if (!ideasResponse.success || !ideasResponse.data) {
          throw new Error('ideas')
        }

        setBriefing(briefingResponse.data)
        setPlan(planResponse.data)
        setIdeas(ideasResponse.data)
        setErrorMessage('')
      })
      .catch(() => {
        setErrorMessage('AI 비서 데이터를 불러오지 못했습니다. giwon-assistant-api 실행 상태를 확인해줘.')
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

  return (
    <main className="page-shell">
      <header className="assistant-hero">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h1>개인 비서 대시보드</h1>
          <p className="hero-summary">
            아침 브리핑, 오늘 계획, 아이디어 저장을 한 화면에서 다루는 개인용 보조 공간
          </p>
          <div className="hero-actions">
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
        </div>
      </header>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <section className="assistant-grid">
        <article className="assistant-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Morning Briefing</p>
              <h2>오늘 브리핑</h2>
            </div>
          </div>
          <p className="assistant-summary">{briefing?.summary ?? '브리핑을 불러오는 중'}</p>
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
          </div>
          <div className="idea-archive">
            {ideas.length === 0 ? (
              <p className="assistant-summary">아직 저장된 아이디어가 없어.</p>
            ) : (
              ideas.map((idea) => (
                <article key={idea.id} className="idea-card">
                  <div className="project-card-header">
                    <div>
                      <h3>{idea.title}</h3>
                    </div>
                    <span className={`project-status ${idea.status.toLowerCase()}`}>{idea.status}</span>
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
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
