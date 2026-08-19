import { useRef, useState } from 'react'
import usePageStyles from '../components/usePageStyles.js'
import { apiUrl, readJsonResponse } from '../services/api.js'

export default function FileSharingPage() {
  usePageStyles('filesharing.css')
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [fileLinks, setFileLinks] = useState(null)
  const [fetching, setFetching] = useState(false)

  const chooseFiles = () => fileInputRef.current?.click()

  const handleFilesSelected = (event) => {
    setSelectedFiles(Array.from(event.target.files || []))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      window.alert('Please select at least one file.')
      return
    }

    const formData = new FormData()
    selectedFiles.forEach((file) => formData.append('files', file))
    setUploadStatus('Uploading...')

    try {
      const response = await fetch(apiUrl('/api/fileshare/upload'), {
        method: 'POST',
        body: formData,
      })
      const data = await readJsonResponse(response)
      setUploadStatus(data.success ? `✅ Uploaded! Share Code: ${data.shareCode}` : '❌ Upload failed.')
    } catch (error) {
      console.error(error)
      setUploadStatus('❌ Error uploading files (server may be offline).')
    }
  }

  const fetchFiles = async () => {
    const code = shareCode.trim().toUpperCase()
    if (!code) {
      window.alert('Enter a share code!')
      return
    }

    setFetching(true)
    setFileLinks('Fetching...')
    try {
      const response = await fetch(apiUrl(`/api/fileshare/${encodeURIComponent(code)}`))
      const data = await readJsonResponse(response)
      setFileLinks(data.success ? data.files : [])
    } catch (error) {
      console.error(error)
      setFileLinks([])
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="container">
      <h1 className="heading"><i className="fa-solid fa-share-nodes" /> File Sharing</h1>

      <div className="card upload-card">
        <h2><i className="fa-solid fa-upload" /> Send Files</h2>
        <p>Select and upload your files. A unique code will be generated to share.</p>
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilesSelected} />
        <button type="button" className="btn" onClick={chooseFiles}>
          <i className="fa-solid fa-folder-open" /> Choose Files
        </button>
        <div id="fileList">
          {selectedFiles.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}
        </div>
        <button type="button" className="btn upload" onClick={uploadFiles}>
          <i className="fa-solid fa-cloud-arrow-up" /> Upload
        </button>
        <div id="uploadStatus">{uploadStatus}</div>
      </div>

      <div className="card download-card">
        <h2><i className="fa-solid fa-download" /> Receive Files</h2>
        <p>Enter the share code to access the uploaded files.</p>
        <input
          type="text"
          id="shareCodeInput"
          placeholder="Enter Share Code"
          value={shareCode}
          onChange={(event) => setShareCode(event.target.value)}
        />
        <button type="button" className="btn" onClick={fetchFiles} disabled={fetching}>
          <i className="fa-solid fa-magnifying-glass" /> Fetch Files
        </button>
        <div id="fileLinks">
          {fileLinks === 'Fetching...' && <span>Fetching...</span>}
          {Array.isArray(fileLinks) && fileLinks.length === 0 && <span>❌ Invalid or expired code.</span>}
          {Array.isArray(fileLinks) && fileLinks.map((file) => (
            <a key={file.downloadUrl} href={apiUrl(file.downloadUrl)} download={file.filename}>
              {file.filename}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
