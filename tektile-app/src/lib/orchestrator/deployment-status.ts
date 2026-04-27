export const DEPLOYMENT_DOMAIN_SUFFIX = "adorable.style.dev";

export type DeploymentUiStatus = {
  state: "idle" | "deploying" | "live" | "failed";
  domain: string | null;
  url: string | null;
  commitSha: string | null;
  deploymentId: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type DeploymentTimelineEntry = {
  commitSha: string;
  commitMessage: string;
  commitDate: string;
  domain: string;
  url: string;
  deploymentId: string | null;
  state: "idle" | "deploying" | "live" | "failed";
};

export const getLatestCommitSha = async (_repoId: string) => {
  return "main";
};

export const getDomainForCommit = (commitSha: string) => {
  return `${commitSha.slice(0, 12)}-${DEPLOYMENT_DOMAIN_SUFFIX}`;
};

export const getDeploymentStatusForLatestCommit = async (
  repoId: string,
  _isAgentRunning: boolean,
): Promise<DeploymentUiStatus> => {
  const updatedAt = new Date().toISOString();

  return {
    state: "live",
    domain: `${repoId}.style.dev`,
    url: `https://${repoId}.style.dev`,
    commitSha: "main",
    deploymentId: "e2b-sandbox",
    lastError: null,
    updatedAt,
  };
};

export const getDeploymentTimelineFromCommits = async (
  _repoId: string,
  _limit = 12,
): Promise<DeploymentTimelineEntry[]> => {
  return [];
};
