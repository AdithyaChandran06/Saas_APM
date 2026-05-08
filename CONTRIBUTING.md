# Contributing to Quantora

Thank you for your interest in contributing to Quantora! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

Be respectful, inclusive, and professional. We maintain a welcoming environment for all contributors regardless of experience level, background, or identity.

## 📋 Before You Start

- **Fork** the repository
- **Clone** your fork locally
- **Create** a feature branch (`git checkout -b feature/amazing-feature`)
- **Make** your changes
- **Test** thoroughly
- **Push** to your fork
- **Submit** a Pull Request

## 🔧 Development Setup

### Prerequisites

```bash
# Check you have the right versions
node --version  # Should be 18+
npm --version   # Should be 8+
```

### Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/quantora.git
cd quantora/Web-App-Builder

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development
npm run dev
```

### Database Setup (Optional)

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Run migrations
npm run db:push

# Seed demo data
npm run seed
```

## 💻 Code Standards

### TypeScript

- ✅ Use strict mode
- ✅ Add type annotations for function parameters and returns
- ✅ Use interfaces for object shapes
- ✅ Avoid `any` type (use `unknown` if necessary)

```typescript
// ✅ Good
function processUser(user: User): Promise<UserProfile> {
  // ...
}

interface User {
  id: string;
  email: string;
  name: string;
}

// ❌ Avoid
function processUser(user: any): any {
  // ...
}
```

### File Organization

```
src/
├── components/      # React components
│   └── FormField.tsx
├── pages/           # Page components
│   └── Dashboard.tsx
├── hooks/           # Custom React hooks
│   └── useAuth.ts
├── lib/             # Utilities and SDK
│   └── utils.ts
└── types/           # TypeScript types
    └── models.ts
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with `I` prefix (`IUser`)
- **Files**: Match export name or lowercase with hyphens

### React Best Practices

```typescript
// ✅ Good: Functional component with hooks
function UserCard({ userId }: Props) {
  const { user, loading } = useUser(userId);
  const [expanded, setExpanded] = useState(false);

  if (loading) return <Skeleton />;

  return (
    <div onClick={() => setExpanded(!expanded)}>
      {/* Component JSX */}
    </div>
  );
}

// ❌ Avoid: Class components (unless necessary)
class UserCard extends React.Component {
  // ...
}
```

### Database Queries

Use Drizzle ORM for type-safe queries:

```typescript
// ✅ Good
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.workspaceId, workspaceId));

// ❌ Avoid: Raw SQL or unsafe queries
db.query("SELECT * FROM users WHERE workspace_id = " + workspaceId);
```

## 🧪 Testing

```bash
# Type checking
npm run check

# Build verification
npm run build

# Full verification
npm run verify
```

### Before Commit

```bash
# Ensure no TypeScript errors
npm run check

# Ensure code builds
npm run build

# Verify everything works
npm run verify
```

## 📝 Commit Messages

Use clear, descriptive commit messages:

```bash
# ✅ Good
git commit -m "feat: add user profile export functionality"
git commit -m "fix: resolve memory leak in WebSocket connection"
git commit -m "docs: update API documentation for alerts endpoint"

# ❌ Avoid
git commit -m "fixes"
git commit -m "wip"
git commit -m "asdf"
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code restructuring (no functionality change)
- `perf:` - Performance improvements
- `test:` - Test additions or updates
- `chore:` - Build, CI, or dependency updates

## 🎯 Pull Request Process

### Before Submitting

1. **Sync with main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run tests**
   ```bash
   npm run check
   npm run verify
   ```

3. **Clean up commits**
   - Rebase to combine related commits
   - Keep history clean

### PR Description

Include:

- **What** - What changes are you making?
- **Why** - Why are these changes needed?
- **How** - How do the changes work?
- **Testing** - How did you test this?
- **Related Issues** - Closes #123

Template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
Describe how you tested this change

## Checklist
- [ ] Code follows style guidelines
- [ ] TypeScript compilation passes (`npm run check`)
- [ ] Changes tested locally
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] Commit messages are clear
```

## 🐛 Reporting Bugs

### Good Bug Report Includes

- **Description** - Clear summary
- **Steps to Reproduce** - Exact steps to reproduce
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Environment** - Node version, OS, browser (if applicable)
- **Screenshots** - If UI-related

### Example

```markdown
## Bug: Dashboard fails to load

### Steps to Reproduce
1. Login to app
2. Navigate to /dashboard
3. Wait for data to load

### Expected
Dashboard displays metrics and charts

### Actual
Blank page with 404 error

### Environment
- Node: 18.12.0
- OS: macOS 13.1
- Browser: Chrome 110
```

## 🎁 Suggesting Enhancements

### Good Feature Request Includes

- **Use Case** - Problem it solves
- **Proposed Solution** - How it should work
- **Alternatives** - Other approaches considered
- **Context** - Any additional information

## 📚 Documentation

### Code Comments

```typescript
// ✅ Good: Explains WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API
async function retryWithBackoff(fn: () => Promise<T>): Promise<T> {
  // ...
}

// ❌ Avoid: Obvious comments
// Initialize empty array
const items = [];
```

### JSDoc for Public APIs

```typescript
/**
 * Calculates user retention curve
 * @param workspaceId - The workspace identifier
 * @param days - Number of days to analyze (default: 30)
 * @returns Array of retention data points
 * @throws Error if workspace not found
 */
export function calculateRetention(
  workspaceId: string,
  days: number = 30
): RetentionData[] {
  // ...
}
```

## 🔍 Code Review Expectations

- All code must pass TypeScript checking
- All tests must pass
- Documentation must be updated
- Commits should be clean and well-organized
- Code should follow established patterns in the codebase

## 🚀 Release Process

Releases are managed by maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release with notes

## ❓ Questions or Issues?

- **Documentation**: Check [README.md](./README.md)
- **Setup Help**: See [SETUP.md](./SETUP.md)
- **Architecture**: Review [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- **Issues**: Open a GitHub issue

## 📞 Community

- **Discussions**: GitHub Discussions (when enabled)
- **Issues**: GitHub Issues for bugs and features
- **Security**: Report security issues responsibly

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ✨ Thank You!

We appreciate your contributions to making Quantora better for everyone!

---

**Questions?** Feel free to reach out or open an issue. Happy coding! 🎉
