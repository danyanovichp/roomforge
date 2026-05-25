# RoomForge

RoomForge is a browser-based interior planning demo for fast layout exploration, furniture swapping, and presentation-ready review.

![RoomForge demo](./public/docs/roomforge-demo.png)

## Why this project exists

Most room planners force a tradeoff between technical floor-plan editing and visual presentation. RoomForge exists to collapse that gap into one workflow:

- build quickly on a 1:1 meter grid
- evaluate the same project in 2D and isometric
- replace furniture variants without leaving the scene

## Features

- `Apartment / House` project types
- ready-made templates for `Studio`, `1-Bedroom`, `2-Bedroom`, `House 80 m²`, `House 120 m²`, `Office`, `Bedroom`, and `Kitchen-Living Room`
- shared planner state across `2D` and `Isometric`
- categorized furniture library with five variants per item tier: `Compact`, `Standard`, `Premium`, `Minimal`, `Statement`
- right-side inspector with selection details, color changes, replacement options, duplication, locking, rotation, and deletion
- room/floor navigator with quick jump cards and per-room validation status
- searchable furniture library with room-aware recommendations and one-click placement
- explicit wall actions for adding adjacent rooms, doors, and windows
- AI-powered layout generation from a natural-language brief by pasting an OpenAI API key into the app
- presentation controls for theme, style preset, and lighting scenario
- drag-and-drop placement in the 2D planner
- live layout validation checks with room jump actions and overlap detection

## Modes

- `2D`: primary planning mode with a meter grid, room resizing, room movement, and item placement
- `Isometric`: cutaway presentation mode for polished layout review

## Planner workflow

1. Pick an apartment template, floor, and view from the left rail.
2. Use `Plan navigator` to jump between rooms and spot issues without hunting through the canvas.
3. Add items from the searchable `Furniture library`; new items are suggested into clear positions inside the active room.
4. Use the right inspector to refine colors, variants, locking, and validation fixes.
5. Select a wall and use the wall action card to add an adjacent room or author a door/window with explicit width and offset.
6. Or open `AI layout`, paste an OpenAI API key, describe the apartment you want, and generate a fresh concept directly into the planner.

## AI layout generation

- open the `AI layout` panel in the left rail
- paste your OpenAI API key
- optionally enable `Remember key on this device` if you want the key saved in browser local storage on that machine
- describe the target apartment in plain language, for example: `2-bedroom apartment around 65 m² with kitchen-living room, home office nook, warm neutral style`
- click `Generate layout` to replace the current project with an AI-generated floor plan and starter furniture arrangement

The AI request is sent directly from the browser to OpenAI's Responses API, and the generated result is converted into RoomForge's internal project format inside the app.

## Templates

- Studio
- 1-Bedroom
- 2-Bedroom
- House 80 m²
- House 120 m²
- Office
- Bedroom
- Kitchen-Living Room

## Styles

- Minimal
- Scandinavian
- Japandi
- Loft
- Warm Neutral
- Modern Classic

## Lighting

- Day
- Evening
- Warm Light
- Cool Light
- Night

## How to run

```bash
npx roomforge
```

`npx roomforge` is the recommended user-facing entrypoint. It will:

- download the published RoomForge package from npm
- start a local server for the built demo
- pick an available port automatically
- open RoomForge in your default browser

You only need `Node.js` and `npm` installed locally.

Useful options:

```bash
npx roomforge --port 4173
npx roomforge --host 0.0.0.0
npx roomforge --no-open
```

## Develop locally

For contributors working from a cloned repository, use:

```bash
npm start
```

`npm start` is the recommended local development entrypoint. It will:

- install dependencies automatically if they are missing
- start the Vite dev server
- wait until the app is reachable
- open RoomForge in your default browser

Advanced developer-only flow:

```bash
npm run setup
npm run dev
```

Build for production:

```bash
npm run build
```

## Release workflow

- `CI` runs on every push to `main` and every pull request
- it installs dependencies, builds the app, packs the npm tarball, installs it into a clean temp directory, and smoke-tests the packaged `roomforge` CLI
- `Publish` runs on GitHub Release publish or manual dispatch and executes `npm publish --access public --provenance`

Before using the publish workflow, add an `NPM_TOKEN` repository secret with publish access to the `roomforge` package.

## Demo deployment

The project is Vite-based and ready for Vercel deployment. The included [`vercel.json`](./vercel.json) routes all requests to the SPA entry.

## How to contribute

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup, scope guidance, and contribution expectations.

## Good first issue

- support editing and deleting existing wall openings
- split heavy scene bundles with dynamic imports
- add dedicated Playwright coverage for both 2D and isometric modes
- extend validation from warnings into suggested fix previews

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Support

- [Support the project](https://github.com/sponsors)
- [Crypto support](https://commerce.coinbase.com/)
