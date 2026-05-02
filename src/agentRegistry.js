export const AgentTypes = {
  BUILD: 'build',
  PLAN: 'plan', 
  REVIEW: 'review',
  DEBUG: 'debug',
  DOCS: 'docs',
  RESEARCH: 'research',
  GENERAL: 'general',
  EXPLORE: 'explore'
};

export const AgentModes = {
  ALL: 'all',
  PRIMARY: 'primary',
  SUBAGENT: 'subagent',
  HIDDEN: 'hidden'
};

export const AgentRoles = {
  ORCHESTRATOR: 'orchestrator',
  EXECUTOR: 'executor',
  RESEARCHER: 'researcher',
  REVIEWER: 'reviewer',
  PLANNER: 'planner'
};

export const PermissionActions = {
  ALLOW: 'allow',
  DENY: 'deny',
  READ: 'read',
  WRITE: 'write',
  EXECUTE: 'execute'
};

export const ToolPermissions = {
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_DELETE: 'file:delete',
  BASH_EXECUTE: 'bash:execute',
  GIT_OPERATE: 'git:operate',
  NPM_INSTALL: 'npm:install',
  SEARCH: 'search',
  WEB_FETCH: 'web:fetch',
  LLM_GENERATE: 'llm:generate',
  TASK_DELEGATE: 'task:delegate'
};

export const BuiltInAgents = {
  build: {
    name: 'Build',
    description: 'Full development capabilities with all tools enabled. Default agent for implementation work.',
    type: AgentTypes.BUILD,
    mode: AgentModes.PRIMARY,
    role: AgentRoles.EXECUTOR,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_DELETE]: PermissionActions.ALLOW,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.ALLOW,
      [ToolPermissions.GIT_OPERATE]: PermissionActions.ALLOW,
      [ToolPermissions.NPM_INSTALL]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.ALLOW
    },
    taskBudget: 5,
    model: 'default'
  },
  plan: {
    name: 'Plan',
    description: 'Analysis and planning agent. Read-only tools to prevent unintended changes.',
    type: AgentTypes.PLAN,
    mode: AgentModes.PRIMARY,
    role: AgentRoles.PLANNER,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_DELETE]: PermissionActions.DENY,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.DENY,
      [ToolPermissions.GIT_OPERATE]: PermissionActions.DENY,
      [ToolPermissions.NPM_INSTALL]: PermissionActions.DENY,
      [ToolPermissions.FILE_WRITE]: PermissionActions.DENY,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.DENY
    },
    taskBudget: 0,
    model: 'default'
  },
  review: {
    name: 'Review',
    description: 'Code review agent with read-only access plus documentation tools.',
    type: AgentTypes.REVIEW,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.REVIEWER,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.DENY,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.DENY,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.DENY
    },
    taskBudget: 2,
    model: 'default'
  },
  debug: {
    name: 'Debug',
    description: 'Investigation-focused agent with bash and read tools enabled.',
    type: AgentTypes.DEBUG,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.REVIEWER,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.DENY,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.ALLOW
    },
    taskBudget: 3,
    model: 'default'
  },
  docs: {
    name: 'Docs',
    description: 'Documentation writing agent with file operations but no system commands.',
    type: AgentTypes.DOCS,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.EXECUTOR,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.DENY,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.ALLOW
    },
    taskBudget: 2,
    model: 'default'
  },
  general: {
    name: 'General',
    description: 'General purpose agent for multi-step tasks. Has full tool access for implementation.',
    type: AgentTypes.GENERAL,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.EXECUTOR,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_DELETE]: PermissionActions.ALLOW,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.ALLOW,
      [ToolPermissions.GIT_OPERATE]: PermissionActions.ALLOW,
      [ToolPermissions.NPM_INSTALL]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.ALLOW
    },
    taskBudget: 5,
    model: 'default'
  },
  explore: {
    name: 'Explore',
    description: 'Fast, read-only agent for exploring codebases. Cannot modify files.',
    type: AgentTypes.EXPLORE,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.RESEARCHER,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.FILE_WRITE]: PermissionActions.DENY,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.DENY,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.DENY
    },
    taskBudget: 0,
    model: 'default'
  },
  researcher: {
    name: 'Researcher',
    description: 'Research and investigation agent. Can explore and analyze deeply.',
    type: AgentTypes.RESEARCH,
    mode: AgentModes.SUBAGENT,
    role: AgentRoles.RESEARCHER,
    permissions: {
      [ToolPermissions.FILE_READ]: PermissionActions.ALLOW,
      [ToolPermissions.SEARCH]: PermissionActions.ALLOW,
      [ToolPermissions.WEB_FETCH]: PermissionActions.ALLOW,
      [ToolPermissions.LLM_GENERATE]: PermissionActions.ALLOW,
      [ToolPermissions.BASH_EXECUTE]: PermissionActions.READ,
      [ToolPermissions.FILE_WRITE]: PermissionActions.DENY,
      [ToolPermissions.TASK_DELEGATE]: PermissionActions.ALLOW
    },
    taskBudget: 3,
    model: 'default'
  }
};

export function getAgentConfig(agentType) {
  return BuiltInAgents[agentType] || BuiltInAgents.general;
}

export function canAgentPerform(agentType, permission) {
  const config = getAgentConfig(agentType);
  return config.permissions[permission] === PermissionActions.ALLOW;
}

export function canDelegateTask(agentType) {
  const config = getAgentConfig(agentType);
  return config.permissions[ToolPermissions.TASK_DELEGATE] === PermissionActions.ALLOW && config.taskBudget > 0;
}