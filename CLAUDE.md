# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server (shows QR code for Expo Go)
npm start

# Start directly on a platform
npm run android
npm run ios
npm run web
```

There are no tests or linters configured.

## Architecture

The app uses **React Navigation** with two navigators nested:

- `Stack.Navigator` (root) — defined in [App.tsx](App.tsx)
  - `Tabs` → renders `TabNavigator` (bottom tabs)
  - `DetalheReceita` → renders `RecipeDetailScreen` (full-screen, no header)

- `Tab.Navigator` (bottom tabs, inside `TabNavigator`)
  - `Início` → `HomeScreen`
  - `Perfil` → `ProfileScreen`

Route types (`RootStackParamList`, `TabParamList`) are exported from `App.tsx` and imported by screens that need typed navigation props.

## Data layer

All data comes from **Supabase**. The client is initialised in [lib/supabase.ts](lib/supabase.ts) with `AsyncStorage` for session persistence. There is no local state management library — screens query Supabase directly.

Key tables/shapes (see [types/index.ts](types/index.ts)):
- `receitas` — recipes; `ingredientes` field is a JSONB array of `{ ingrediente_id, quantity }` objects
- `ingredientes` — ingredient catalogue
- `user_favoritos` — join table for saved recipes
- `users` — users information
Where's the tables structure:
- `receitas` 
| column_name    | data_type                | is_nullable |
| -------------- | ------------------------ | ----------- |
| id             | uuid                     | NO          |
| nome           | character varying        | NO          |
| imagem_url     | text                     | YES         |
| prep_tempo_min | integer                  | NO          |
| dieta_type     | character varying        | YES         |
| ingredientes   | jsonb                    | NO          |
| instrucoes     | jsonb                    | NO          |
| calorias       | numeric                  | YES         |
| proteinas_g    | numeric                  | YES         |
| carbs_g        | numeric                  | YES         |
| fats_g         | numeric                  | YES         |
| data_criacao   | timestamp with time zone | YES         |
| data_update    | timestamp with time zone | YES         |
- `ingredientes`
| column_name | data_type         | is_nullable |
| ----------- | ----------------- | ----------- |
| id          | uuid              | NO          |
| nome        | character varying | NO          |
| imagem_url  | text              | YES         |
- `user_favoritos`
| column_name | data_type                | is_nullable |
| ----------- | ------------------------ | ----------- |
| user_id     | uuid                     | NO          |
| receitas_id | uuid                     | NO          |
| saved_at    | timestamp with time zone | YES         |
- `users`
| column_name                 | data_type                | is_nullable |
| --------------------------- | ------------------------ | ----------- |
| id                          | uuid                     | NO          |
| email                       | character varying        | NO          |
| password_hash               | character varying        | NO          |
| display_name                | character varying        | YES         |
| created_at                  | timestamp with time zone | YES         |
| updated_at                  | timestamp with time zone | YES         |


## Ingredient search

`HomeScreen` supports two search modes:
1. **By name** — `ilike` query on `receitas.nome`
2. **By ingredients** — user builds a tag list; each tag resolves to an `ingrediente.id` and the query chains `.filter('ingredientes', 'cs', ...)` for each ID to find recipes containing all of them

## Styling conventions

- Each file declares a local `cores` constant (`verde: '#37914B'`, `laranja: '#FA9B2D'`, `branco: '#FFFFFF'`, `bege: '#F5F0E1'`) — these are not shared via a theme file.
- Styles use `StyleSheet.create` at the bottom of each file.
- The bottom tab bar is styled inline in `App.tsx` (rounded top corners, white background, floating with absolute positioning).
