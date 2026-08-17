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

ALPHA 0.5 — CREWS & TERRITORY
- Create or join online player crews (10-member cap).
- Public and invite-only crew options.
- Crew ranks: Boss, Underboss, Lieutenant, Member.
- Shared crew bank and crew reputation.
- Six NPC-controlled city territories.
- Territory battles build influence until a crew takes control.
- Controlled zones grant gameplay bonuses.
- Former NPC gangs build retake pressure and can challenge control later.
- Hold rewards unlock at 2, 4 and 6 real-world days.
- Signature product rewards and visible rare weapon-drop odds.
- Territory battle cooldowns keep zone control from being spammed.

PUBLIC CHANGELOG SYSTEM
- In-game Patch Notes now keep a versioned history instead of one hard-coded release.
- Latest public changes appear first while older public notes remain visible.
- Current changelog covers Alpha 0.3 UI, Alpha 0.3 balance/consequences, Alpha 0.4 City Life, Alpha 0.4 Prep & Risk, crew balance fixes, and Alpha 0.5 Crews & Territory.

ALPHA 0.5 — EMPLOYMENT & LEGIT HUSTLES
- Scheduled legit jobs with humorous fictional employers.
- 8–9 hour shifts paying roughly $40–$50 at entry level.
- Weekly pending-pay system.
- No equipped weapons while clocked in.
- Raises, bonuses and promotions at 20/40/60/100 completed shifts.
- Work Rep, write-ups, firing, workplace events and employment history.
