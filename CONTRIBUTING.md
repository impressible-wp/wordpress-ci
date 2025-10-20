# Contributing

Thanks for considering to contribute to this project.

## Important Links

- Issue Tracker: https://github.com/impressible-wp/wordpress-ci/issues
- Pull Request: https://github.com/impressible-wp/wordpress-ci/pulls

## Development Notes

### Setup

Currently, this project is optimized for Linux-based platform. Please help to extend
this project to support more platform, both as development platform and test target platform.

Assuming you have NodeJS (tested on 24) on a Linux distribution, things should be good to go.

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
