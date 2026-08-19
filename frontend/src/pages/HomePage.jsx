import { Link } from 'react-router-dom'
import usePageStyles from '../components/usePageStyles.js'

const workspaces = [
  { path: '/code-sharing', image: 'codeshare.png', label: 'Code Share', alt: 'Code Share' },
  { path: '/file-sharing', image: 'fileshare.png', label: 'File Share', alt: 'File Share' },
  { path: '/whiteboard', image: 'whiteboard.png', label: 'Whiteboard', alt: 'Whiteboard' },
  { path: '/flowchart', image: 'flowchart.png', label: 'Flowchart', alt: 'Flowchart' },
  { path: '/chat', image: 'ai.png', label: 'AI Tools', alt: 'AI Tools' },
  { path: '/presentation', image: 'ppt.png', label: 'Presentation', alt: 'Presentation' },
]

export default function HomePage() {
  usePageStyles('home.css')

  return (
    <>
      <div className="overlay" />
      <main className="container">
        <h1>CollabHub</h1>
        <p className="subtitle">Choose a Workspace</p>

        <section className="glass-card">
          {workspaces.map((workspace) => (
            <Link key={workspace.path} to={workspace.path} className="category">
              <img src={`/assets/images/${workspace.image}`} alt={workspace.alt} />
              <p>{workspace.label}</p>
            </Link>
          ))}
        </section>

        <footer>
          <p>© 2025 CollabHub. Built for hassle-free teamwork.</p>
        </footer>
      </main>
    </>
  )
}
