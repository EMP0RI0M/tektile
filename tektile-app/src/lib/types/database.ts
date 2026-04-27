export type Project = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deployment_url?: string | null;
  deployment_status: string;
  last_deployed_at?: string | null;
  storage_path?: string | null;
  is_public: boolean;
};

export type Message = {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  type: 'RESULT' | 'ERROR';
  created_at: string;
  updated_at: string;
  images: string[];
  project_id: string;
};

export type Fragment = {
  id: string;
  message_id: string;
  sandbox_url: string;
  title: string;
  files: Record<string, string>;
  packages?: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Usage = {
  key: string;
  points: number;
  expire?: string | null;
};
