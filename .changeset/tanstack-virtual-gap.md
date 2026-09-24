---
'kaskaid': minor
---

**Breaking:** require `@tanstack/react-virtual >=3.14.6`. Upgrade the peer dependency to use the upstream reactive-gap fix and multi-lane placement optimization.

Remove the gutter-change remeasurement workaround from `useMasonry`; changing `gutter` now updates positions while preserving measured item sizes.
