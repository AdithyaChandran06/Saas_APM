# @quantora/sdk

Client-side SDK for sending product telemetry to Quantora.

## Install

npm install @quantora/sdk

## Usage

```ts
import { createAPMClient } from "@quantora/sdk";

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
