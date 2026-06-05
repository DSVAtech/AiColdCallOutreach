const chrono = require('chrono-node');
const { DateTime } = require('luxon');
const config = require('../config');

const WORD_NUMBERS = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12',
  thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
  seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20',
  thirty: '30', forty: '40', fifty: '50',
  oclock: "o'clock",
  noon: '12 PM', midnight: '12 AM', midday: '12 PM',
  half: '30',
  quarter: '15',
};

function normalizeText(text) {
  let out = text.toLowerCase();
  out = out.replace(/(\d+)\s*(am|pm|a\.m\.|p\.m\.)/gi, '$1 $2');
  out = out.replace(/\b([a-z]+)\b/gi, (m, w) => WORD_NUMBERS[w.toLowerCase()] || m);
  out = out.replace(/(\d+)\s+(\d+)\s*(am|pm)/gi, (_, h, mm, ap) => `${h}:${mm.padStart(2, '0')} ${ap}`);
  return out;
}

function parseDemoTime(text, referenceDate) {
  if (!text || typeof text !== 'string') return null;

  const tz = config.calling.timezoneDefault;
  const refDt = referenceDate
    ? DateTime.fromJSDate(new Date(referenceDate)).setZone(tz)
    : DateTime.now().setZone(tz);

  const normalized = normalizeText(text);
  console.log(`[parseDemoTime] raw="${text}" normalized="${normalized}"`);

  const parsed = chrono.parse(normalized, refDt.toJSDate(), { forwardDate: true });
  if (!parsed.length) return null;

  const result = parsed[0];
  const known = result.start.knownValues || {};
  if (known.hour == null) {
    console.warn(`[parseDemoTime] no hour parsed from "${text}" — chrono only got the date`);
    return null;
  }
  const implied = result.start.impliedValues || {};
  const year = known.year ?? implied.year ?? refDt.year;
  const month = known.month ?? implied.month ?? refDt.month;
  const day = known.day ?? implied.day ?? refDt.day;
  const hour = known.hour;
  const minute = known.minute ?? implied.minute ?? 0;

  const local = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: tz }
  );
  if (!local.isValid) return null;
  return local.toISO();
}

module.exports = { parseDemoTime, normalizeText };
