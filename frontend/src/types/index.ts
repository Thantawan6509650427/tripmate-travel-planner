// ============================================================================
// API Response
// ============================================================================
export interface ApiResponse<T = any> {
  success: boolean
  code: string
  message: string
  data?: T
}

// ============================================================================
// User
// ============================================================================
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

// ============================================================================
// Trip
// ============================================================================
export type TripStatus = 'OPEN' | 'VOTING' | 'CLOSED'
export type MemberRole = 'OWNER' | 'MEMBER'
export type MemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TripMember {
  id: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
  user: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface Trip {
  id: string
  name: string
  description?: string
  inviteCode: string
  status: TripStatus
  aiSummary?: string
  link?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  owner: Pick<User, 'id' | 'name' | 'avatar'>
  members: TripMember[]
  selectedDates?: TripSelectedDate[]
}

export interface TripSelectedDate {
  id: string
  date: string
  score: number
}

// ============================================================================
// Payloads
// ============================================================================
export interface CreateTripPayload {
  name: string
  description?: string
}

export interface CreateTripResponse {
  trip: Trip
}

export interface MyTripsResponse {
  trips: Trip[]
}

export interface JoinTripResponse {
  trip: Trip
  member: TripMember
}

export interface TripDetail extends Trip {}

// ============================================================================
// Vote
// ============================================================================
export interface SubmitAvailabilityPayload {
  trip_id: string
  dates: string[]
}

export interface HeatmapEntry {
  date: string
  count: number
  percentage: number
  users: Pick<User, 'id' | 'name' | 'avatar'>[]
}

export interface DateMatchingResponse {
  heatmap: HeatmapEntry[]
  totalMembers: number
  submittedCount: number
  bestDates: { date: string; count: number }[]
}

export interface BudgetVote {
  id: string
  category: string
  amount: number
  userId: string
}

export interface BudgetSummary {
  category: string
  average: number
  voteCount: number
}

export interface BudgetVotingResponse {
  myVotes: BudgetVote[]
  summary: BudgetSummary[]
  totalMembers: number
  submittedCount: number
}

export interface UpdateBudgetPayload {
  category: string
  amount: number
}

export interface UpdateBudgetResponse {
  id: string
  category: string
  amount: number
}

export interface LocationVoteItem {
  id: string
  place: string
  score: number
  userId: string
  user: Pick<User, 'id' | 'name'>
}

export interface LocationVoteResponse {
  rows: LocationVoteItem[]
  myVotes: LocationVoteItem[]
  locationVotesTotal: { place: string; totalScore: number }[]
  actualVote: number
  totalMembers: number
}

export interface SubmitLocationVotePayload {
  votes: { place: string; score: number }[]
}

export interface LocationScores {
  [place: string]: number
}

export interface StartVotingResponse {
  id: string
  status: TripStatus
  selectedDates: TripSelectedDate[]
}

export interface TripSummaryResult {
  aiSummary: string
  trip: Trip
}

// ============================================================================
// Notification
// ============================================================================
export type NotificationType =
  | 'JOIN_REQUEST'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'VOTING_STARTED'
  | 'TRIP_CLOSED'
  | 'MEMBER_REMOVED'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  isRead: boolean
  createdAt: string
  tripId?: string
  trip?: Pick<Trip, 'id' | 'name'>
}

export interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}