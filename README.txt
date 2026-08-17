FEDERAL MOTION — ALPHA 0.3 UI UPDATE

PUBLIC PLAYER FEATURES
- Full visual HUD redesign
- Health / XP / Respect / Heat meters
- Gritty street + trap-phone UI style
- Redesigned burner-to-premium phone interface
- Larger visual menu cards
- Rebuilt job cards with success %, payout, danger color, time, heat, weapon tier, crew and location
- Improved alerts, mobile spacing, panel styling and progression visibility
- Existing Alpha 0.2 gameplay and cloud systems retained

DEPLOYMENT
1. Run Alpha03-Database-Update.sql in Supabase.
2. Test index.html locally.
3. Upload index.html, app.js, styles.css and README.txt to FederalMotion-Web.

SECURITY
Never place a Supabase secret/service-role key in these public files.

ALPHA 0.3 BALANCE UPDATE
- Slower early-game cash growth.
- Repeated moves become less profitable and more dangerous.
- High heat has stronger consequences.
- Jail and hospital penalties increased.

ALPHA 0.4 — CITY LIFE UPDATE
- Added a protected Cash Reserve.
- Added daily bills/upkeep for owned lifestyle assets.
- Added passive property income.
- Added unpaid bills that carry forward.
- Added random end-of-day city events.
- Added a full Player Profile with career records and economy stats.
- Existing Alpha 0.3 balance changes remain active.

ALPHA 0.4 — PREP & RISK CLARITY PATCH
- Over-preparation bonuses: extra crew and stronger weapon tiers can improve success odds.
- Success chance is still capped at 95%, so no move is guaranteed.
- Job cards now explain why the displayed odds are what they are.
- Dangerous moves now show a confirmation warning before the player commits.
- Warning screens show carried cash/gear and other possible consequences.
- Rare failures at very high success odds are labeled clearly.

ALPHA 0.4 — CREW BALANCE FIX
- Crew payout sharing has been rebalanced so bringing extra help does not consume nearly the entire score.
- Extra preparation still improves success odds.
