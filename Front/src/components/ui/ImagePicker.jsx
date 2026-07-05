import { ImagePlus, LoaderCircle, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadsService } from '../../services/uploads.service'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errors'

export default function ImagePicker({ type, value, onChange, label = 'Choose image' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be 5MB or smaller.', 'error')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadsService.upload(file, type)
      onChange(imageUrl)
      showToast('Image uploaded.')
    } catch (error) {
      showToast(getErrorMessage(error, 'Image upload failed.'), 'error')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="image-picker">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFile} hidden />
      {value ? (
        <div className="image-picker__preview">
          <img src={value} alt="Upload preview" />
          <button type="button" onClick={() => onChange('')} aria-label="Remove image"><X size={16} /></button>
        </div>
      ) : (
        <button type="button" className="image-picker__button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <LoaderCircle className="spin" size={18} /> : <ImagePlus size={18} />}
          {uploading ? 'Uploading…' : label}
        </button>
      )}
    </div>
  )
}
