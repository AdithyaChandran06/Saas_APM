# @saas-apm/apm-sdk

Client-side SDK for sending product telemetry to the SaaS APM backend.

## Install

npm install @saas-apm/apm-sdk

## Usage

```ts
import { createAPMClient } from "@saas-apm/apm-sdk";

const apm = createAPMClient({
  apiKey: "pk_live_xxx",
  endpoint: "https://your-apm-host.com",
  enableAutoPageTracking: true,
  enableAutoErrorTracking: true,
  enableAutoPerformanceTracking: true,
});

apm.trackEvent("feature_used", { feature: "export" });
apm.trackError(new Error("Something failed"));
```

## Publish

1. cd packages/apm-sdk
2. npm publish --access public
