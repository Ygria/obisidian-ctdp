# Obsidian TailwindCSS Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md). It adds the following setup on top the [Obsidian Sample Project](https://github.com/obsidianmd/obsidian-sample-plugin)

-   React
-   TailwindCSS
-   Vite (replace esbuild)

TailwindCSS is pre-configured to use the [Obsidian CSS tokens](https://docs.obsidian.md/Reference/CSS+variables/CSS+variables). The preflight is turned off due to conflict with Obsidian's default styles.

## How to use

-   Clone this repo.
-   Make sure your NodeJS is at least v20 (`node --version`).
-   `npm i` or `yarn` to install dependencies.
-   `npm run dev` to start compilation in watch mode.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
