# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.12.7 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:auto" devtools-json --install npm NAA-Software-Analyst-v2/
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Azure Cosmos DB (Optional)

This project includes a small server-side helper to read from an Azure Cosmos DB container.

### 1) Set your environment variables

Copy `.env.example` to `.env` and fill in your Cosmos DB values:

```sh
cp .env.example .env
# then edit .env with your values
```

When deployed, set the same environment variables in your hosting provider (e.g. Azure Static Web Apps or your server).

On Azure Static Web Apps, our API is exposed via an Azure Functions endpoint at `/api/cosmos` (from `api/cosmos`).

### 2) Query the API endpoint

A simple API endpoint is exposed at:

```
GET /api/cosmos
```

It returns items from the configured container. You can also request a specific item by id:

```
GET /api/cosmos?id=<itemId>&pk=<partitionKey>
```

