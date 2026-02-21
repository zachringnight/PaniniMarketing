import type { Database } from "./database";

// Row type shortcuts
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Phase = Database["public"]["Tables"]["phases"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type Athlete = Database["public"]["Tables"]["athletes"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type ActivityLogEntry = Database["public"]["Tables"]["activity_log"]["Row"];
export type ApprovalChain = Database["public"]["Tables"]["approval_chains"]["Row"];

// Extended types with relations
export type AssetWithRelations = Asset & {
  phase: Phase;
  athletes: Athlete[];
  clubs: Club[];
  approvals: ApprovalWithUser[];
  comments: CommentWithUser[];
  created_by_user: User;
};

export type ApprovalWithUser = Approval & {
  user: User;
};

export type CommentWithUser = Comment & {
  user: User;
  replies?: CommentWithUser[];
};

export type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

export type AthleteWithClub = Athlete & {
  club: Club | null;
};

// Label maps for display
export const CONTENT_BUCKET_LABELS: Record<string, string> = {
  partnership: "Partnership Announcement",
  product: "Product Launch / Release Day",
  collecting: "Collecting Culture",
  spotlight: "Athlete Spotlight",
  hype: "Season Hype",
  pr: "Broadcast / PR / Media Kit",
  trust: "Authenticity / Trust",
};

export const ASSET_FORMAT_LABELS: Record<string, string> = {
  static: "Static Image",
  carousel: "Carousel",
  short_video: "Short Video",
  long_video: "Long Video",
  story: "Story / Reel",
  document: "Document",
};

export const SOURCE_STATION_LABELS: Record<string, string> = {
  field: "Field",
  pack_rips: "Pack Rips",
  social: "Social",
  vnr: "VNR",
  signing: "Signing",
  na: "N/A",
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
  published: "Published",
  archived: "Archived",
};

export const PLATFORM_OPTIONS = [
  "Instagram",
  "X/Twitter",
  "TikTok",
  "YouTube",
  "Facebook",
  "Broadcast",
  "Press",
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  brand: "Brand",
  league: "League",
  pa: "Players Association",
  club: "Club",
  viewer: "Viewer",
};

// Permission helpers
export type UserRole = Database["public"]["Enums"]["user_role"];

export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewAllAssets: boolean;
  canApprove: boolean;
  canUpload: boolean;
  canComment: boolean;
  canManageSettings: boolean;
  canViewQueue: boolean;
}> = {
  admin: {
    canViewAllAssets: true,
    canApprove: true,
    canUpload: true,
    canComment: true,
    canManageSettings: true,
    canViewQueue: true,
  },
  brand: {
    canViewAllAssets: true,
    canApprove: true,
    canUpload: false,
    canComment: true,
    canManageSettings: false,
    canViewQueue: true,
  },
  league: {
    canViewAllAssets: true,
    canApprove: true,
    canUpload: false,
    canComment: true,
    canManageSettings: false,
    canViewQueue: true,
  },
  pa: {
    canViewAllAssets: false,
    canApprove: true,
    canUpload: false,
    canComment: true,
    canManageSettings: false,
    canViewQueue: true,
  },
  club: {
    canViewAllAssets: false,
    canApprove: false,
    canUpload: false,
    canComment: false,
    canManageSettings: false,
    canViewQueue: false,
  },
  viewer: {
    canViewAllAssets: false,
    canApprove: false,
    canUpload: false,
    canComment: false,
    canManageSettings: false,
    canViewQueue: false,
  },
};
