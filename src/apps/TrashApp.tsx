import { useState } from 'react'
import { Icon } from '../components/Icon'

const junk = [
  'portfolio_FINAL_final_v3.psd',
  'my_first_website.html',
  'motivation.exe',
  'good_sleep_schedule.dll',
  'unfinished_projects (47).zip',
]

export function TrashApp() {
  const [denied, setDenied] = useState(false)

  return (
    <div className="pane scroll">
      <ul className="trash-list">
        {junk.map((file) => (
          <li key={file}>
            <Icon name="document" size={16} />
            {file}
          </li>
        ))}
      </ul>
      <button type="button" className="button" onClick={() => setDenied(true)}>
        Empty Recycle Bin
      </button>
      {denied && <p className="error-text">Access denied: these files are emotionally load-bearing.</p>}
    </div>
  )
}
