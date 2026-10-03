# CivicConnect

## Demo credentials
Citizen:
- ID: `citizen01`
- Password: `citizen123`

Admin:
- ID: `admin`
- Government ID: `gov123`
- Password: `admin123`

Additional demo government IDs accepted by the Admin Portal:
- `gov123`
- `gov456`
- `gov789`

## Support
The Citizen and Admin portals include a floating Support button. The built-in support form prepares an email to both:
- `civicconnect@help.in`
- `civicconnect@support.in`

It uses the device's configured email application via `mailto:`.

## Location system
- Citizen reports support GPS capture, Indian location search and map clicking.
- Locations are restricted to India and use real OpenStreetMap map/geocoding data.
- Admin case details display the reported location on a real map and use saved coordinates when available, otherwise geocode the stored address.

## Government ID verification
Admin login and account creation require a government ID above the password field. Press `VERIFY` to run the demo verification flow. Valid demo IDs are `gov123`, `gov456`, and `gov789`; verification displays a popup and the account/login can continue only after a successful verification.

## Storage
All demo users, complaints, rewards and notifications are stored in browser `localStorage`.

## Live demo flow
1. Citizen logs in.
2. Reports a civic issue.
3. Selects a real Indian location by GPS, search or map click.
4. Photo is compressed in the browser.
5. A complaint ID is created.
6. Admin sees the case and its map location.
7. Admin verifies/assigns/updates status.
8. Citizen sees the updated timeline and reward.
9. Support can be opened from either portal and sent to the two configured handler addresses.

## Reset demo data
Open browser DevTools → Console and run:
`localStorage.removeItem("civicconnect_db_v1"); location.reload();`

## Note
This is a front-end demonstration. The government-ID verification is intentionally a simple local demo check, not a real government identity verification service. The support feature uses the user's mail client rather than a server-side email API.


CAMERA / CAPTURE NOW
--------------------
For Capture Now to access the browser camera, run CivicConnect through localhost or HTTPS.
On Windows, double-click RUN_CIVICCONNECT.bat in this ZIP after extracting it.
If Python is unavailable, use VS Code Live Server.
Do not open report.html directly with file:// and expect getUserMedia camera access.

Evidence:
- View 1 = wide shot
- View 2 = close-up
- View 3 = surroundings
- Each captured image is stamped with timestamp and available latitude/longitude.
- Existing photos can still be uploaded separately using "Upload Photos".

Daily Quest:
The dashboard now renders the current daily quest after gamification.js loads. The quest rotates by day and tracks progress.
