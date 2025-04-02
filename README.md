# Emobi Take Home Assignment

## Contents

1. [Prerequisites](#Prerequisites)
2. [Getting Started](#Getting-Started)
3. [Testing](#Testing)
4. [Deployment](#Deployment)
5. [Design & Assumptions]('#Design-&-Assumptions')
6. [Improvements](#Improvements)

## Prerequisites

- Node 22
- Redis

## Getting Started

1. Clone repository locally
2. Run `npm install`
3. Launch Redis ``
4. Run `npm start` to launch the server

## Testing

Tests are built using Jest. To run, use `npm test`.

## Deployment

TBD

## Design & Assumptions

- Code is broken down into 3 files:
  - app.js - endpoint handling
  - reports.js - everything related to reports, currently contains a stub for generateReport
  - eventQueue.js - everything related to event queue - initialization, process worker, and event listeners. Structured as a dependancy, so that it can be easily swapped for a different implementation using another module/library.
- Using `uuid` module to create unique IDs for reports. Unique report ID also used as a job ID in the event queue, so it's easier to match and check status or cancel.
- Run cron job using `Date` object to make sure it only runs once.
- Input `time` is a UNIX timestamp for simplicity.
- `time` is always in the future.
- TDD approach - tests were written first to make sure any new changes are reflected accordingly and there are no regressions.
- Included linter & prettier to make minimize bugs and
- Main branch set to `dev` to avoid accidental pushes to `main`, since `main` would be used for automatic deployments to prod.

## Further considerations & Improvements

- Auth protection for the API (access / refresh tokens)
- More extensive testing. Unit tests for `generateReport` function.
- Using TypeScript, for more robust type setting and less bugs
- Use Husky to run prettifier, linter & tests before committing
- Use Github actions/CI to run prettifier, linter, tests after committing
- Can use built in `delay` option in Bullmq instead of cron - might not be exact time though, but avoids an additional dependancy and allows for easier cancellation of the job.
- Different input types for time (e.g. date string, ms), would also require validation
- Catch if `time` is in the past
- Endpoints could be further modularized into their own files
