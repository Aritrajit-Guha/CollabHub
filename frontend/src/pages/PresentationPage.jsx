import usePageStyles from '../components/usePageStyles.js'

export default function PresentationPage() {
  usePageStyles('ppt.css')

  return (
    <main className="presentation-placeholder">
      <h1>Presentation Workspace</h1>
      <p>The presentation workspace is not implemented in the current application yet.</p>
    </main>
  )
}
