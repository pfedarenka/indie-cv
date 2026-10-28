import { Icon } from '../components/Icon'

const facts = [
  { label: 'subject', value: 'Alexander the Great as Helios' },
  { label: 'object', value: 'plaster cast of a Roman marble copy of a Hellenistic original' },
  { label: 'height', value: '71 cm' },
  { label: 'collection', value: 'The Royal Cast Collection, SMK – National Gallery of Denmark (KAS283)' },
  { label: 'license', value: 'public domain' },
]

export function HeliosApp() {
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
          {facts.map((fact) => (
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
