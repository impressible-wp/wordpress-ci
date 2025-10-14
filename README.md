# WordPress Plugin CI

A GitHub Action for WordPress plugin continuous integration, testing, and deployment.

## TypeScript Development Setup

This repository has been configured for TypeScript development of a GitHub Action with the following structure:

### 📁 Project Structure

```
/
├── src/                    # Source TypeScript files
│   ├── index.ts           # Entry point
│   └── main.ts            # Main action logic
├── dist/                  # Compiled JavaScript output
│   ├── index.js           # Built action (committed to repo)
│   ├── index.js.map       # Source map
│   └── licenses.txt       # Third-party licenses
├── __tests__/             # Jest test files
├── scripts/               # Development scripts
├── .github/workflows/     # CI/CD workflows
└── ...config files
```

### 🛠️ Development Tools

- **TypeScript**: Type-safe JavaScript development
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **@vercel/ncc**: Bundle TypeScript to single JS file
- **GitHub Actions Toolkit**: Core libraries for action development

### 📦 Available Scripts

```bash
# Development & Building
npm run dev         # Watch mode - rebuilds on file changes
npm run build       # Build production bundle
npm run all         # Format + Lint + Test + Build

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix ESLint issues
npm run format      # Format code with Prettier
npm run format:check # Check if code is formatted

# Testing
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
```

### 🚀 Development Workflow

1. **Initial Setup**:

   ```bash
   npm install
   ```

2. **Development**:

   ```bash
   npm run dev        # Start watch mode
   # Edit files in src/
   # Tests run automatically, dist/ updates on save
   ```

3. **Before Committing**:
   ```bash
   npm run all        # Runs all checks and builds
   ```

### 📋 Key Files

- **`action.yml`**: GitHub Action metadata
- **`src/index.ts`**: Entry point that calls main function
- **`src/main.ts`**: Main action logic
- **`__tests__/main.test.ts`**: Unit tests
- **`tsconfig.json`**: TypeScript configuration
- **`.eslintrc.js`**: ESLint configuration
- **`.prettierrc`**: Prettier configuration
- **`jest.config.js`**: Jest test configuration

### 🔧 VS Code Integration

Recommended extensions are configured in `.vscode/extensions.json`:

- TypeScript support
- ESLint integration
- Prettier formatting
- Jest testing

### 📚 Common Libraries Included

- `@actions/core`: Core GitHub Actions functionality
- `@actions/github`: GitHub API and context
- `@actions/exec`: Execute commands
- `@actions/io`: File system operations
- `@actions/tool-cache`: Tool caching utilities

### 🏗️ CI/CD

GitHub workflows are configured for:

- **CI**: Lint, test, and build on PRs and pushes
- **Dist Check**: Ensures `dist/` is up to date

### 📝 Notes

- The `dist/` folder contains the compiled action and **must be committed**
- Use `npm run build` before committing changes
- The action uses Node.js 20 runtime
- Source maps are generated for debugging

## Getting Started

After setup completion, you can now:

1. Modify `src/main.ts` to implement your WordPress plugin CI logic
2. Update `action.yml` with your specific inputs/outputs
3. Add tests in `__tests__/`
4. Use `npm run dev` for active development

## Usage

```yaml
- uses: shogo82148/actions-setup-mysql@v1
  with:
    mysql-version: mariadb-11.7
    user: username
    password: password
- name: Create database
  run: |
    mysql -uroot -e 'CREATE DATABASE wordpress'
    mysql -uroot -e 'GRANT ALL ON wordpress to username'
- uses: impressible-wp/wordpress-plugin-ci@v1
  with:
    myInput: 'your-value'
```

## Docker Container

This repository includes [config file](docker/Dockerfile) to build the environment for
CI testing. You may check README.md in [the folder](docker/) for more information.

## License

This software is licensed under the [MIT License](https://mit-license.org). A copy of the license
is distributed along with the source code [here](LICENSE.md).
