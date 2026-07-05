# TTM — Talk To Me

A responsive React frontend for the TTM social platform.

## Run locally

```bash
cd Front
copy .env.example .env
npm install
npm run dev
```

The frontend defaults to `http://localhost:5555` for the API. Override it with:

```env
VITE_API_URL=http://localhost:5555
```

## Useful commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

The **Explore the demo** action on the login page opens a local portfolio demo without requiring a running API or seeded database. Real login and registration always use the backend.

See [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) for architecture, routes, API contracts, and documented backend constraints.
