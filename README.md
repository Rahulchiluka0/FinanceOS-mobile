# FinanceOS Mobile

React Native (Expo) client for FinanceOS. Mirrors the web app in `../client` against the same Express API in `../server`.

## Stack

- Expo SDK 57 + TypeScript + Expo Router
- NativeWind + design tokens from the web app (`#1A56DB` brand)
- React Hook Form + Zod
- TanStack Query (provider ready) + shared Auth/Data contexts
- Axios-compatible fetch wrapper (same REST contracts as web)
- Expo Secure Store (JWT), Haptics, Biometrics, Camera, Document picker, Notifications

## Setup

```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env
```

Point `EXPO_PUBLIC_API_URL` at your running API:

| Environment        | Example URL                              |
|--------------------|------------------------------------------|
| iOS simulator      | `http://localhost:5000/api/v1`           |
| Android emulator   | `http://10.0.2.2:5000/api/v1`            |
| Physical device    | `http://<your-lan-ip>:5000/api/v1`       |

Start the API (`../server`) first, then:

```bash
npm start
# or
npm run android
npm run ios
```

Demo login (same as web): `aarav@example.com` / `demo1234`

## Architecture

```
app/                 Expo Router screens
  (auth)/            Login, register, forgot/reset password
  (app)/(tabs)/      Dashboard, Transactions, Accounts, AI, More
  (app)/*.tsx        Stack screens (budgets, goals, reports, …)
src/
  api/               Port of client/src/api (same endpoints)
  context/           AuthContext + DataContext (web parity)
  components/        UI, brand, charts
  theme/             CSS variable → RN tokens
  validation/        Zod schemas
  hooks/             Biometrics, debounce
```

Navigation mirrors the web sidebar:

- **Tabs:** Home · Transactions · Accounts · AI · More
- **More stack:** Categories, Budgets, Goals, Recurring, Bills, Calendar, Loans, Investments, Subscriptions, Currencies, Reports, Insights, Tags, Search, Notifications, Import/Export, Settings

## Mobile extras (additive)

- Pull-to-refresh on list screens
- Haptic feedback on primary actions
- Biometric unlock toggle (Settings)
- Receipt camera capture on transactions
- Document picker + share for import/export
- Local/push notification registration
- Deep link scheme: `financeos://` (e.g. `financeos://reset-password?token=…`)

## Backend notes

- Do **not** change API contracts; this app consumes `/api/v1` exactly like the web client.
- CORS: React Native requests typically omit `Origin`. If you hit CORS issues from Expo web, set `CLIENT_ORIGIN` on the server accordingly.
- Password reset deep links: map `financeos://reset-password` to `/(auth)/reset-password`.

## Scripts

| Command            | Description              |
|--------------------|--------------------------|
| `npm start`        | Expo dev server          |
| `npm run android`  | Open Android             |
| `npm run ios`      | Open iOS simulator       |
| `npm run typecheck`| TypeScript check         |
