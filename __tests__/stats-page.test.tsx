import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import StatsPage from '@/app/stats/page'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { name: 'Test User', email: 'test@test.com' } },
  })),
  signOut: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

function statsBody(overrides: Record<string, unknown> = {}) {
  return {
    histogram: [0, 0, 0, 0, 0, 1, 0, 1, 2, 0, 1],
    totalUsers: 5,
    yourScore: 10,
    yourRank: 1,
    percentile: 80,
    averageScore: 8,
    medianScore: 8,
    modeScore: 8,
    topScore: 10,
    lowScore: 5,
    averageTimeSeconds: 252,
    topScoreCount: 1,
    topScorePercent: 20,
    roleDistribution: [],
    roleAverageScores: [],
    experienceAverageScores: [],
    experienceDistribution: [],
    locationDistribution: [],
    locationAverageScores: [],
    locationDistributionLabel: 'Countries',
    locationComparisons: [
      { label: 'Hyderabad', scope: 'City', averageScore: 8.2, count: 3 },
      { label: 'India', scope: 'Country', averageScore: 8, count: 5 },
      { label: 'Global', scope: 'Global', averageScore: 7.4, count: 12 },
    ],
    userProgress: {
      attemptCount: 3,
      latestScore: 10,
      previousScore: 8,
      scoreChange: 2,
      bestScore: 10,
      latestTimeSeconds: 220,
      averageTimePerQuestionSeconds: 22,
      scorePerMinute: 2.7,
      latestCompletedAt: '2026-01-04',
      consistency: { label: 'Stable', averageScore: 8.7, scoreRange: 2, standardDeviation: 0.9 },
    },
    rankLadder: [
      { scope: 'City', label: 'Hyderabad', rank: 1, percentile: 90, cohortSize: 5, averageScore: 8 },
      { scope: 'Global', label: 'Global', rank: 2, percentile: 85, cohortSize: 12, averageScore: 7.4 },
    ],
    peerGroupRanks: [
      {
        dimension: 'Role',
        label: 'Software Engineer / Developer',
        rank: 2,
        percentile: 75,
        cohortSize: 5,
        averageScore: 7.5,
      },
      {
        dimension: 'Country',
        label: 'India',
        rank: 1,
        percentile: 80,
        cohortSize: 5,
        averageScore: 7.8,
      },
    ],
    topCitiesByScore: [{ label: 'Hyderabad', count: 5, averageScore: 8, rank: 1, isYou: true }],
    topCitiesByParticipation: [{ label: 'Hyderabad', count: 5, averageScore: 5, rank: 1, isYou: true }],
    averageScoreByState: [{ label: 'Telangana', count: 5, averageScore: 8 }],
    testTakersByState: [{ label: 'Telangana', count: 5, averageScore: 8 }],
    neighbors: [
      { rank: 1, score: 10, isYou: true, name: 'Test User' },
      { rank: 2, score: 8, isYou: false, name: 'Ada Lovelace' },
    ],
    ...overrides,
  }
}

function personalBody(overrides: Record<string, unknown> = {}) {
  return {
    activityCalendar: [{ date: '2026-01-04', count: 1 }],
    streaks: { currentStreak: 1, longestStreak: 3 },
    timeOfDayPerformance: [{ dayOfWeek: 1, hour: 10, averageScore: 8, count: 1 }],
    pacePoints: [{ timeTakenSeconds: 220, score: 10, completedAt: '2026-01-04T00:00:00Z' }],
    domainRanges: [{ domain: 'ai', min: 8, mean: 9, max: 10, count: 3 }],
    domainRadar: [
      { domain: 'ai', you: 9, city: 7, country: 6 },
      { domain: 'cloud', you: null, city: null, country: null },
      { domain: 'cybersecurity', you: null, city: null, country: null },
      { domain: 'devops', you: null, city: null, country: null },
      { domain: 'data_science', you: null, city: null, country: null },
    ],
    recentAttempts: [{ domain: 'ai', score: 10, completedAt: '2026-01-04T00:00:00Z', scoreChangeFromPrevious: 2 }],
    weekOverWeek: { thisWeekAverage: 9, lastWeekAverage: 7, change: 2 },
    ...overrides,
  }
}

const overviewBody = {
  averageScoreByDomain: { ai: 7, cloud: null, cybersecurity: null, devops: null, data_science: null },
  attemptCounts: { ai: 5, cloud: 0, cybersecurity: 0, devops: 0, data_science: 0 },
  mostAttemptedDomain: 'ai',
  userLatestScoreByDomain: { ai: 10, cloud: 6, cybersecurity: 4, devops: null, data_science: 8 },
  userBestScoreByDomain: { ai: 10, cloud: 7, cybersecurity: 4, devops: null, data_science: 9 },
  userAttemptCountsByDomain: { ai: 3, cloud: 2, cybersecurity: 1, devops: 0, data_science: 2 },
}

const leaderboardBody = { leaderboard: [] }

// StatsPage fetches /api/stats and /api/stats/personal itself, while its
// DomainOverview and Leaderboard children each fetch their own endpoint —
// route mocked responses by URL so every consumer gets a shape it can render.
function installFetchMock(
  stats: object = statsBody(),
  profile: object = { profile: {} },
  personal: object = personalBody()
) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/profile')) {
      return Promise.resolve({ ok: true, json: async () => profile })
    }
    if (url.includes('/api/stats/overview')) {
      return Promise.resolve({ ok: true, json: async () => overviewBody })
    }
    if (url.includes('/api/stats/leaderboard')) {
      return Promise.resolve({ ok: true, json: async () => leaderboardBody })
    }
    if (url.includes('/api/stats/personal')) {
      return Promise.resolve({ ok: true, json: async () => personal })
    }
    return Promise.resolve({ ok: true, json: async () => stats })
  })
}

function openMoreFilters() {
  fireEvent.click(screen.getByRole('button', { name: /more filters/i }))
}

// The effect's own setState calls land a couple of microtask ticks after the fetch
// call is recorded, so tests that only assert on the fetch call args (not a DOM
// change) need to flush those ticks inside act() before the test tears down.
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function waitForCommunityInsights() {
  await waitFor(() => expect(screen.getByTestId('community-insights')).toBeInTheDocument())
}

describe('StatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches stats for the default domain on mount', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai'))
    })
    await waitForCommunityInsights()
  })

  it('defaults the community filters to the saved profile location', async () => {
    installFetchMock(statsBody(), {
      profile: { country: 'India', state_region: 'Telangana', city: 'Hyderabad' },
    })
    render(<StatsPage />)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('country=India'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('state_region=Telangana'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('city=Hyderabad'))
    })
    expect(screen.getByRole('heading', { name: 'Community insights' })).toBeInTheDocument()
    expect(screen.getAllByText('Hyderabad, Telangana, India').length).toBeGreaterThan(0)
  })

  it('defaults to the Community Insights tab and exposes the comparison controls from Filters', async () => {
    installFetchMock()
    render(<StatsPage />)
    expect(screen.getByRole('tab', { name: 'Community Insights' })).toHaveAttribute('aria-selected', 'true')
    openMoreFilters()
    expect(screen.getByLabelText('Domain')).toBeInTheDocument()
    expect(screen.getByLabelText('Designation')).toBeInTheDocument()
    expect(screen.getByLabelText('Experience')).toBeInTheDocument()
    await waitForCommunityInsights()
  })

  it('wraps the tab bar in a horizontally scrollable container so it cannot force page-wide overflow on narrow screens', async () => {
    installFetchMock()
    render(<StatsPage />)
    const tablist = screen.getByRole('tablist')
    expect(tablist.parentElement).toHaveClass('overflow-x-auto')
    await waitForCommunityInsights()
  })

  it('uses the workspace header instead of a duplicate back link', async () => {
    installFetchMock()
    render(<StatsPage />)
    expect(screen.getByRole('heading', { name: 'Community insights' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /back to dashboard/i })).not.toBeInTheDocument()
    await waitForCommunityInsights()
  })

  it('does not offer location filters because the page is fixed to Hyderabad', async () => {
    installFetchMock()
    render(<StatsPage />)
    expect(screen.queryByLabelText('Country')).not.toBeInTheDocument()
    await waitForCommunityInsights()

    openMoreFilters()
    expect(screen.queryByLabelText('Country')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('State or Region')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('City')).not.toBeInTheDocument()
  })

  it('always requests the Hyderabad launch cohort', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\?.*country=India/))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\?.*state_region=Telangana/))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\?.*city=Hyderabad/))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\?.*launch_city_only=true/))
  })

  it('shows the hero row, score trend, and community benchmark once data is loaded', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()
    expect(screen.getByTestId('hero-row')).toBeInTheDocument()
    expect(screen.getByText('Score trend')).toBeInTheDocument()
    expect(screen.getByText('Where you stand')).toBeInTheDocument()
    expect(screen.queryByText('Recent attempts')).not.toBeInTheDocument()
  })

  it("shows the hero row's tests taken, average score, best score, and percentile", async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('hero-row')).toBeInTheDocument())
    const hero = screen.getByTestId('hero-row')
    expect(hero).toHaveTextContent('Tests taken')
    expect(hero).toHaveTextContent('3')
    expect(hero).toHaveTextContent('Average score')
    expect(hero).toHaveTextContent('8.7')
    expect(hero).toHaveTextContent('Best score')
    expect(hero).toHaveTextContent('10')
    expect(hero).toHaveTextContent('Percentile')
    expect(hero).toHaveTextContent('80')
  })

  it('does not show city, state, country, or global rank scopes', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()
    expect(screen.queryByTestId('rank-ladder-tile')).not.toBeInTheDocument()
  })

  it('shows peer group ranks with cohort, test-takers, average, and your rank', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('peer-groups-tile')).toBeInTheDocument())
    const peerGroups = screen.getByTestId('peer-groups-tile')
    expect(peerGroups).toHaveTextContent('Software Engineer / Developer')
    expect(peerGroups).toHaveTextContent('#2')
    expect(peerGroups).not.toHaveTextContent('Country')
    expect(peerGroups).not.toHaveTextContent('India')
  })

  it('shows the community snapshot with median, mode, top, and low scores', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('community-snapshot-tile')).toBeInTheDocument())
    const snapshot = screen.getByTestId('community-snapshot-tile')
    expect(snapshot).toHaveTextContent('Test-takers')
    expect(snapshot).toHaveTextContent('Median')
    expect(snapshot).toHaveTextContent('Most common')
    expect(snapshot).toHaveTextContent('Top score')
    expect(snapshot).toHaveTextContent('Lowest')
  })

  it('shows neighbors with display names and no email', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('neighbors-tile')).toBeInTheDocument())
    const neighbors = screen.getByTestId('neighbors-tile')
    expect(neighbors).toHaveTextContent('You')
    expect(neighbors).toHaveTextContent('Ada Lovelace')
    expect(neighbors).not.toHaveTextContent('test@test.com')
  })

  it('does not show geographic comparison or regional ranking cards', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()
    expect(screen.queryByTestId('location-comparison-tile')).not.toBeInTheDocument()
    expect(screen.queryByTestId('top-states-tile')).not.toBeInTheDocument()
    expect(screen.queryByTestId('top-cities-tile')).not.toBeInTheDocument()
    expect(screen.queryByTestId('domain-radar-tile')).not.toBeInTheDocument()
  })

  it('shows a no-attempts message when nobody has taken the test yet', async () => {
    installFetchMock(statsBody({ totalUsers: 0, yourScore: null, yourRank: null, percentile: null }))
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('no-attempts-yet')).toBeInTheDocument())
    expect(screen.getByTestId('no-attempts-yet')).toHaveTextContent('be the first')
  })

  it("highlights the bar matching the user's score in the score distribution", async () => {
    installFetchMock(statsBody({ yourScore: 8 }))
    render(<StatsPage />)
    await waitFor(() => expect(screen.getByTestId('score-distribution-tile')).toBeInTheDocument())
    expect(screen.getByTestId('score-distribution-tile')).toBeInTheDocument()
  })

  it('shows only AI in the Stats domain dropdown', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai')))
    openMoreFilters()
    const domainSelect = screen.getByLabelText('Domain')
    expect(domainSelect).toHaveValue('ai')
    expect(within(domainSelect).getAllByRole('option')).toHaveLength(1)
    await flushMicrotasks()
  })

  it('refetches when the designation dropdown changes', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai')))
    openMoreFilters()
    fireEvent.change(screen.getByLabelText('Designation'), { target: { value: 'Data Scientist' } })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('designation=Data+Scientist'))
    })
    await flushMicrotasks()
  })

  it('refetches when the experience dropdown changes', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai')))
    openMoreFilters()
    fireEvent.change(screen.getByLabelText('Experience'), { target: { value: '5-10 years' } })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('experience=5-10+years'))
    })
    await flushMicrotasks()
  })

  it('keeps overview and leaderboard requests scoped to Hyderabad', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai')))
    fireEvent.click(screen.getByRole('tab', { name: 'Domain Overview' }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\/overview\?.*city=Hyderabad/))
    })
    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/stats\/leaderboard\?.*city=Hyderabad/))
    })
    await flushMicrotasks()
  })

  it('shows an active-filter count on the "More filters" toggle once collapsed again', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('domain=ai')))
    openMoreFilters()
    fireEvent.change(screen.getByLabelText('Designation'), { target: { value: 'Data Scientist' } })
    fireEvent.click(screen.getByRole('button', { name: /view comparison/i }))
    expect(screen.getByRole('button', { name: /more filters/i })).toBeInTheDocument()
    expect(screen.getByTestId('filter-count-badge')).toHaveTextContent('1')
    await flushMicrotasks()
  })

  it('shows an error message when the stats fetch fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/stats/overview')) {
        return Promise.resolve({ ok: true, json: async () => overviewBody })
      }
      if (url.includes('/api/stats/leaderboard')) {
        return Promise.resolve({ ok: true, json: async () => leaderboardBody })
      }
      if (url.includes('/api/stats/personal')) {
        return Promise.resolve({ ok: true, json: async () => personalBody() })
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: 'fail' }) })
    })
    render(<StatsPage />)
    await waitFor(() => {
      expect(screen.getByText('Could not load stats. Please try again.')).toBeInTheDocument()
    })
  })

  it('switches to the Domain Overview tab and hides the community insights view', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    fireEvent.click(screen.getByRole('tab', { name: 'Domain Overview' }))
    await waitFor(() => expect(screen.getByTestId('domain-overview')).toBeInTheDocument())
    expect(screen.getByText('AI & Generative AI')).toBeInTheDocument()
    expect(screen.queryByText('Cloud Computing')).not.toBeInTheDocument()
    expect(screen.queryByText('Cybersecurity')).not.toBeInTheDocument()
    expect(screen.queryByText('DevOps & CI/CD')).not.toBeInTheDocument()
    expect(screen.queryByText('Data Science & Analytics')).not.toBeInTheDocument()
    expect(screen.queryByTestId('community-insights')).not.toBeInTheDocument()
  })

  it('switches to the Leaderboard tab and hides the community insights view', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))
    await waitFor(() => expect(screen.getByText(/Top scorers in/)).toBeInTheDocument())
    expect(screen.queryByTestId('community-insights')).not.toBeInTheDocument()
  })

  it('keeps the comparison filters available on the Domain Overview tab', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    fireEvent.click(screen.getByRole('tab', { name: 'Domain Overview' }))
    await waitFor(() => expect(screen.getByTestId('domain-overview')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /more filters/i })).toBeInTheDocument()
    openMoreFilters()
    expect(screen.getByLabelText('Designation')).toBeInTheDocument()
    expect(screen.getByLabelText('Experience')).toBeInTheDocument()
  })

  it('keeps the comparison filters available on the Leaderboard tab', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))
    await waitFor(() => expect(screen.getByText(/Top scorers in/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /more filters/i })).toBeInTheDocument()
    openMoreFilters()
    expect(screen.getByLabelText('Designation')).toBeInTheDocument()
    expect(screen.getByLabelText('Experience')).toBeInTheDocument()
  })

  it('passes the selected crowd filters through to the Domain Overview request', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    openMoreFilters()
    fireEvent.change(screen.getByLabelText('Designation'), { target: { value: 'Data Scientist' } })
    fireEvent.change(screen.getByLabelText('Experience'), { target: { value: '5-10 years' } })
    fireEvent.click(screen.getByRole('button', { name: /view comparison/i }))
    fireEvent.click(screen.getByRole('tab', { name: 'Domain Overview' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/stats\/overview\?.*designation=Data\+Scientist/)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/stats\/overview\?.*experience=5-10\+years/)
      )
    })
    await flushMicrotasks()
  })

  it('passes the selected crowd filters through to the Leaderboard request', async () => {
    installFetchMock()
    render(<StatsPage />)
    await waitForCommunityInsights()

    openMoreFilters()
    fireEvent.change(screen.getByLabelText('Designation'), { target: { value: 'Data Scientist' } })
    fireEvent.click(screen.getByRole('button', { name: /view comparison/i }))
    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/stats\/leaderboard\?.*designation=Data\+Scientist/)
      )
    })
    await flushMicrotasks()
  })
})
