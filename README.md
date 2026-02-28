# Auction API

A property auction game API where you bid against three CPU opponents across 10 rounds. Each player starts with 1,000 currency. Highest bidder wins each property. Most properties at the end wins.

## Install

```
npm install
```

## Run

```
npm start
```

Server starts on `http://localhost:3000`. Use `npm run dev` for auto-restart on file changes.

## Test

```
npm test
```

## API Endpoints

### `GET /`
Health check. Returns `{ "status": "ok" }`.

### `POST /games`
Create a new game. Returns `201` with `{ gameId, game }`.

### `GET /games/:id`
Get current game state. Returns `404` if not found.

### `POST /games/:id/bid`
Place a bid for the current round.

**Body:** `{ "amount": 150 }`

Resolves the round immediately: generates CPU bids, determines winner, advances to next round. Returns the round result and updated game state.

| Status | Meaning |
|--------|---------|
| 200 | Round resolved |
| 400 | Invalid bid (missing, not a positive integer, exceeds currency) |
| 404 | Game not found |
| 409 | Game completed or round already resolved |

### `GET /games/:id/results`
Final scoreboard. Only available after all 10 rounds.

| Status | Meaning |
|--------|---------|
| 200 | Results returned |
| 404 | Game not found |
| 409 | Game still in progress |

## CPU Bidders

**Market Mike** — Anchors to the previous round's winning bid plus 5-15%. Opens round 1 at 15. Steady and predictable.

**Chaos Cleo** — Coin flip each round: heads = 40-50% of remaining currency, tails = 5-10%. No middle ground. Dangerous and self-destructive.

**Analytical Ada** — Divides remaining currency evenly across remaining rounds, with +/- 20% variance. Bids 30% more aggressively when behind by 3+ properties. The adaptive strategist.

## Bruno Collection

Open the `bruno/auction-api` folder in [Bruno](https://www.usebruno.com/) to test the API interactively. Select the "local" environment. Run requests in order: Create Game, Place Bid (x10), Get Results.

## Properties

| Round | Property |
|-------|----------|
| 1 | The Rusty Spoon Diner |
| 2 | Sunset Pier Bungalow |
| 3 | Haunted Victorian on Elm |
| 4 | Downtown Parking Garage |
| 5 | Abandoned Mall (with food court) |
| 6 | Cliffside Lighthouse |
| 7 | Penthouse Above the Taco Shop |
| 8 | Swamp Adjacent Golf Course |
| 9 | The Volcano View Estate |
| 10 | Secret Underground Bunker |
