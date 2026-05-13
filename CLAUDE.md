# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # start dev server (Expo Go / web)
npx expo start --android
npx expo start --ios
npx expo start --web
```

There are no test or lint commands configured.

## Architecture

**Komikalate** is a React Native (Expo) recipe app backed by Supabase.

### Navigation (`App.tsx`)

All route types are defined in `RootStackParamList` and `TabParamList` in `App.tsx`. The root `Stack.Navigator` renders three exclusive branches based on auth state:

- **Password recovery** (deep-link PKCE flow) → `RecuperarPasswordScreen`
- **Authenticated** → `TabNavigator` (Início + Perfil tabs) + stack screens
- **Guest** → `InicialScreen` → Login/Registo + same stack screens

Auth state comes from `supabase.auth.onAuthStateChange`. Deep links are handled via `Linking` + `exchangeCodeForSession`.

### Supabase (`lib/supabase.ts`)

Single client export using PKCE flow with AsyncStorage persistence. The URL and anon key are hardcoded (public anon key, safe to commit).

Key tables: `receitas`, `ingredientes`, `users`, user_favoritos (implied). `receitas.ingredientes` is a JSONB column storing `ReceitaIngrediente[]`.

### AI layer (`lib/ia.ts`)

Thin wrapper over two Supabase Edge Functions. All AI calls go through `supabase.functions.invoke()` — the Gemini API key never touches the client. Responses are validated with Zod schemas before returning. The two functions:

- `sugerir-receitas` — given a list of ingredients, returns 1-2 recipe suggestions
- `gerar-variacao` — given an existing recipe + `TipoVariacao`, returns an adapted recipe

Edge functions live in `supabase/functions/` and run on Deno. They are excluded from the TypeScript config (`tsconfig.json` excludes `supabase/functions`). To deploy: `supabase functions deploy <name>`. The `GEMINI_API_KEY` secret must be set in the Supabase dashboard (Project Settings → Edge Functions → Secrets).

### Shared types (`types/index.ts`)

All domain types: `Receita`, `Ingrediente`, `ReceitaIngrediente`, `Instrucao`, `User`, `UserFavorito`. Import as `import { Receita } from '../../types'`.

### Components and structure

```
App.tsx              — navigator root, RootStackParamList, auth logic
index.ts             — Expo entry point
lib/
  supabase.ts        — Supabase client
  ia.ts              — AI functions + Zod schemas
types/index.ts       — shared domain types
src/
  screens/           — one file per screen
  animacoes/         — AnimatedInput (floating-label, shake-on-error)
  hooks/             — useShakeAnimation
componentes/         — BarraPesq, BotaoFav, ReceitaCard (shared UI)
supabase/functions/  — Edge Functions (Deno, excluded from tsc)
```

### Conventions

- Each screen receives typed `navigation` / `route` props using `NativeStackNavigationProp<RootStackParamList, 'RouteName'>`.
- Brand colors (`verde: '#37914B'`, `laranja: '#FA9B2D'`, `bege: '#FFF1CE'`) are redeclared locally in each screen as a `cores` constant.
- Animations use the RN `Animated` API with `useNativeDriver: true` where possible; stagger pattern is used for list cards.
- All UI text is in European Portuguese.
