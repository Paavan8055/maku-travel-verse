# Contributing

Thank you for taking the time to contribute!

## Environment Requirements
- **Node.js**: Version 20 or higher (enforced by engines field in package.json)
- **npm**: Version 10 or higher
- Use the exact Node.js version specified in `.nvmrc` for consistency

## Dependency Management
- **Runtime dependencies**: Only packages needed in production should be in `dependencies`
- **Development dependencies**: Testing libraries, build tools, and dev-only packages belong in `devDependencies`
- **Testing libraries**: All testing-related packages (`@testing-library/*`, `vitest`, etc.) are in `devDependencies`
- **Never modify package.json directly**: Use `npm install --save` for runtime deps and `npm install --save-dev` for dev deps

## Package Cleanup Commands
```bash
# Clean dependency tree and optimize
npm dedupe                    # Remove duplicate packages
npm prune                     # Remove unused packages
npm audit --production        # Check for security vulnerabilities in production deps
npm cache clean --force       # Clear npm cache if needed
```

## Commit conventions
- Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - keep the subject line to 72 characters or fewer and use the imperative mood

## Pull requests and reviews
- All changes must be made through pull requests targeting `main`
- Ensure your branch is up to date with `main`
- Run `npm run lint` and `npx vitest run` locally before submitting
- Each pull request requires at least one approving review and passing CI checks

We appreciate your contributions and feedback!
