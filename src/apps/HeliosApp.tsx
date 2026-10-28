import { Helmet } from '../components/Helmet'
import { Icon } from '../components/Icon'
import { useTheme } from '../themes'

const heliosFacts = [
  { label: 'subject', value: 'Alexander the Great as Helios' },
  { label: 'object', value: 'plaster cast of a Roman marble copy of a Hellenistic original' },
  { label: 'height', value: '71 cm' },
  { label: 'collection', value: 'The Royal Cast Collection, SMK – National Gallery of Denmark (KAS283)' },
  { label: 'license', value: 'public domain' },
]

const helmetStats = [
  { label: 'armor', value: '+2' },
  { label: 'wisdom', value: '+3' },
  { label: 'hearing', value: '−1' },
  { label: 'weight', value: '4 lb, plus regrets' },
]

// The "relic" window: info on whatever artifact the theme puts opposite the portrait.
export function HeliosApp() {
  const { relic } = useTheme()
  return relic === 'helmet' ? <HelmetCard /> : <HeliosCard />
}

function HeliosCard() {
  return (
    <div className="pane scroll">
      <div className="about-head">
        <div className="avatar sunken">
          <Icon name="column" size={48} />
        </div>
        <div>
          <h1>Helios.obj</h1>
          <p className="muted">3D scan · 30 000 triangles</p>
        </div>
      </div>
      <fieldset className="group">
        <legend>Properties</legend>
        <dl className="now">
          {heliosFacts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}:</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </fieldset>
      <p className="muted small">click the bust on the desktop to change its look ✶</p>
    </div>
  )
}

// An RPG-style item card.
function HelmetCard() {
  return (
    <div className="pane scroll relic-card">
      <div className="about-head">
        <div className="avatar sunken">
          <Helmet className="relic-helmet" />
        </div>
        <div>
          <h1>Great Helm of the Wise</h1>
          <p className="muted">relic · head slot · cursed (mildly)</p>
        </div>
      </div>
      <p className="relic-lore">
        Dented in places no one talks about. Smells faintly of old stone and older songs. Whoever wears it hears the
        dungeon breathing.
      </p>
      <fieldset className="group">
        <legend>Attributes</legend>
        <dl className="now">
          {helmetStats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}:</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </fieldset>
    </div>
  )
}
