# bcollie-modbot Devvit App

This is the Devvit replacement for the legacy BorderCollieBot Data API / PRAW moderation bot formerly run outside Reddit. It is currently being expanded so that it may be helpful to other dog breed subreddits as well, including moving lots of the breed-specific stuff into settings so that moderators can configure it for their own breed subreddits. If you want to install the app for your own subreddit but find that you need more configuration options, please reach out to the moderators of `r/bordercollie` or contact the developer directly.

## App Migration Program Note

This app is a migration of the legacy `BorderCollieBot` Reddit Data API automation to Reddit's Developer Platform.

- Legacy bot/app name replaced by this Devvit app: `BorderCollieBot`
- Legacy app type: Python `praw` bot / external Reddit Data API automation
- Legacy bot account: `u/BorderCollieBot`
- Primary target subreddit: `r/bordercollie`
- Migration status: Devvit app published and installed; legacy external bot stopped
- External fetch domains used by this migrated app:
  - `i.redd.it`
  - `preview.redd.it`
  - `external-preview.redd.it`
  - `redditmedia.com`
  - `www.redditmedia.com`

## Current Features

- **Breed ID auto-response**: Detects likely breed-identification posts, applies flair, and posts a sticky informational reply
- **Wrong undo flow**: Replying directly to the breed-ID auto reply with `wrong` removes it and clears the Breed ID flair. Explicit ID summons still work after an automatic reply is undone.
- **Summon commands**: Supports commands such as `!appearance`, `!vet`, and name suggestion commands. Public command documentation is available at [bcolliebot.github.io/bcolliebot/commands.html](https://bcolliebot.github.io/bcolliebot/commands.html).
- **Urgent rehoming moderation**: Detects urgent transfer/rehoming language and blocked crossposts for mod review or removal
- **Image metadata review**: Reports image posts whose metadata suggests AI generation or provenance markers
- **Low-score cleanup**: Scheduled cleanup for low-score bot comments

## Production Status

As of July 18, 2026:

- this Devvit app has replaced the legacy external bot `BorderCollieBot`
- the legacy bot process has been stopped
- live automation is intended to run through this Devvit app only

## Tech Stack

- [Devvit](https://developers.reddit.com/): Reddit's platform for building and deploying apps
- [Vite](https://vite.dev/): Fast build tool for the web components
- [Hono](https://hono.dev/): Lightweight web framework for backend logic
- [TypeScript](https://www.typescriptlang.org/): Type-safe development

## Getting Started

### Install the Existing App

1. Install `bcollie-modbot` from Reddit's app directory for your subreddit.
2. Review the subreddit install settings and adjust the response text, enabled features, thresholds, and blocked crosspost sources for your community.
3. Test the summon commands in a low-traffic or moderator-only thread before relying on them in normal community use.

### Make Your Own Version

1. Clone or fork this repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your app name, triggers, permissions, and settings in `devvit.json`.
4. Start developing:
   ```bash
   npm run dev
   ```
5. Test your changes in your development subreddit.
6. Deploy or publish your own Devvit app when ready.

## Project Structure

```text
src/
├── index.ts                  # Main server setup and route mounting
├── features/
│   ├── bot-settings.ts       # Shared subreddit settings readers
│   ├── breed-id/             # Breed-ID detection, responses, undo storage, triggers
│   ├── cleanup-negative-comments/
│   │   └── run.ts            # Scheduled cleanup for low-score bot comments
│   ├── image-metadata-review/
│   │   ├── detect.ts         # Image URL collection and metadata analysis
│   │   ├── settings.ts       # Image metadata review settings
│   │   ├── storage.ts        # Redis idempotency state
│   │   ├── text.ts           # Moderator report text
│   │   └── triggers.ts       # Post trigger handler
│   ├── summons/              # Comment command handling, names, responses, storage
│   └── urgent-rehoming/      # Urgent rehoming detection, settings, storage, triggers
└── routes/
    ├── tasks.ts              # Scheduled task endpoints
    └── triggers.ts           # App lifecycle/content trigger endpoints
```

## Project Notes

The active live behavior for this app is wired through:

- `src/features/breed-id/`
- `src/features/summons/`
- `src/features/urgent-rehoming/`
- `src/features/image-metadata-review/`
- `src/features/cleanup-negative-comments/`
- `src/routes/triggers.ts`
- `src/routes/tasks.ts`

## Configuration Overview

- **Install settings** are configured in `devvit.json` under `settings.subreddit`.
- **Triggers** are configured in `devvit.json` and handled in `src/routes/triggers.ts`.
- **Scheduled jobs** are configured in `devvit.json.scheduler.tasks` and handled in `src/routes/tasks.ts`.
- **Feature toggles** are checked inside each feature's `settings.ts`.

## Commands

- `npm run dev`: Starts development mode with live reload on your test subreddit
- `npm run build`: Builds your mod tool for production
- `npm run deploy`: Uploads a new version of your app to Reddit
- `npm run launch`: Publishes your app for review and public use
- `npm run login`: Authenticates your CLI with Reddit
- `npm run type-check`: Runs TypeScript type checking, linting, and formatting

## Development Notes

- **Permissions**: The app requires `redis: true`, Reddit API moderator scope, and approved image fetch domains in `devvit.json`.
- **Feature isolation**: Each active feature folder owns its own detection, storage, response text, and trigger behavior where practical.

## Deployment

1. Test thoroughly in your development subreddit
2. Run `npm run deploy` to upload your app
3. Use `npm run launch` to submit for Reddit's app review process
4. Once approved, users can install your mod tool from Reddit's app directory

This app is the active Devvit migration target for BorderCollieBot.
