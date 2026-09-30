// Skills and education shown on the Experience page. Kept in code (not the admin
// panel) because they change rarely; edit here and redeploy. Sourced from the resume.

export interface SkillGroup {
  label: string
  skills: string[]
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Languages & frameworks',
    skills: [
      'Python (Flask, FastAPI, boto3, SQLAlchemy, Alembic, Pydantic)',
      'TypeScript',
      'Java',
      'SQL',
      'Go',
      'Bash',
      'REST APIs',
      'JSON',
      'YAML',
    ],
  },
  {
    label: 'Frontend',
    skills: ['React', 'Vite', 'React Router', 'Tailwind CSS', 'D3.js'],
  },
  {
    label: 'Data & APIs',
    skills: [
      'GraphQL',
      'ClickHouse',
      'PostgreSQL',
      'Aurora',
      'RDS',
      'DynamoDB',
      'MySQL',
      'Anthropic Claude API',
      'GitHub API',
    ],
  },
  {
    label: 'Cloud (AWS)',
    skills: [
      'Lambda',
      'ECS/Fargate',
      'EC2',
      'S3',
      'SQS',
      'API Gateway',
      'CloudFormation',
      'SAM',
      'Batch',
      'VPC',
      'IAM',
      'ECR',
    ],
  },
  {
    label: 'DevOps & testing',
    skills: [
      'Docker',
      'Docker Compose',
      'Kubernetes',
      'Terraform',
      'Jenkins',
      'Git',
      'GitHub Actions',
      'HashiCorp Vault',
      'JFrog',
      'CI/CD',
      'pytest',
      'Vitest',
      'ruff',
      'ESLint',
      'Cloud Custodian',
      'n8n',
    ],
  },
]

export interface EducationEntry {
  institution: string
  detail: string
}

export const EDUCATION: EducationEntry[] = [
  {
    institution: 'University of Virginia',
    detail: 'B.S. Computer Science, School of Engineering and Applied Sciences',
  },
]

export const CERTIFICATIONS: EducationEntry[] = [
  { institution: 'AWS Certified Solutions Architect, Associate', detail: '2023' },
]

/** Headline skills for structured data (`knowsAbout`). */
export const KNOWS_ABOUT = ['Python', 'TypeScript', 'Go', 'AWS', 'GraphQL', 'PostgreSQL', 'React']

export const ALUMNI_OF = 'University of Virginia'
