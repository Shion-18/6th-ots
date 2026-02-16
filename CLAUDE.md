# CLAUDE.md

## Project Overview

**6th-ots** (オープンチームシート) is a client-side web application for Pokemon Gen 6 (XY/ORAS) competitive battling. It enables two players to share party (team) information via URL-encoded links under the "Open Team Sheet" rule format.

All UI text, Pokemon names, types, natures, and abilities are in **Japanese**. English names exist only as secondary fields (`nameEn`) in data.

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19, Tailwind CSS 4
- **Libraries**: html2canvas (image export), qrcode.react (QR codes)
- **Data storage**: Browser LocalStorage (no backend/database)
- **Sharing**: Base64-encoded party data in URL query parameters
- **Deployment target**: Vercel

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Homepage with navigation and sample party
  layout.tsx            # Root layout with metadata
  builder/page.tsx      # Party creation/editing
  my-teams/page.tsx     # Saved parties management
  view/page.tsx         # View opponent's party (read-only)

components/ui/          # React components (all 'use client')
  PokemonCard.tsx       # Full Pokemon display card
  CompactPokemonCard.tsx # Compact card for homepage
  PokemonCompactCard.tsx # Alternative compact display
  PokemonEditor.tsx     # Detailed editor (IV/EV/moves/ability/item)
  PokemonAutocomplete.tsx # Pokemon search/selection
  MoveAutocomplete.tsx  # Move search/selection
  TeamView.tsx          # Full party display
  TeamImageView.tsx     # Party as exportable image
  QRCodeDisplay.tsx     # QR code for sharing URLs
  TypeIcon.tsx          # Pokemon type badge with colors

lib/                    # Utility modules
  team-encoder.ts       # Base64 encode/decode for URL sharing
  stats.ts              # Stat calculation (base + IV + EV + nature)
  type-colors.ts        # Type color definitions
  image-generator.ts    # Team image export via html2canvas
  move-helpers.ts       # Move utility functions
  sample-team.ts        # Sample party data for homepage

hooks/                  # Custom React hooks
  useImageGenerator.ts  # Image generation hook

types/                  # TypeScript type definitions
  pokemon.ts            # Core types: Pokemon, Team, Move, Item, Stats, etc.

data/                   # Static JSON data (sourced from PokeAPI)
  gen6-pokemon.json     # Gen 6 Pokemon species
  all-pokemon.json      # All Pokemon species (~18K lines)
  pokemon-moves.json    # Move pools per Pokemon (~524K lines, large)
  items.json            # Holdable items

scripts/                # Data generation scripts (run with npx tsx)
  fetch-pokemon.ts      # Fetch Pokemon data from PokeAPI
  fetch-pokemon-moves.ts
  fetch-all-moves.ts
  fetch-mega-evolutions.ts
  fetch-form-change-pokemon.ts
  add-mega-moves.ts
  add-form-change-moves.ts
  update-*.ts           # Various data correction scripts
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint (next/core-web-vitals + next/typescript)
npx tsx scripts/<name>.ts  # Run data generation scripts
```

## Architecture

### Data Flow

1. Static JSON data files are bundled with the app at build time
2. Pokemon/move data is imported directly in components
3. Party data is stored in browser LocalStorage (one party per browser)
4. Sharing works via Base64-encoded JSON in URL query parameters
5. Stats are calculated in real-time from base stats + IV + EV + nature

### Key Patterns

- **Client-side only**: All pages use `'use client'` directive. No server-side data fetching or API routes.
- **URL-based sharing**: `lib/team-encoder.ts` handles encoding/decoding party data to/from Base64 for URL query params.
- **LocalStorage persistence**: Single party saved per browser. Import/override supported.
- **Component split**: Pages manage state and routing; `components/ui/` contains presentational components.
- **Path alias**: `@/*` maps to project root (e.g., `@/types/pokemon`, `@/lib/stats`).

### Core Types (types/pokemon.ts)

| Type | Description |
|------|-------------|
| `PokemonType` | 18 Pokemon types (Japanese names) |
| `Nature` | 25 natures (Japanese names) |
| `Gender` | `'オス' \| 'メス' \| '不明'` |
| `Move` | Move with id, name, type, category, power, accuracy, pp |
| `Item` | Held item with id, name, optional sprite |
| `BaseStats`, `IVs`, `EVs`, `Stats` | Stat interfaces (hp/atk/def/spa/spd/spe) |
| `PokemonSpecies` | Species data: dex number, name, types, base stats, abilities |
| `Pokemon` | Individual Pokemon instance in a party |
| `Team` | Full party: name, Pokemon array, timestamps, format |
| `EncodedTeam` | Serialized party for URL sharing |

## Configuration

### TypeScript (tsconfig.json)
- Target: ES2017, strict mode enabled
- Module resolution: bundler
- Path alias: `@/*` -> `./`

### Next.js (next.config.ts)
- Remote image patterns allowed for `raw.githubusercontent.com/PokeAPI/sprites/**`

### ESLint (eslint.config.mjs)
- Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Development Notes

- **No test framework** is configured. Verification has been done manually (see VERIFICATION_REPORT.md).
- **No CI/CD** pipeline. Deployment is via Vercel.
- **Large data files**: `pokemon-moves.json` is ~524K lines. Avoid reading it entirely; filter or stream as needed.
- **Japanese localization**: All user-facing strings are Japanese. When adding UI text, use Japanese.
- **Pokemon sprites**: Loaded from PokeAPI GitHub raw URLs via Next.js Image component with configured remote patterns.
- **EV constraint**: Total EVs capped at 510, individual stat max 252. This is enforced in the editor component.
- **IV range**: 0-31 per stat.
- **Level cap**: 50 (enforced in builder).
