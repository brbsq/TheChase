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

Connected project: `thechase-brbsq` (TheChase), owned by the signed-in personal account. The project stays on the free Spark plan with billing disabled. Realtime Database is in Singapore (`asia-southeast1`). Anonymous authentication is enabled for camera pairing; Google sign-in is enabled for private teacher question banks. The approved sign-in domains are `brbsq.github.io`, `localhost` and `127.0.0.1`.

`public/game/firebase-config.js` contains the public Web SDK configuration. Never put service-account keys or access tokens in this repository. `.firebaserc` selects the project and `firebase/database.rules.json` contains the deployed access rules. Publish the game with GitHub Pages; Firebase provides the backend.

To deploy backend changes:

```sh
npx -y firebase-tools@latest deploy --only database,auth --project thechase-brbsq
```

In the currently installed CLI, auth deployment enables providers but does not apply `authorizedDomains`; verify any domain changes in Firebase Console → Authentication → Settings → Authorized domains. Keep this allowlist limited to approved game origins.

Live disposable-account checks passed for anonymous sign-in, PIN lookup, private signaling, one camera claim, immutable answers and anonymous bank-write denial; test records/accounts were removed afterwards. Physical-device video/motion and teacher Google sign-in are separate browser checks.

### Camera pairing

Firebase Authentication gives game and camera devices separate anonymous pairing identities, isolated from teacher Google sign-in so using the same teacher account on both devices does not block pairing. Realtime Database carries the WebRTC offer/answer. The six-digit PIN expires after five minutes, session access expires after ten minutes, and only one camera can claim a session. Database rules prevent listing sessions or PINs, reading an unclaimed offer, overwriting a camera claim, changing another host's session, or submitting more than one answer. The host removes signaling records after connection and registers disconnect cleanup. Expired abandoned records are inaccessible; no scheduled background deletion is included. PIN lookups require authentication but do not yet have the old server's per-network attempt limit; production abuse protection should be added before broad unsupervised use.

Video stays on the camera device. Only derived movement events go over the WebRTC data channel. STUN is configured; TURN is not included, so restrictive Wi-Fi networks may prevent peer connections.

### Question banks

Open Question Bank and sign in with Google. Each teacher owns a private library of named question sets that syncs between their signed-in devices. Anonymous camera identities cannot read or modify those banks. Edits and selected deletions stay in an unsaved batch. One three-step confirmation commits the whole batch; Firebase saves use revision checks to reject overwriting a newer device's version. Legacy local questions migrate to a separate Custom set. Every JSON paste/import creates a new set with editable title and Year/category; existing sets are not appended to. Saved categories and titles appear in race selection. Existing local questions remain usable; Save this device's bank to Firebase migrates them after confirmation. Loading a cloud bank keeps a backup of the former local bank under `chase-question-sets-backup` in browser storage. Starter packs are bundled samples and do not claim curriculum certification.

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

Pages builds fingerprint local JavaScript/CSS and the complete import graph to avoid stale mixed client versions after deployment. Camera pairing identities use in-memory persistence; teacher sign-in prefers local storage with an in-memory fallback on storage-limited devices.

### Classroom camera and community updates

Pair Device opens a dedicated PIN/QR connection and camera test, independent of race settings. The WebRTC connection stays open between races; player-count changes reset camera locks on the phone. The paired preview is sent directly over WebRTC, with no Firebase video storage. Motion still runs on the camera device. Both devices must keep their browser open.

Camera hops use the opposite horizontal direction and a smaller lateral threshold, with a centre deadband before the next hop. Lock all captures all currently detected full bodies, even if some selected players are temporarily missing; starting still requires every selected player to be visible and locked.

Keyboard/touch mode shows one independent control group per human player. Settings checks camera availability and shows current device connection status.

The Public Question Bank reads the latest 30 opt-in community sets. Google-authenticated owners may publish up to 30 bounded sets and unpublish their own entries. Existing private banks are never automatically published. Publishing requires a saved set plus the public-sharing checkbox; copying a community set creates a new private draft for review. No author emails are exposed. Public content should be checked by the teacher before class. The deployment workflow tests private/public Firebase access rules in the local emulator before deploying Pages.
