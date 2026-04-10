import { Logger } from './logger.js';

export class PromptEngine {
  constructor() {
    this.logger = new Logger({ prefix: '[PromptEngine]' });
  }

  createAnalysisPrompt(request, options) {
    return `
You are an expert software architect. Analyze the following project request and provide a detailed analysis:

Request: "${request}"
Options: ${JSON.stringify(options)}

Please provide:
1. Project type identification (web app, API, mobile app, CLI tool, etc.)
2. Key features and functionalities required
3. Recommended technology stack
4. Architecture overview
5. Any potential challenges or considerations

Format your response as a structured analysis that will be used for project planning.
`;
  }

  createPlanningPrompt(analysis, options) {
    return `
You are an expert software planner. Based on the following analysis, create a detailed project plan:

Analysis: ${JSON.stringify(analysis)}
Options: ${JSON.stringify(options)}

Please provide:
1. Project name and description
2. File structure (directories and files to create)
3. For each file: path, type (source/documentation/config/test), and description
4. Required dependencies (npm packages)
5. Configuration files needed

Format your response as a structured plan that will be used for project execution.
`;
  }

  createFileGenerationPrompt(fileSpec, options) {
    return `
You are an expert software developer. Generate the content for the following file based on the project context:

File Specification:
- Path: ${fileSpec.path}
- Type: ${fileSpec.type}
- Description: ${fileSpec.description}

Project Options: ${JSON.stringify(options)}

Please generate appropriate content for this file. Follow best practices for the file type and technology implied by the project context.

For source files: Write clean, well-documented code.
For documentation: Write clear, helpful documentation.
For configuration: Write properly formatted config files.
For tests: Write comprehensive test cases.

Return ONLY the file content, no additional explanations.
`;
  }
}