import { guestbookEntries, guestbookUrl } from '../content'

export function GuestbookApp() {
  return (
    <div className="pane scroll">
      <p>Thanks for stopping by! Leave a message, say hi, tell me what you liked ♡</p>
      {guestbookUrl ? (
        <a className="button" href={guestbookUrl} target="_blank" rel="noreferrer">
          Sign the guestbook
        </a>
      ) : (
        <div className="under-construction">
          <span>SIGNING UNDER CONSTRUCTION</span>
        </div>
      )}
      <ol className="guestbook">
        {guestbookEntries.map((entry) => (
          <li key={entry.name + entry.date}>
            <div className="guestbook-head">
              <b>{entry.name}</b>
              <span className="muted small">{entry.date}</span>
            </div>
            <p>{entry.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
