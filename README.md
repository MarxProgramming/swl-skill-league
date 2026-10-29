# SWL Squad Training 4.0

A static gymnastics training app with three main views: Leaderboards, Gymnasts and Games, plus focused Analytics, All skills and Challenge Tracker pages. The Skill League tracker connects to the shared Google Sheet, with instant skill cycling, gymnast creation, undo, and recovery of unsaved edits. The ten games run independently on the current device, with anonymous game ratings saved to Google Sheets.

After the opening screen, the main page goes directly to the leaderboards, with a small Scoring guide button. Two prominent programme buttons switch every board to All floor & vault or All senior squad (Marx and Dan together), resetting the age filter. The squad dropdown also offers each individual squad, Coaches, and Overall · all squads + coaches. Floor and vault includes Marx’s Saturday morning group, Hannah’s group, and the confirmed Saturday afternoon groups led by Ellie & Laura, Alba, Dan and Marx. The old visible scoring-status line is removed; the Lock/Unlock scoring control remains available. Each board names its active squad and age filters. The top five gymnasts are shown, followed by a blurred sixth-place preview; selecting a gymnast opens their skills. Equal scores are ordered alphabetically. Every gymnast has an individual place (1, 2, 3, 4), with one gymnast per podium place. The podium medals gleam in a staggered gold, silver, then bronze sequence.

Completing all three skills at Perfect in a complex shows a brief, compact Perfect message and a bright ding. It does not cover or move the app. The 250-point prize and game winner reveals retain their separate celebrations. Sound follows the device control and reduced motion is respected.

Base Rolls, Acro and basic leaps earn 10 points per Achieved skill; timed handstand holds and all upgrades earn 5; pro upgrades earn 2.5. Perfect doubles each skill value. Linking and presentation no longer add points or appear as scoring controls. Existing linking history is retained for recovery, but contributes nothing to scores or heat.

Each three-skill group, including basic leaps, upgraded leaps and handstands, also earns an automatic completion bonus: 1 point only when all three skills are Perfect. Achieved or mixed groups earn no bonus; lowering or clearing a Perfect mark removes the bonus immediately. Completion bonuses are derived from the existing marks and require no separate saved field.

The maximum is 339 points: 330 for skills and 9 for completing all nine groups at Perfect. Category maxima are Rolls 108, Acro 108, Leaps 92 and Handstands 31. All totals are derived from the current marks and the current catalogue.

Each gymnast profile shows their placement in Overall, Rolls, Acro, Leaps and Handstands, with up to two clear neighboring gymnasts above and below and an obscured third preview on each side. The fixed window keeps the selected gymnast in place at the top and bottom of a board. Rankings use points descending. Equal scores sort alphabetically, with an individual numbered place for each gymnast.

## Version 4.0

Gymnast search offers live name suggestions, including clearly labelled coaches. Select a suggestion to open the existing gymnast profile. Opening Analytics from the Gymnasts directory carries the selected squad into Analytics; opening it from Leaderboards still starts with all gymnasts.

Analytics leads with the five skills offering the largest immediate point gains: personal gains for an individual, combined gains for filtered groups. All rolls, acro and leaps (including pro upgrades) are eligible; handstands are excluded. Each row counts one next step per unfinished gymnast and includes the extra point only when that step completes a Perfect complex.

Expand a priority skill to see every gymnast in the filtered selection, their current status and explicit Unticked, Achieved and Perfect buttons. Purple means Achieved; mint double ticks mean Perfect. The usual scoring lock, expiry, dates, background save queue, retry and Undo apply. Open skills stay in place while marking, and priorities reorder after the final skill is closed. The remaining analytics overview and optional charts stay collapsed by default.

## Version 3.1

A full-width **The 250 Challenge** button below the main leaderboards opens the prize race: the first gymnast to reach 250 points wins. Current league points and the original version 3.1 race start date carry over. All noncoach gymnasts appear, regardless of the main leaderboard’s squad or age filters, ordered by current points descending and then alphabetically. Each row shows progress towards 250, points remaining and squad memberships, and opens the gymnast’s existing profile.

The backend saves qualifying challenge finishes durably in Google Sheets. The earlier 200-point challenge ledger is retained as an archive; a receipt from that race counts towards the new target only if it already recorded at least 250 points. Reaching 200 alone cannot win. Lifetime prize milestones remain separate and do not seed this race. Only a confirmed finish can award the prize; unsaved scores at or above 250 show that confirmation is pending. The earliest confirmed finish wins. Equal finish timestamps share first place, and a confirmed result remains recorded if the gymnast’s league score later falls. Retries, refreshes and reopening the app do not restart the race or duplicate a finish.

Version 3.1 introduced **Squad foundations**, a full-width comparison of every squad. Switch between foundation progress, average points per gymnast and the percentage of skills retained. Foundation progress uses base skills, basic leaps and handstand holds, with Achieved counting halfway and Perfect fully. Percentage and average measures avoid giving larger squads an advantage. Selecting a squad filters the detail charts below while the comparison keeps its whole-squad context; the age filter also applies to the comparison. Coaches remain excluded unless their group or the combined squads-and-coaches option is selected.

**Across the skills** uses stacked Achieved/Perfect bars for Rolls, Acro, Leaps and Handstands. Selecting a category opens its full standings below. **Building momentum** charts eight seven-day windows of signed net league points, with a comparison to the previous window when records are available. **Progress by age** is a vertical list of stacked progress bars and average points for each age group in the selected squad; selecting a row filters the other charts. **Every place. Every point.** lists every eligible gymnast, with bars and scores for Overall or any skill category, and can instead rank by net points over the last seven days. Selecting a name opens that gymnast's analytics; the adjacent arrow opens their skills.

Squad, age and gymnast filters remain available. The leaderboard's Analytics button resets to All squads, All ages and All gymnasts, while personal Progress insights keeps the selected gymnast. The former skill-mix donut, renewal horizon, renewal list and squad skill map are removed from Analytics. Renewal controls remain in gymnast profiles and quick marking.

Gymnast progress now uses one, two or three small flame emojis beside the name at 10, 20 and 30 qualifying points over the last seven London calendar days. Cards remain unlit below 50; at 50 or more they also get a slow orange/red fire effect. There is no Hot/On fire text label. The separate Hottest game label and rating sort remain. The SWL logo is slightly larger on desktop and mobile.

### Confirmed squads and October updates

Saturday afternoon floor and vault now has four confirmed groups: **Ellie & Laura’s**, **Alba’s**, **Dan’s**, and **Marx’s Saturday Afternoon Floor and Vault**. Marx’s other floor and vault group is clearly labelled **Saturday Morning**. Georgia moves to Marx’s afternoon group; Ariadne moves to Marx’s morning group. Sophia Pritchard Hawkes belongs to both Hannah’s group and Marx’s Saturday morning group, with a shared-squad label and one existing skill record. She appears when either squad is selected but is counted only once in combined leaderboards, the directory, challenge standings and overall analytics. Squad-comparison charts include her in each of her member squads. The membership migration preserves every existing gymnast ID, mark and score.

Zara is classified as a coach alongside Marx, Dan and Hannah. Coaches keep their existing results, are clearly labelled and remain outside default squad leaderboards and the prize challenge. Select Coaches or the combined squads-and-coaches option to include them.

New first-time skill achievements save a server-authoritative `firstAchievedAt` timestamp. Perfect upgrades, renewal, unticking and later reacquisition preserve that first date. This tracking starts with the update: unknown first-achievement dates on existing records are left blank rather than guessed. Renewal and latest-gain dates remain separate.

Most team games now support two to five teams through a dropdown; Team Skill Draft supports two to four. Large minus/plus controls adjust gymnast counts. Handstand Timer, Add-On and Team Challenge now use the animated winner reveal already present in Skill Shuffle and Draft, as do Conditioning Relay and Time Sense. Reveals include fourth and fifth places where needed, shared places for ties, counted scores, bright dings, winner confetti and a Skip control. These updates do not change scoring rules.

Sound defaults to on and respects an explicit Sound off choice. The shared audio system resumes after iPad audio interruptions or returning from another app, and retries on the next trusted tap. Brief recovery retains a fresh result or countdown cue, while old ticks and delayed cues are discarded. Closed audio contexts are recreated, rapid requests stay bounded, and audio failure never blocks gameplay or scoring. No audio context is created before the user first interacts.

## Version 3.0 history

Version 3.0 introduced Team Skill Draft as a separate game, initially for two or three equal-sized teams. Shuffle one shared skill, let each team choose an unused gymnast, and award one point to the best attempt. Every performer uses a turn; play ends when everyone has had one go. Both shuffle games offer Easy (12 base skills, basic leaps and handstand holds), Medium (21 skills including first upgrades and upgraded leaps), and Hard (all 27 skills). Anonymous class ratings and completed plays use the same Google Sheets tracking as the other games. The wheel uses conditioning in place of the former funny/silly entries.

Version 3.0 introduced the Coaches group for Marx, Dan and Hannah; Zara joins it in the October update. Marx retains his existing skill record and score. The default All squads view excludes coaches; choose Coaches to compare coaches, or the final Overall · all squads + coaches option to include everyone. The same distinction applies to directory and analytics views. No coach birth dates or ages are inferred.

Leaderboards have matching squad and age dropdowns. The initial Saturday Floor and Vault import combined the 32 screenshot gymnasts into one group, ignoring the then-unconfirmed coach headings. The October update replaces this combined membership with the confirmed morning/afternoon groups above. Three existing records keep their IDs and results; 29 new records start unticked. Dates of birth stay in private Apps Script properties and only competition age/category reaches the public app.

Full turn jump and Full spin replace the former half-turn jump and half spin under new IDs, with everyone starting unticked for those two skills. Handstand pirouette to handstand forwards roll no longer requires pike stand; Split jump no longer requires a full turn. Marks on those renamed skills remain. Basic leaps are Split leap, Cat leap and Scissor kick; upgraded leaps are Split change, Cat leap full turn and W hop. Split change and Cat leap full turn keep their existing IDs, marks and dates while moving to upgrades. The catalogue, profiles, quick complexes, analytics and game pools all use this same catalogue.

The migration preserves historical progress and existing prize receipts while recalculating current points. Its rule changes do not create artificial gains, losses, heat or prize celebrations. Older clients must reload before saving scores.

Heat uses qualifying net progress over the last seven London calendar days: one flame at 10, two at 20, three at 30, and a slow card glow only at 50 or more. Basic Rolls and all basic Achieved points are excluded; the full rules are below. Indicators follow the current seven-day qualifying total; removing unearned progress reverses it. Analytics separately shows eight weekly windows of signed net league points, including points that do not qualify for heat, with untracked periods marked clearly. Automatic skill expiry does not subtract momentum. The tracking ledger starts with available recorded progress rather than inventing earlier activity.

First confirmed score milestones at 200 and 250 points earn a prize celebration. Durable milestone records prevent repeat awards after refresh, retry or later score reductions. Existing qualifying totals are registered quietly at migration. Perfect-complex celebrations finish before a queued prize appears.

Unchanged refreshes retain leaderboard, directory, analytics, challenge and game-card elements. Changed analytics and challenge content preserves the focused control without scrolling it into view. Scoring starts locked and every successful unlock has a shared 30-minute expiry.

## First visit

A personal welcome note from Marx explains the app as a small experiment alongside normal squad training: tracking foundational floor skills, celebrating progress and adding friendly competition within each squad. It appears after the startup screen on the first visit in a browser. Dismissing it is remembered on that device/browser; About this app in the footer opens it again. It stores no personal information.

The leaderboard’s Analytics button always opens All squads, All ages and All gymnasts. Personal Progress insights still opens the selected gymnast.

## Skill renewal and insights

Achieved stays until a coach unticks it. Perfect lasts 30 days from its last renewal, then drops once to Achieved; it never continues down to unticked. Existing renewal dates are preserved. Renew is available only for Perfect marks and starts a fresh 30 days without adding points. Perfect marks with seven days or less remaining turn red and appear in the Unticked + due for renewal list. Undo restores the previous mark as a manual reassessment, with a fresh timer only if that mark is Perfect.

Google Sheets stores server-authoritative first-achievement, renewal and latest-gain dates, a ledger of net league points, and a separate ledger of qualifying heat progress. The league ledger includes current skill points and +1 all-Perfect completion bonuses. Historical entries remain intact across the version 3 rule migration. Weekly analytics uses that league history, not the smaller heat total, and labels incomplete or untracked windows. Earlier points are never guessed.

Flames start at 10 qualifying points over the last seven London calendar days, increase to two at 20 and three at 30, and gain a slow card glow at 50. Basic Rolls contribute no heat. For Acro basics, basic leaps and handstand holds, Achieved marks contribute no heat and no completion bonus. The Perfect increment adds +10 for Acro basics and basic leaps, or +5 for handstand holds; an all-Perfect group adds +1. Upgrade and pro skills and their completion bonuses qualify at their normal point values. Linking contributes no heat. League scores and rankings are unchanged by these heat exclusions.

Indicators follow the rolling seven-day qualifying total; legacy hot/on-fire expiry timestamps do not force the new glow. Renewals add no points, while manual reductions and undo reduce the corresponding net totals and can reverse unearned heat. Automatic expiry does not affect momentum. Pending edits update the highlights immediately; a save acknowledgement replaces the baseline without counting an edit twice. Filters do not change the heat thresholds.

Leaderboard Age and squad filters combine, with counts for each selection and a clear empty state. Analytics uses the same age categories. The official [IGA January 2026 Women’s Artistic National Pathway handbook, printed page 5](https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-National-Pathway-Handbook-Information_compressed.pdf#page=6) defines age as the age a gymnast turns in the current calendar year: Mini Marvels 5–6, Little Leapers 7–8, Skill Seekers 9–10, Trailblazers 11–12, Pioneers 13–14, Legends 15–16 and Masters 17+. The current year follows London time. Public roster data contains only competition age, category and year; no dates of birth or email addresses are sent to the website. Missing age information, ages below five, and a cached previous-year category appear under No current age category until fresh information is loaded.

The searchable Gymnasts directory groups every gymnast by squad. A gymnast with multiple memberships appears under either selected squad and only once in combined views, with a shared-squad badge. Analytics compares squad foundations, retained and perfect skills, skill categories, age groups, weekly progress and full standings, scoped to all squads, a squad or one gymnast. Current progress charts use current marks. Weekly charts use the saved net-points ledger and clearly identify incomplete or unavailable history; they do not claim a complete historical event log. Placement profiles default to their primary squad and offer their additional member squads, All floor & vault and All squads where applicable.

## Squad games

Games are always available. Game points and optional team names stay in the current page session; they are not saved to Google Sheets and never change Skill League marks or totals. Returning to another app view preserves the session, while reloading the page starts fresh.

- **Conditioning wheel:** start a game in Conditioning or Crazy mode, then spin and complete the task. The coach chooses Good to remove the landed exercise, Okay to halve its remaining reps or time (rounded up, minimum one), or Needs work to add another conditioning exercise. Special turns have a Done button. At one remaining option the game is complete. Each mode keeps its own progress until a new game or reload. Leaving mid-spin cancels the spin without grading it. Tap any segment or its full-name list button to see the instructions. Short labels keep the wheel readable as its segment count changes. Crazy mode spins faster, with harder conditioning, coach-and-squad conditioning, a rare all-coaches splits challenge, and five minutes of supervised free time. The old coach dance and victory-pose tasks are removed. New game asks before clearing an active game.
- **Team Challenge:** choose two to five teams with optional names and a gymnast count for each, then rotate through four turns per team. The 46-card deck spans eight categories and keeps floor shapes, jumps to stick together and balances, includes seven conditioning rep challenges and three coaching reenactments (Marx, Dan and Isabella), and removes the requested copy-shape, lunge, partner-pike and roll cards. V sit uses its familiar name. Used cards are remembered on the device across sessions, with no repeats until the deck is exhausted. Consecutive categories are varied where possible. Read the card, then press Go for ten seconds: the first seven seconds are silent, the last three have tones, and the finish has a short chime. The coach awards one, two, or three stars; the timer never awards points. Each team can earn up to 12 stars, and tied leaders share the win. Awards can be undone before advancing. Leaving a timed round pauses it until Resume. New game asks before clearing the session.
- **Skill Shuffle:** choose two to five teams, 1–20 gymnasts per team and 1–10 rounds. Shuffle one shared skill, then select a numbered nominee from each team. Every gymnast can represent their team once per round. Award one point to the best attempt or choose no point. Smaller teams sit out after completing their turns. Four gymnasts and three rounds means twelve shared skills and three turns per gymnast. Undo restores the last point and the exact nominees. Easy, Medium and Hard retain the app’s existing skill pools.
- **Stick It:** a separate shared-challenge game with twenty curated feet-together landings. Easy contains six single jumps; Medium adds combinations; Hard includes all twenty. No somersaults or standalone flicks. Teams line up in a fixed order. The next gymnast from each active team attempts the shared challenge automatically; the coach only taps the winning team. The best stuck landing earns one point. Each gymnast takes one turn per round; choose team sizes and 1–10 rounds. Undo restores the point and everyone’s position in the line. Stick It has its own saved play count and class rating.
- **Team Skill Draft:** choose two to four equal-sized teams and 1–20 gymnasts per team using the minus/plus controls. Each round reveals one shared skill; each team picks an unused gymnast to attempt it. Award one point to the best team, or no point for a tie. All performers use their turn. After everyone has attempted once, the team with the most points wins. Redraw is available before attempts, and Undo before advancing.
- **Letter Duel:** choose two to five teams, team sizes and rounds. Gymnasts stay in a fixed line order. Each letter is attempted by the next gymnast from every active team; tap a side-by-side team button for one point or award no point. Everyone gets one turn per round. It no longer ends early at seven points. Hints, redraws, undo and the animated winner reveal are available.
- **Handstand Timer:** choose two to five teams and use minus/plus controls to set 1–20 gymnasts each. Start and stop each hold, review, then confirm; Pro mode allows Fell over (zero seconds) or Extra neat (+1 second). Group mode times the whole team until the last gymnast comes down; that gymnast sits out future rounds. Choose 1–10 rounds (two by default); teams take turns until their rounds or gymnasts are used. Highest total seconds wins. Undo restores time and the gymnast count.
- **Add-On:** two to five teams, 1–20 gymnasts each, with minus/plus count controls. Each team starts its own chain with one skill. Later gymnasts choose one of three shuffled options, append it and perform the growing routine. Rate the complete routine 1, 2 or 3 stars. Highest average stars per gymnast wins; totals remain visible. Coach can redraw choices and undo the current award.
- **Conditioning Relay:** choose two to five teams and set gymnast counts with minus/plus controls, then time the whole team through a chosen exercise. Tap each gymnast’s handover to record a split and finish after the final gymnast. Review any missed-rep penalties (+2 seconds each), then confirm. Lowest average seconds per gymnast wins, keeping unequal teams comparable. Splits and totals stay visible; a team can redo its relay.
- **Time Sense:** choose two to five teams and set gymnast counts with minus/plus controls. Each gymnast holds a familiar balance and estimates an 8–15 second target without seeing or hearing a clock. Coach starts and stops it. The score is 10 minus the absolute timing error in seconds, with a minimum of zero. Balance lost makes the attempt zero. Highest average points per gymnast wins.

Skill Shuffle uses a four-second horizontal card reel with a fixed centre marker, card-by-card ticks and a bright final reveal. Both shuffle games limit all revealed and decorative reel cards to the selected difficulty. Hard is the default; replay retains the chosen difficulty. Starting a game centres a compact play screen with the reel, team scores, nominations and point controls kept inside the viewport, including on phones and iPads. It pauses on navigation and continues only on Resume. Time Sense deliberately has no timing sounds or moving clock during an attempt.

Skill Shuffle, Stick It, Letter Duel, Team Skill Draft, Handstand Timer (Individual and Group), Add-On, Team Challenge, Conditioning Relay and Time Sense finish with a staged podium: lower places reveal first, scores count up with bright dings, then the winner receives a gold-and-green confetti celebration. Fourth and fifth places are included for larger games; ties share their place. Each game keeps its existing ranking rule, including Add-On average stars, Shuffle/Draft/Letters/Stick It total points and Relay lowest average time. Skip jumps to the final standings; reduced-motion users see the result immediately. The completion event and optional rating prompt follow the reveal exactly once. Leaving during the reveal still records the completed game once, without opening a rating prompt over another screen.

After a completed game, the winner stays visible before a rating prompt appears. Choose one anonymous class score from 1–10 and save it. Rate buttons on each game card and inside each game also allow voting without playing. The separate GameRatings sheet stores submissions without gymnast names; previous ratings remain part of the running average. Finish later keeps the draft on this device. Saving continues in the background, and saved submissions can safely retry without counting twice.

Each completed game is recorded independently in the GamePlays sheet, even if its rating is skipped. Submitting a manual class rating also records one play. A rating after completion uses the same play receipt, so the game counts once. Repeated saves are deduplicated. Cards and game headers show the average rating and play count. Choose Hottest to sort by average rating or Most played to sort by plays. The highest-rated game has a fiery Hottest game badge; equal averages favour the game with more votes. Both rating and play tracking recover unsent submissions after going offline. Play tracking starts with this update; earlier completions are not estimated from votes.

Routine Relay, Stick & Bank and Hold the Line are no longer offered in the app.

All ten games follow the Sound control and the device’s reduced-motion preference. The shared audio system recovers from suspended or interrupted audio without queueing stale wheel ticks or old countdown sounds. Game cues have stronger, longer countdown tones, a distinct two-tone finish, an audible spin start and clearer wheel ticks. Skill-mark bells keep their existing mix. Device volume still controls speaker output.

Challenge design draws on [British Gymnastics’ Partner School session plans](https://a.storyblok.com/f/83342/x/d431c09726/09_2021_session-plans-1-24-final.pdf), [Oak National Academy’s sequence lessons](https://www.thenational.academy/teachers/programmes/physical-education-primary-ks2/units/gymnastics-movements-balances-and-sequence-composition/lessons/sequence-formation-combining-individual-and-pair-balances), and [Seascale’s gymnastics sequences](https://www.seascaleschool.co.uk/gym-sequences/). The app’s challenge wording and game formats are original adaptations, not official programmes or endorsements.

## Publish with GitHub Pages

1. Set `appsScriptUrl` in `config.js` to the public Google Apps Script web-app `/exec` URL.
2. Keep these files together at the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, the publishing branch, and **/ (root)**.
4. Open the published Pages address. Relative asset paths support a repository subpath or custom domain.

No build step, package installation, or Actions workflow is required. `.nojekyll` lets Pages serve the files directly.

## Google Sheets connection

The Apps Script deployment must accept the public `swl-pages-v1` protocol and have access to the league’s Google Sheet. The browser sends ordinary text requests to that deployment and reads its JSON response. `config.js` contains only the public endpoint URL; visitors do not need a Google or website-owner login.

Scoring is locked by default. The existing PIN unlocks it for everyone for 30 minutes; Lock scoring can close it sooner. The deadline is stored by the backend and enforced on each save, so a sleeping or closed browser cannot extend the session. The client checks the deadline on every edit as well as with a background timer; polling or a delayed response cannot restart the same lease. Profiles, leaderboards and games remain available while locked. A connection failure never grants or extends scoring access. Unsaved edits are kept on the device; unlock again and use Retry save.

Keep the Google Sheet publicly viewable with public access set to **Viewer**; the owner and Apps Script retain edit access. Changes appear immediately and save in the background. If saving fails, the page retains the edits and displays **Retry save**. Wait for **All changes saved to Google Sheets** before closing.

The opening screen can be dismissed after a short pause and automatically opens training within six seconds, even if Google Sheets is still loading. Scores show an honest loading or retry state until the connection succeeds. A request has a bounded timeout; failed requests never erase valid loaded scores or unsaved edits.

For local checking, serve this folder using any static HTTP server. The website has no hosting-specific runtime dependency; Google Apps Script provides the shared data connection.

SWL marking guide: Achieved means the intended skill would count without downgrade and has at most 0.5 deductions. Perfect allows at most 0.2 deductions and requires the correct skill shape.

The Gymnasts directory offers an optional Add a complex selector. One selected three-skill group appears under every visible name, with abbreviated labels, full accessible names and due-renewal buttons. Marks use the same instant updates, background saves and undo as the full gymnast profile. Achieved marks are purple with one tick; Perfect marks are mint with two ticks. Clearing the selector returns to names only. Opening a gymnast keeps Gymnasts selected; Back to gymnasts restores the directory search, squad, complex and scroll position. The existing Add gymnast form is available in the directory.

Retry saving is always available in the footer. It reconnects if needed and retries pending league edits, game ratings and play counts while preserving unsaved work.

## Skill catalogue and IGA reference

The subtle All skills header button opens a read-only catalogue of all nine groups and 27 skills, including the existing skill points and completion bonuses. It never assigns or changes gymnast marks. Filters narrow the catalogue by category, and Back restores the previous view.

Fifteen clear floor-skill matches show difficulty letters from the official [IGA 2026 Women’s Artistic Code of Points](https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-CODE-OF-POINTS-2026.pdf#page=9). These A–G letters are separate from competition levels or Gems grades. New or changed skills without an individually verified code entry, unspecified combinations and the unspecified front somersault are left ungraded. Handstand roll to pike stand is identified as Regional pathway only. Qualifications for straight jumps and change-leg leaps remain visible without information pop-ups.

## Save recovery audit

Each scoring tab owns a separate recovery record, so an idle tab cannot erase another tab’s pending edits. Browser Web Locks coordinate recovery of abandoned tabs; older browsers preserve other tabs’ records and explain when recovery needs a newer browser. Immutable request IDs survive reloads and handoffs. A newer revision from another coach clears stale Undo history, while an unchanged refresh or your own save acknowledgement preserves it.

Game ratings and plays use independent recovery records and saved receipts, preventing one tab from replacing another tab’s submission. Recovered approved submissions correctly offer Retry; drafts are never submitted until Save is pressed. Storage failures remain visible and do not promise a device backup when one cannot be saved. Timer displays and confirmed scores now use the same hundredth-second rounding.

The backend keeps durable score and lock request receipts in an additive RequestReceipts tab. Interrupted requests fail safely rather than blocking everyone or replaying over newer edits. Existing retained receipts are migrated; receipts already evicted by the previous server cannot be reconstructed. The same endpoint and permissions are retained. Version 3 migrates only the requested catalogue, roster, lifetime and scoring rules; game ratings and plays remain unchanged.

Release checks use isolated local fixture data with the production Sheet connection blocked. They cover phone/iPad layouts, catalogue/profile navigation, all nine game interfaces, failed saves and two-tab recovery; production leaderboard marks are not changed for testing.

GitHub Pages hosts the app, and Google Sheets remains the shared data store. Shared unlock sessions expire after 30 minutes; network failures preserve unsaved edits for retry.

### Handstand timing controls

Handstand Timer uses a centred play screen with oversized Start, Stop and Resume buttons. Retry attempt (or Retry round) resets the current or just-confirmed time for the same gymnast/group, preserving all other results and restoring any sat-out gymnast. Retry is available after stopping or pausing; advancing to the next turn closes the previous attempt.

Handstands adds separate 5-second, 10-second and 30-second holds, each worth 5 Achieved / 10 Perfect. The three holds earn +1 only when all three are Perfect, with permanent Achieved marks and 30-day Perfect renewal. Each hold is ticked separately; longer holds never auto-award shorter holds. The category is included in leaderboards, profiles, quick marking, analytics and the shared game skill pool.

## 26 October 2026 — afternoon standings and light mode

The leaderboard squad dropdown includes **All Saturday afternoon floor & vault**, combining Ellie & Laura, Alba, Dan and Marx’s afternoon groups, plus remaining unassigned afternoon memberships. Shared members count once; morning groups, senior squad and coaches stay outside this filter. The age filter continues to narrow the selected afternoon leaderboard.

A compact theme button beside **All skills** switches the whole app between the original dark design and a light palette. The preference is stored on that device and applied before the page paints. It does not write to Google Sheets. Light mode preserves purple Achieved and mint Perfect marks.

Stick It uses a fixed line order with no gymnast picker. Team sizes, rounds, redraw, no-point, undo, ratings and the final reveal remain available. Small-screen scoring controls stack within each team card. The Google Sheets backend, scoring rules, roster and existing scores are unchanged.


### 4.0 visual refinement — 29 October 2026

The existing layout now uses shared category styling, without decorative complex icons. Purple continues to mean Achieved; mint means Perfect. Dark and light modes have coordinated surface, control and focus treatments. Podium metals have staggered sweeps and softer halos; 50+ weekly heat uses slow orange/red flame motion; lower tiers have static inline flames. System reduced-motion and app motion-off remain supported.

Training priorities show the skill, category/tier, available points, achievement counts/progress and a clearer View gymnasts disclosure. The ranking formula, complex bonus calculation, marks and Google Sheets synchronisation are unchanged.

The 4.0 follow-up restores the exact pre-polish Perfect green in each theme, enlarges the complex/category headings, and separates orange/red heat from the podium metals. At 50+ qualifying weekly points, heat uses differently phased 15–18 second plume movement and a 38–47 second independent drift; reduced-motion settings stop both. Lower tiers are static inline flames.
