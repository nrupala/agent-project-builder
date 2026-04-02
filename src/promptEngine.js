export class PromptEngine {
  constructor() {
    this.logger = {
      info: (msg) => console.log(`[PromptEngine] ${msg}`),
      error: (msg) => console.error(`[PromptEngine] ${msg}`)
    };
  }

  createAnalysisPrompt(request, options) {
    return `
You are an AI agent tasked with analyzing a user's request for building a software project.

User Request: "${request}"

Analyze this request and provide:
1. Project type (web app, mobile app, API, library, CLI tool, etc.)
2. Primary technology stack suggested (if any)
3. Key features or functionality requested
4. Any specific requirements or constraints mentioned
5. Target audience or use case

Be concise but thorough in your analysis. Focus on extracting the essential information needed to plan the project.

Analysis:
`;
  }

  createPlanningPrompt(analysis, options) {
    return `
Based on the following analysis of a user's request, create a detailed project plan:

Analysis:
${JSON.stringify(analysis, null, 2)}

Project Plan Requirements:
1. Project name (suggested based on request)
2. Brief description
3. Recommended technology stack with versions
4. Project structure (directories and their purposes)
5. List of files to create with brief descriptions
6. Required dependencies (with versions if known)
7. Configuration files needed
8. Estimated complexity (low/medium/high)

Provide your response in a structured format that can be easily parsed.

Plan:
`;
  }

  createFileGenerationPrompt(fileSpec, options) {
    return `
You are an expert software engineer tasked with creating a specific file for a project.

File Specification:
- Path: ${fileSpec.path}
- Type: ${fileSpec.type}
- Description: ${fileSpec.description}

Project Context:
${options.projectContext || 'No additional context provided'}

Requirements:
1. Create the content for the file at the specified path
2. Follow best practices for the file type and technology
3. Include appropriate imports, exports, and dependencies
4. Add meaningful comments and documentation
5. Ensure the file is functional and follows coding standards
6. If this is a source file, make sure it implements the described functionality
7. If this is a configuration file, ensure it's properly formatted
8. If this is documentation, make it clear and helpful

File Content:
`;
  }
}
