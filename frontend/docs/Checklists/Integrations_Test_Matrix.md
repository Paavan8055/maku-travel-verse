# Integrations Test Matrix (Hotelbeds/Amadeus)

- Happy Paths
  - [ ] Search → select → price confirm → book for hotels and flights
- Edge Cases
  - [ ] 0 results; partial results; API 429/5xx
  - [ ] Timeout; slow response > 10s; malformed payload
  - [ ] Currency mismatch; unavailable inventory after selection
- Validation
  - [ ] Response schema validated (zod) before UI render
  - [ ] Prices/taxes/fees reconciliation logic
- Resilience
  - [ ] Exponential backoff with jitter; limited retries; circuit breaker
  - [ ] Graceful user-facing error messages + fallback suggestions
- Observability
  - [ ] Correlation ID from FE → Edge → Supplier; structured logs
  - [ ] Metrics on success rate, latency, retry count
