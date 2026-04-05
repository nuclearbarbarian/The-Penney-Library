# The Penney Library

Personal reading tracker and reflection tool.

## Architecture
- Static site (HTML/CSS/JS, no build step, no framework)
- All data lives in JSON files committed to the repo
- Data entry happens via Claude Code (paste reading lists, Claude parses and writes to books.json)
- Reflections are created via the `/reflect` Claude Code skill, stored in reflections.json
- The web app is a read-only display layer: library table, trend charts, reflection archive
- Hosted on GitHub Pages (public repo)

## Data
- `data/books.json` — flat array of book objects
- `data/reflections.json` — keyed by year, stores Ignatian reflections

## Design
- Styled per the Penney Design System (1940s trade journal aesthetic)
- Newsprint background, Source Serif Pro / IBM Plex Mono typography
- Monochrome-first, spot color for emphasis only
- No animation libraries, no tooltip frameworks, no build dependencies

## Genre Taxonomy
Fiction, Nonfiction, Philosophy, History, Poetry, Drama, Graphic Novel, Science,
Political Theory, Religion/Theology, Economics, Memoir, Technical
