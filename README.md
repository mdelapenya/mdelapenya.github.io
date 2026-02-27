# mdelapenya.xyz

GoHugo site for my personal website, which is a blog and a portfolio.

## Development

To start the development server, run:

```bash
hugo server
```

This will start the server at `http://localhost:1313`.

To generate the static site, run:

```bash
hugo build
```

This will generate the static site in the `public` directory.

## Testing

Playwright E2E tests live in `tests/` and run inside a Docker container against the Hugo dev server.

```bash
make serve  # start Hugo dev server
make test   # run E2E tests
```

Tests must pass before deployment — the GitHub Actions workflow gates the deploy job on the `test` job.

## Deployment

The site is deployed to GitHub Pages, using a GitHub Action that is triggered when a commit is pushed to the `main` branch.
