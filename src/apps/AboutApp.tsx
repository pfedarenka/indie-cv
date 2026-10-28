import { owner } from '../content'
import { Icon } from '../components/Icon'

export function AboutApp() {
  return (
    <div className="pane scroll">
      <div className="about-head">
        <div className="avatar sunken">
          <Icon name="computer" size={64} />
        </div>
        <div>
          <h1>{owner.name}</h1>
          <p className="tagline">{owner.tagline}</p>
          <p className="muted">{owner.location}</p>
        </div>
      </div>

      <fieldset className="group">
        <legend>About me</legend>
        {owner.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </fieldset>

      <fieldset className="group">
        <legend>Currently</legend>
        <dl className="now">
          {owner.now.map((item) => (
            <div key={item.label}>
              <dt>{item.label}:</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </fieldset>

      <p className="muted small">last updated: {owner.updated}</p>
    </div>
  )
}
