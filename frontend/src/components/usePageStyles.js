import { useEffect } from 'react'

export default function usePageStyles(fileName) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `/styles/${fileName}`
    link.dataset.collabhubPageStyle = fileName
    document.head.appendChild(link)

    return () => link.remove()
  }, [fileName])
}
