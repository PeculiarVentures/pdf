import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "vars": "all",
          "args": "after-used",
          "ignoreRestSiblings": false,
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
    }
  },
  {
    ignores: ['packages/*/build/**', 'packages/*/*.mjs'],
  },
);
