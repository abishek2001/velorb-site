# Velorb demo booking — setup (one time, ~5 min)

The demo page stores bookings in Google Sheets and sends email to **bhavnarao29@gmail.com** when someone confirms.

## 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Name it `Velorb Demo Bookings`

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**
2. Delete any code in `Code.gs`
3. Copy the entire contents of `booking/Code.gs` from this repo and paste it
4. Save (Ctrl/Cmd + S)

## 3. Deploy as web app

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Description: `Velorb booking API`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy**

### If you see “Google hasn’t verified this app”

This is expected for personal Apps Script projects that send email. You are the developer — it is safe to continue:

1. Click **Advanced** (bottom left)
2. Click **Go to Velorb Bookings (unsafe)** — the name may match your project
3. Choose your Google account (`bhavnarao29@gmail.com`)
4. Click **Allow** for Sheets + Gmail access

Google shows this because the script can send email on your behalf. It does **not** need full Google verification unless you publish the app to strangers in the Workspace Marketplace.

7. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/XXXX/exec`)

## 6. After code changes

Whenever you update `booking/Code.gs` in Apps Script:

1. **Deploy → Manage deployments**
2. Click the pencil icon → **New version** → **Deploy**

The URL stays the same; visitors get the updated code.

## 4. Connect the demo page

Open `demo.html` and set:

```javascript
const BOOKING_API = 'https://script.google.com/macros/s/YOUR_ID_HERE/exec';
```

Replace `YOUR_ID_HERE` with your deployment URL.

## 5. Test

1. Open `demo.html`, pick a time, fill the form, click **Confirm**
2. You should receive an email at bhavnarao29@gmail.com
3. The booker receives a confirmation email
4. That time slot shows as **Unavailable** for everyone else

## Notes

- Bookings are stored in the **Bookings** sheet tab (created automatically)
- Each slot is unique by: `date + time + timezone`
- To change the notification email, edit `NOTIFY_EMAIL` in `Code.gs` and redeploy
