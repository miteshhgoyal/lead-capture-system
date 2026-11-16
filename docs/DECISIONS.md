# Decisions

1. Ranking is always by profit % (spec). The competition `rankBy` / `displayMode` settings are kept in the DB but ignored; the Schedule tab shows a note instead of the two selects.
2. `calculateProfitRanks` keeps its first three arguments (existing callers/tests); the 4th argument is now `{ windowStart }` instead of `rankBy`.
3. The starting deposit and raw values (net profit, deposit) are never put on public rows; they live in `internalsByLogin` (sync maintenance + CSV only).
4. Starting deposit is frozen by the sync (after a completed run) for accounts whose live-derived value is > 0; a stored value only counts when `startingDepositWindowStart` equals the current window start.
5. Rank movement: the sync writes `previousRank` / `currentRank` only when the rank changes; the board shows `previousRank - rank`. If the live rank differs from the stored rank (e.g. an admin hid an account), the stored rank is treated as the previous one.
6. Dummy display layer: merged with the same %-first order; the rank-1 dummy is also lifted on the % metric so the "rank 1 is a display entry" rule still holds.
7. `updatedAt` is kept for old consumers but now equals `lastSyncedAt` or "" (never "now").
8. Total Trades counter on the page also counts closing deals only, so it matches the per-trader counts.
9. Default Open account link: `openAccount.defaultUrl` (https only). If empty, the legacy Competition -> Buttons URL is used as a fallback so existing sites keep working; the admin warning still shows.
10. Open account always opens in a new tab with `rel="noopener noreferrer"`; the old "open in new tab" switch was removed from Competition -> Buttons. Without any URL the button renders disabled (never hidden). The mobile sticky bar no longer hides it for signed-in users.
11. Referral resolution happens once per page load (shared store) and is reused by every Open account button. An invalid URL `?ref=` falls back to the stored code, then the default.
12. Click counting: `POST /api/open-account/click` is sent (keepalive fetch) only when the button resolved through an active referral code.
13. Toggle route: `POST /api/admin/referrals/[id]/toggle`; update / delete on `PATCH` / `DELETE /api/admin/referrals/[id]`; default on `GET/PUT /api/admin/referrals/default`.
14. Info line: the API returns the raw text with `{min_deposit}`; the client renders it. When the admin disables it, the line under the leaderboard title is hidden and the standings note box shows the fixed fallback text.
15. The `PhaseStatus` badge in the hero shows the competition phase (not data freshness) and keeps its own dot; every data-freshness dot (top 3, overview pill, leaderboard) uses `useBoardFreshness`.
16. Equity chart: new `fogm_equity_history` collection (one point per run, newest 500) instead of reviving the 90-day per-account snapshots.
17. Admin nav: `isCurrent` now matches whole path segments so `/admin/leaderboard-settings` does not also highlight "FOGM Users".
18. Files that only had CRLF line-ending changes in the working tree were rewritten with LF (as in HEAD) where they were edited.
19. Stored FAQ / steps copy in the database (if an admin saved it before) is not rewritten; only the defaults now say "profit percentage".
