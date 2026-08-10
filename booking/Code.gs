/**
 * Velorb demo booking API — Google Apps Script
 *
 * Setup: see booking/SETUP.md
 * After editing: Deploy → Manage deployments → Edit → New version → Deploy
 */
const NOTIFY_EMAIL = 'bhavnarao29@gmail.com';
const SHEET_NAME = 'Bookings';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'createdAt', 'slotKey', 'date', 'time', 'timezone',
      'firstName', 'lastName', 'email', 'company', 'phone',
      'source', 'focus', 'guests'
    ]);
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
  }
  return sheet;
}

function slotKey_(date, time, timezone) {
  return String(date) + '|' + String(time) + '|' + String(timezone);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function respond_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(obj);
}

function getBookedSlots_() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const slots = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1]) slots.push(String(rows[i][1]));
  }
  return { ok: true, slots: slots };
}

function createBooking_(body) {
  const required = ['date', 'time', 'timezone', 'firstName', 'lastName', 'email', 'company', 'phone', 'source'];
  for (let i = 0; i < required.length; i++) {
    if (!body[required[i]] || !String(body[required[i]]).trim()) {
      return { ok: false, error: 'validation', field: required[i] };
    }
  }

  const key = slotKey_(body.date, body.time, body.timezone);
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === key) {
      return { ok: false, error: 'slot_taken', message: 'This time slot is no longer available.' };
    }
  }

  const guests = Array.isArray(body.guests) ? body.guests : [];
  sheet.appendRow([
    new Date().toISOString(),
    key,
    body.date,
    body.time,
    body.timezone,
    body.firstName,
    body.lastName,
    body.email,
    body.company,
    body.phone,
    body.source,
    body.focus || '',
    guests.join(', ')
  ]);

  sendBookingEmails_(body, key, guests);
  return { ok: true, slotKey: key };
}

function parsePayload_(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e.postData && e.postData.contents) {
    if (e.postData.type && e.postData.type.indexOf('application/x-www-form-urlencoded') >= 0) {
      return JSON.parse(e.parameter.payload);
    }
    return JSON.parse(e.postData.contents);
  }
  throw new Error('missing_body');
}

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const action = p.action || 'slots';
  const callback = p.callback;

  if (action === 'slots') {
    return respond_(getBookedSlots_(), callback);
  }

  if (action === 'book' && p.payload) {
    try {
      const body = JSON.parse(p.payload);
      return respond_(createBooking_(body), callback);
    } catch (err) {
      return respond_({ ok: false, error: 'server_error', message: String(err) }, callback);
    }
  }

  return respond_({ ok: false, error: 'unknown_action' }, callback);
}

function doPost(e) {
  try {
    const body = parsePayload_(e);
    return json_(createBooking_(body));
  } catch (err) {
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function sendBookingEmails_(body, key, guests) {
  const guestBlock = guests.length
    ? guests.map(function(g) { return '  • ' + g; }).join('\n')
    : '  (none)';

  const adminBody = [
    'New Velorb demo booking',
    '',
    '── Meeting ──',
    'Date: ' + body.date,
    'Time: ' + body.time,
    'Timezone: ' + body.timezone,
    'Slot ID: ' + key,
    '',
    '── Contact ──',
    'Name: ' + body.firstName + ' ' + body.lastName,
    'Email: ' + body.email,
    'Company: ' + body.company,
    'Phone: ' + body.phone,
    '',
    'How they heard about us: ' + body.source,
    'Focus of demo: ' + (body.focus || '—'),
    '',
    '── Guests ──',
    guestBlock
  ].join('\n');

  GmailApp.sendEmail(
    NOTIFY_EMAIL,
    'New Velorb demo — ' + body.company + ' (' + body.date + ' ' + body.time + ')',
    adminBody,
    { replyTo: body.email, name: 'Velorb Bookings' }
  );

  const confirmBody = [
    'Hi ' + body.firstName + ',',
    '',
    'Your Velorb demo is confirmed.',
    '',
    'When: ' + body.date + ' at ' + body.time + ' (' + body.timezone + ')',
    'Duration: 30 minutes · Google Meet',
    '',
    'We will follow up with a calendar invite and meeting link before the call.',
    'If you need to reschedule, reply to this email.',
    '',
    '— Velorb'
  ].join('\n');

  GmailApp.sendEmail(
    body.email,
    'Your Velorb demo is confirmed',
    confirmBody,
    { replyTo: NOTIFY_EMAIL, name: 'Velorb' }
  );
}
