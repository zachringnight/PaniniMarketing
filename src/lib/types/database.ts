export type UserRole = "admin" | "brand" | "league" | "pa" | "club" | "viewer";
export type AssetStatus = "draft" | "in_review" | "approved" | "changes_requested" | "rejected" | "published" | "archived";
export type ContentBucket = "partnership" | "product" | "collecting" | "spotlight" | "hype" | "pr" | "trust";
export type AssetFormat = "static" | "carousel" | "short_video" | "long_video" | "story" | "document";
export type SourceStation = "field" | "pack_rips" | "social" | "vnr" | "signing" | "na";
export type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";
export type ChainType = "parallel" | "sequential";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          organization: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          organization?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          organization?: string | null;
          avatar_url?: string | null;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          role?: UserRole;
        };
      };
      phases: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number;
        };
      };
      clubs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          market: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          market?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          market?: string | null;
        };
      };
      athletes: {
        Row: {
          id: string;
          project_id: string;
          full_name: string;
          club_id: string | null;
          headshot_url: string | null;
          embargo_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          full_name: string;
          club_id?: string | null;
          headshot_url?: string | null;
          embargo_until?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          club_id?: string | null;
          headshot_url?: string | null;
          embargo_until?: string | null;
        };
      };
      assets: {
        Row: {
          id: string;
          project_id: string;
          phase_id: string;
          title: string;
          description: string | null;
          content_bucket: ContentBucket;
          platforms: string[];
          format: AssetFormat;
          source_station: SourceStation | null;
          external_url: string;
          thumbnail_url: string | null;
          version: number;
          status: AssetStatus;
          approval_due: string | null;
          publish_date: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          phase_id: string;
          title: string;
          description?: string | null;
          content_bucket: ContentBucket;
          platforms: string[];
          format: AssetFormat;
          source_station?: SourceStation | null;
          external_url: string;
          thumbnail_url?: string | null;
          version?: number;
          status?: AssetStatus;
          approval_due?: string | null;
          publish_date?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          phase_id?: string;
          title?: string;
          description?: string | null;
          content_bucket?: ContentBucket;
          platforms?: string[];
          format?: AssetFormat;
          source_station?: SourceStation | null;
          external_url?: string;
          thumbnail_url?: string | null;
          version?: number;
          status?: AssetStatus;
          approval_due?: string | null;
          publish_date?: string | null;
          updated_at?: string;
        };
      };
      asset_athletes: {
        Row: {
          asset_id: string;
          athlete_id: string;
        };
        Insert: {
          asset_id: string;
          athlete_id: string;
        };
        Update: {
          asset_id?: string;
          athlete_id?: string;
        };
      };
      asset_clubs: {
        Row: {
          asset_id: string;
          club_id: string;
        };
        Insert: {
          asset_id: string;
          club_id: string;
        };
        Update: {
          asset_id?: string;
          club_id?: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string;
          status: ApprovalStatus;
          comment: string | null;
          version_reviewed: number;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          user_id: string;
          status?: ApprovalStatus;
          comment?: string | null;
          version_reviewed: number;
          created_at?: string;
        };
        Update: {
          status?: ApprovalStatus;
          comment?: string | null;
          responded_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string;
          body: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          user_id: string;
          body: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          asset_id: string | null;
          action: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          asset_id?: string | null;
          action: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: never;
      };
      approval_chains: {
        Row: {
          id: string;
          project_id: string;
          content_bucket: ContentBucket;
          required_roles: string[];
          chain_type: ChainType;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content_bucket: ContentBucket;
          required_roles: string[];
          chain_type?: ChainType;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          required_roles?: string[];
          chain_type?: ChainType;
          sort_order?: number;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      asset_status: AssetStatus;
      content_bucket: ContentBucket;
      asset_format: AssetFormat;
      source_station: SourceStation;
      approval_status: ApprovalStatus;
      chain_type: ChainType;
    };
  };
}
