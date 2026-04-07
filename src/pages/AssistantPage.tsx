import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { askCopilotApi, createIdeaApi, getBriefingHistoryApi, getIdeasApi, getTodayBriefingApi, getTodayCopilotApi, getTodayPlanApi, updateIdeaApi } from '../api/assistantApi'
import type { AssistantBriefing, AssistantBriefingHistory, AssistantCopilot, AssistantCopilotAskResponse, AssistantIdea, AssistantPlan } from '../types/api'

export function AssistantPage() {
  const suggestedQuestions = [
    '오늘 뭐부터 하면 좋을까?',
    '지금 열어둔 아이디어 중 뭘 먼저 진행할까?',
    '오늘 일정 기준으로 언제 집중 작업하는 게 좋을까?',
  ] as const

  const [briefing, setBriefing] = useState<AssistantBriefing | null>(null)
  const [briefingHistory, setBriefingHistory] = useState<AssistantBriefingHistory[]>([])
  const [copilot, setCopilot] = useState<AssistantCopilot | null>(null)
  const [plan, setPlan] = useState<AssistantPlan | null>(null)
  const [ideas, setIdeas] = useState<AssistantIdea[]>([])
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
  const [updatingIdeaId, setUpdatingIdeaId] = useState<string | null>(null)

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const loadAssistantData = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    Promise.all([getTodayBriefingApi(), getBriefingHistoryApi(), getTodayCopilotApi(), getTodayPlanApi(), getIdeasApi()])
      .then(([briefingResponse, historyResponse, copilotResponse, planResponse, ideasResponse]) => {
        if (!briefingResponse.success || !briefingResponse.data) {
          throw new Error('briefing')
        }

        if (!historyResponse.success || !historyResponse.data) {
          throw new Error('history')
        }

        if (!copilotResponse.success || !copilotResponse.data) {
          throw new Error('copilot')
        }

        if (!planResponse.success || !planResponse.data) {
          throw new Error('plan')
        }

        if (!ideasResponse.success || !ideasResponse.data) {
          throw new Error('ideas')
        }

        setBriefing(briefingResponse.data)
        setBriefingHistory(historyResponse.data)
        setCopilot(copilotResponse.data)
        setPlan(planResponse.data)
        setIdeas(ideasResponse.data)
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
  const filteredIdeas =
    ideaFilter === 'ALL' ? ideas : ideas.filter((idea) => idea.status === ideaFilter)
  const uniqueHeadlineSources = new Set((briefing?.headlines ?? []).map((headline) => headline.source)).size
  const leadHeadline = briefing?.headlines[0] ?? latestHistory?.headlines[0] ?? null

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
      </section>

      <section className="assistant-grid">
        <article className="assistant-card assistant-copilot-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Copilot</p>
              <h2>오늘의 코파일럿</h2>
            </div>
            <span className="tag-chip">{copilot ? formatDateTime(copilot.generatedAt) : '대기 중'}</span>
          </div>
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
        </article>

        <article className="assistant-card">
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
            {copilotAnswer ? <span className="tag-chip">{copilotAnswer.source}</span> : null}
          </div>
          {copilotAnswer ? (
            <div className="assistant-copilot-panel">
              <div className="assistant-insight-panel">
                <span className="control-label">Question</span>
                <p className="assistant-detail-text">{copilotAnswer.question}</p>
                <span className="control-label">Answer</span>
                <p className="assistant-detail-text">{copilotAnswer.answer}</p>
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
                    {copilotAnswer.suggestedActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
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
        <article className="assistant-card">
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
          <div className="idea-archive">
            {filteredIdeas.length === 0 ? (
              <p className="assistant-summary">아직 저장된 아이디어가 없어.</p>
            ) : (
              filteredIdeas.map((idea) => (
                <article key={idea.id} className="idea-card">
                  <div className="project-card-header">
                    <div>
                      <h3>{idea.title}</h3>
                      <span className="project-category">{formatDateTime(idea.updatedAt)}</span>
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
                          {idea.suggestedActions.map((action) => (
                            <li key={`${idea.id}-${action}`}>{action}</li>
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
    </main>
  )
}
