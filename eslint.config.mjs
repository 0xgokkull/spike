export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'drizzle/**',
      'scripts/**',
      'dist/**',
    ],
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/**', '@/integrations/**', '@/agent/**', '@/executors/**', '@/services/**', '@/app/**', '@/ui/**'],
              message: 'Domain layer must not import from other app layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/db/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/integrations/**', '@/agent/**', '@/executors/**', '@/services/**', '@/app/**', '@/ui/**'],
              message: 'DB layer must not import from higher layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/integrations/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/**', '@/agent/**', '@/executors/**', '@/services/**', '@/app/**', '@/ui/**'],
              message: 'Integrations layer must not import from internal layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/agent/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/**', '@/integrations/paypal/**', '@/executors/**', '@/services/**', '@/app/**', '@/ui/**'],
              message: 'Agent layer must not import from db, paypal or ui.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/executors/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/**', '@/agent/**', '@/services/**', '@/app/**', '@/ui/**'],
              message: 'Executors layer must not import from db, agent, services or ui.',
            },
          ],
        },
      ],
    },
  },
];
