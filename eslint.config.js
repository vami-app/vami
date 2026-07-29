const nx = require('@nx/eslint-plugin');

module.exports = [
  {
    plugins: {
      '@nx': nx,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: [
                'scope:feature',
                'scope:data-access',
                'scope:domain',
                'scope:util',
                'scope:ui',
              ],
            },
            {
              sourceTag: 'scope:feature',
              onlyDependOnLibsWithTags: [
                'scope:data-access',
                'scope:domain',
                'scope:util',
                'scope:ui',
              ],
            },
            {
              sourceTag: 'scope:data-access',
              onlyDependOnLibsWithTags: ['scope:domain', 'scope:util'],
            },
            {
              sourceTag: 'scope:domain',
              onlyDependOnLibsWithTags: ['scope:util'],
            },
            {
              sourceTag: 'scope:ui',
              onlyDependOnLibsWithTags: ['scope:util', 'scope:ui'],
            },
            {
              sourceTag: 'scope:util',
              onlyDependOnLibsWithTags: ['scope:util'],
            },
          ],
        },
      ],
    },
  },
];
