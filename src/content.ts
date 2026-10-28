// Everything personal lives here. Replace the [placeholders] with your own stuff;
// the components only read from this file.

export const owner = {
  name: 'Pavel',
  title: 'Pavel The Wise', // big chrome text on the wallpaper
  handle: 'pavelthewise',
  domain: 'pavelthewise.com',
  tagline: 'software engineer, visionary & music collector',
  location: 'Stockholm, Sweden',
  bio: [
    'signal received. you have reached a quiet room somewhere between the code and the music.',
    'by day i build things out of logic, by night i collect sounds. the rest is still loading...',
  ],
  now: [
    { label: 'doing', value: 'waiting for the kettle' },
    { label: 'reading', value: 'nothing' },
    { label: 'listening', value: 'the fridge' },
    { label: 'mood', value: 'ok i guess' },
  ],
  updated: '2026-10-28',
}

export const links = {
  me: [{ label: 'rira622@gmail.com' }] as { label: string; url?: string }[], // no url = plain text
  cool: [] as { label: string; url: string }[], // shown only when not empty
}

// Paste a link to an external guestbook here (e.g. one from atabook.org).
export const guestbookUrl = ''

// Placeholder entries until a real guestbook is hooked up. Newest first.
export const guestbookEntries = [
  { name: 'Margareta, 64', date: '2026-10-28', text: 'my grandson showed me this. i clicked the statue and now it is green. how do i make it white again' },
  { name: 'xX_dolphin_fan_Xx', date: '2026-10-27', text: 'COOL SITE!!! the dolphins r sick. signed ur guestbook pls sign mine' },
  { name: 'Bengt', date: '2026-10-25', text: 'I was looking for a meatball recipe. This is not it. Still nice.' },
  { name: 'kevin', date: '2026-10-24', text: 'the sequencer made my cat leave the room. 10/10' },
  { name: 'anonymous', date: '2026-10-22', text: 'how did i get here' },
  { name: 'lisa_k', date: '2026-10-19', text: 'hej from göteborg! nice pyramids :)' },
  { name: 'your mom', date: '2026-10-17', text: 'please call me back' },
  { name: 'sk8erboi2003', date: '2026-10-15', text: 'first!!!' },
]
