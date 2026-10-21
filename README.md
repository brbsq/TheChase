# The Chase

Camera-controlled classroom sprint racing with questions, three answer lanes and hurdles. Built from the latest private Sprint Quiz prototype, with the supplied The Chase artwork, six animated characters and three music tracks.

## Run and build

Node.js 22 or later; no dependencies are required for the static build.

```sh
npm test
npm run build:pages
npm run preview
```

Local preview: `http://localhost:5178/game/`. GitHub Pages serves `dist/`; the root redirects to `game/` and preserves phone-controller links. `.github/workflows/pages.yml` tests, builds and publishes every push to `main`. The intended repository is `brbsq/TheChase`.

## Firebase connection

`public/game/firebase-config.js` contains the public Web SDK configuration. An empty config means cloud setup is pending: keyboard/laptop play and local question editing remain usable. Cloud pairing reports that setup is incomplete. Never put service-account keys or access tokens in this repository.

Provision a Firebase project, register a web app, create Realtime Database (Singapore / `asia-southeast1` for this classroom), enable Anonymous and Google authentication, and add `brbsq.github.io` plus `localhost` to Authentication's authorized domains. Keep the project on its free Spark plan unless a paid service is explicitly requested.

Apply `firebase/database.rules.json` before using the game. To link the registered app's public config:

```sh
node scripts/configure-firebase.mjs path/to/public-web-config.json
firebase deploy --only database --project YOUR_PROJECT_ID
```

The configuration script writes `.firebaserc` and the web config. Push the linked config to publish it with Pages.

### Camera pairing

Firebase Authentication automatically gives game and camera devices anonymous identities. Realtime Database carries the WebRTC offer/answer. The six-digit PIN expires after five minutes, session access expires after ten minutes, and only one camera can claim a session. Database rules prevent listing sessions or PINs, reading an unclaimed offer, overwriting a camera claim, changing another host's session, or submitting more than one answer. The host removes signaling records after connection and registers disconnect cleanup. Expired abandoned records are inaccessible; no scheduled background deletion is included. PIN lookups require authentication but do not yet have the old server's per-network attempt limit; production abuse protection should be added before broad unsupervised use.

Video stays on the camera device. Only derived movement events go over the WebRTC data channel. STUN is configured; TURN is not included, so restrictive Wi-Fi networks may prevent peer connections.

### Question banks

Open Question Bank and sign in with Google. Each teacher owns a private library of named question sets that syncs between their signed-in devices. Anonymous camera identities cannot read or modify those banks. Edits and selected deletions stay in an unsaved batch. One three-step confirmation commits the whole batch; Firebase saves use revision checks to reject overwriting a newer device's version. Legacy local questions migrate to a separate Custom set. Every JSON paste/import creates a new set with editable title and Year/category; existing sets are not appended to. Saved categories and titles appear in race selection. Existing local questions remain usable; Save this device's bank to Firebase migrates them after confirmation. Loading a cloud bank keeps a backup of the former local bank under `sprint-custom-backup` in browser storage. Starter packs are bundled samples and do not claim curriculum certification.

## Tests

`npm test` covers motion/race rules, independent falls, all six rigs, audio/loading, editable questions and GitHub Pages paths.

The Firebase emulator test is dependency-free and uses simulated end-user tokens. Start the official Realtime Database emulator on `127.0.0.1:9000`, then run:

```sh
npm run test:firebase
```

It checks owner/guest access, single camera claims, expiry, immutable answers, private teacher banks, anonymous write denial and conflicting revisions. It never contacts production. Live mobile camera pairing and Google sign-in still need physical-device testing.

## Playing

Questions appear before hurdles. Keep jogging, hop sideways to select a lane, then jump vertically during the highlighted final 1.25 seconds. Wrong answers and missed hurdles make only that runner fall and recover; opponents continue. Shared lanes and split screen retain all runners. Race targets can use questions, time, distance or endless chase.

Keyboard: P1 arrows / Space / R; P2 A D / W / S; P3 J L / I / K; P4 F H / T / G. Music attempts autoplay at 50%, falls back to the first interaction, and has volume controls in Settings plus a mute button. Camera loss pauses the race rather than applying a jogging penalty.

## Technical references

- [Firebase web setup](https://firebase.google.com/docs/web/setup)
- [Firebase database rules](https://firebase.google.com/docs/database/security/rules-conditions)
- [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Player names are replaced with P1–P4 IDs and clear AI labels. The in-race player card is removed, keyboard controls use a compact centered dock with larger buttons, and pause uses an SVG two-bar icon.

## Classroom control update

Players stand anywhere their whole body is visible; there are no numbered standing zones. Tap a detected person to open P1–P4 assignment, or use Lock all players. The tracker matches bodies between frames rather than reassigning by screen section. Crossing or overlapping bodies can still confuse pose tracking; use re-lock to restore assignments.

Pause includes Re-lock / reconnect camera, a live preview and Lock all players. It preserves the current race, score and timer. Phone cameras can receive a re-lock request, or pair again within the paused race. Resume after tracking loss requires a fresh calibrated frame with every active player visible.

Motion sampling targets 30fps (hardware dependent), with smaller step/jump thresholds and faster jogging detection. Both feet must rise for a vertical answer jump. Sideways hops last 0.42s, lane changes take 0.36s, and a jump can immediately interrupt a hop. Input animation uses a short blend rather than waiting for the previous hop to finish.

Solo choices glow yellow. Labelled player badges show each multiplayer choice; after the hurdle, green means correct plus jump and red means wrong or missed jump. A mixed outcome on one option shows separate coloured badges. Answer review groups responses per question and includes larger text, the correct answer and a simple explanation. All bundled questions have authored explanations; imported/manual questions can store optional explanations, with a basic answer recap otherwise. Original synthesized crowd cheers/aww accompany outcomes, alongside the existing impact sound. Clouds drift and trees sway, respecting reduced-motion preferences.

Automated simulated-pose checks cover free-position assignments, individual locks, re-lock recovery, small motions, immediate keyboard actions and per-player outcome feedback. Real classroom camera latency and multi-person occlusion still require physical-device testing.

Jogging uses a high-sensitivity knee-lift threshold relative to each locked stance, with a small deadband for tracking jitter. Small repeated lifts (including the same leg) refresh jogging, and an 850ms hold bridges a relaxed cadence. A held raised knee does not keep jogging indefinitely.
