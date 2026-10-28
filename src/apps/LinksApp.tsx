import { links, owner } from '../content'

export function LinksApp() {
  return (
    <div className="browser">
      <div className="addressbar">
        <span>Address</span>
        <div className="field sunken">http://www.{owner.domain}/links.html</div>
      </div>
      <div className="paper-scroll sunken">
        <div className="webpage">
          <h1>~*~ LiNkS ~*~</h1>

          <h2>find me</h2>
          <ul>
            {links.me.map((link) => (
              <li key={link.label}>
                {link.url ? (
                  <a href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <span className="plain-link">{link.label}</span>
                )}
              </li>
            ))}
          </ul>

          {links.cool.length > 0 && (
            <>
              <h2>cool sites</h2>
              <ul>
                {links.cool.map((link) => (
                  <li key={link.label}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>my button</h2>
          <div className="button-88x31">{owner.handle}</div>
        </div>
      </div>
    </div>
  )
}
