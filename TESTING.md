# Testing Guide

## Overview

Quantora includes a comprehensive test suite to ensure reliability of core services. Tests are written with **Vitest** for fast, modern testing.

## Setup

The test suite is already configured. Just install dependencies:

```bash
npm install
```

## Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current test coverage includes:

### ✅ Alert Evaluator Service (`alert-evaluator.test.ts`)
- **Purpose**: Tests alert condition evaluation logic
- **Tests**: 
  - Threshold detection (greater_than, less_than, equals)
  - All metric types (error_rate, latency_p95, latency_p99, error_count, status_5xx)
  - Edge cases and unknown conditions

### ✅ Email Service (`email-service.test.ts`)
- **Purpose**: Tests email token generation and verification
- **Tests**:
  - Token generation (uniqueness, validity)
  - Verification token creation and verification
  - Password reset token creation and expiration
  - Token consumption and cleanup
  - Link generation

### ✅ Notification Service (`notification-service.test.ts`)
- **Purpose**: Tests notification delivery via Slack and webhooks
- **Tests**:
  - Slack notification formatting
  - Webhook payload structure
  - Metadata inclusion
  - Error handling

### ✅ Sentiment Analysis Service (`sentiment-analysis.test.ts`)
- **Purpose**: Tests feedback sentiment detection
- **Tests**:
  - Positive sentiment detection
  - Negative sentiment detection
  - Neutral sentiment
  - Case insensitivity
  - Intensifier handling (very, absolutely)
  - Mixed sentiments

## Test File Locations

All tests are co-located with their services:

```
server/services/
├── alert-evaluator.ts
├── alert-evaluator.test.ts      ← Tests
├── email-service.ts
├── email-service.test.ts        ← Tests
├── notification-service.ts
├── notification-service.test.ts ← Tests
├── sentiment-analysis.ts
├── sentiment-analysis.test.ts   ← Tests
└── ...
```

## Writing New Tests

### Test File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Keep next to source file

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { functionToTest } from "../path/to/module";

describe("Module Name", () => {
  describe("Function Name", () => {
    it("should do something specific", () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    it("should handle edge case", () => {
      const result = functionToTest(edgeCase);
      expect(result).toBe(edgeExpected);
    });
  });
});
```

### Best Practices

1. **Test one thing per test**
   ```typescript
   // ✅ Good
   it("should detect error rate above threshold", () => {
     expect(isAlertTriggered("greater_than", 5, "error_rate", metrics)).toBe(true);
   });

   // ❌ Avoid
   it("should work correctly", () => {
     expect(isAlertTriggered(...)).toBe(...);
     expect(someOtherThing(...)).toBe(...);
   });
   ```

2. **Use descriptive names**
   ```typescript
   // ✅ Good
   it("should return null for expired verification token", () => {
     // ...
   });

   // ❌ Avoid
   it("tests token", () => {
     // ...
   });
   ```

3. **Use setup/teardown when needed**
   ```typescript
   beforeEach(() => {
     // Reset state before each test
     emailTokens.clear();
   });

   afterEach(() => {
     // Cleanup after each test
     vi.clearAllMocks();
   });
   ```

4. **Mock external dependencies**
   ```typescript
   import { vi } from "vitest";

   const mockFetch = vi.fn().mockResolvedValue({ ok: true });
   global.fetch = mockFetch;

   // Test...

   expect(mockFetch).toHaveBeenCalledWith(url);
   ```

## Debugging Tests

### Run specific test file
```bash
npm run test alert-evaluator
```

### Run tests matching pattern
```bash
npm run test -- --grep "should detect"
```

### Run with UI
```bash
npm run test -- --ui
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Coverage Goals

Target coverage metrics:

- **Services**: 80%+ coverage
- **Critical paths**: 100% coverage
- **Utilities**: 70%+ coverage

Current coverage: Run `npm run test:coverage` to see detailed report.

## Continuous Integration

Tests run as part of the build verification:

```bash
npm run verify
```

This runs:
1. TypeScript check (`npm run check`)
2. Tests (`npm run test:run`)
3. SDK build (`npm run sdk:build`)
4. Production build (`npm run build`)

## Adding Tests for New Features

When adding new services:

1. Create `service-name.ts` with implementation
2. Create `service-name.test.ts` with tests
3. Aim for 80%+ coverage
4. Ensure `npm run verify` passes
5. Update this document

## Test Dependencies

- **vitest**: Modern, fast test framework
- **@vitest/ui**: Visual test dashboard
- **@vitest/coverage-v8**: Code coverage reports

## Troubleshooting

### Tests timeout
- Increase timeout: `it("test", async () => {...}, 10000)`
- Check for infinite loops or unresolved promises

### Mock not working
- Ensure mock is set before import
- Use `vi.mock()` for module mocking
- Check mock implementation

### Snapshots failing
- Review changes: `npm run test -- -u` to update
- Commit snapshot changes with code review

## Resources

- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Happy testing! 🧪**
