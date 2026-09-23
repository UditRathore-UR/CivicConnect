# CivicConnect Hackathon MVP

## Demo credentials
Citizen:
- ID: citizen01
- Password: citizen123

Admin:
- ID: admin
- Password: admin123

## How to run
1. Open `index.html` in a modern browser.
2. For best results, use VS Code + Live Server.
3. Use Citizen Login to submit a complaint.
4. Use Admin Login to verify/update it.
5. Return to Citizen to see the updated status.

## Storage
All demo users, complaints, rewards and notifications are stored in browser `localStorage`.

## Important MVP limitation
This is a single-browser prototype. localStorage is not a centralized multi-device database. For production, replace the storage layer with a backend API and database.

## Live demo flow
1. Citizen logs in.
2. Reports a pothole.
3. Photo is compressed in the browser.
4. GPS or manual location is attached.
5. CIV007 (or the next available ID) is created.
6. Admin sees the new complaint.
7. Admin verifies/assigns/updates status.
8. Citizen sees the updated timeline and reward.

## Reset demo data
Open browser DevTools → Console and run:
`localStorage.removeItem("civicconnect_db_v1"); location.reload();`
