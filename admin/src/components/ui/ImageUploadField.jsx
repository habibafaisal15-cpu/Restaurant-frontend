import { useId, useRef, useState } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { uploadImage } from '../../api/upload';
import { resolveMediaUrl } from '../../api/adapters';
import './ImageUploadField.css';

const MAX_FILE_MB = 4;

export default function ImageUploadField({
  label,
  value = '',
  onChange,
  uploadFolder = 'products',
}) {
  const uid = useId();
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [imgBroken, setImgBroken] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP…)');
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_FILE_MB}MB`);
      return;
    }

    setUploading(true);
    setError('');
    setImgBroken(false);

    try {
      const url = await uploadImage(file, uploadFolder);
      onChange?.(url);
    } catch (err) {
      setError(err.message || 'Upload failed — try again');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setError('');
    setImgBroken(false);
    onChange?.('');
  };

  const previewUrl =
    value && !String(value).startsWith('data:') ? resolveMediaUrl(value) : '';
  const showPreview = Boolean(previewUrl) && !imgBroken;

  return (
    <div className="form-group image-upload-field">
      {label && <span className="image-upload-field__label">{label}</span>}

      <div className="image-upload-field__row">
        <div className="image-upload-field__preview">
          {showPreview ? (
            <img
              src={previewUrl}
              alt="Preview"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <div className="image-upload-field__placeholder">
              <ImageIcon size={22} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="image-upload-field__controls">
          <input
            ref={fileRef}
            id={`${uid}-file`}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="image-upload-field__file-input"
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm image-upload-field__upload-btn"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} />
            {uploading ? 'Uploading…' : value ? 'Change image' : 'Choose image'}
          </button>
          <p className="form-hint">Saved to server (max {MAX_FILE_MB}MB)</p>

          {value && (
            <button
              type="button"
              className="btn btn-ghost btn-sm image-upload-field__clear"
              onClick={clearImage}
            >
              <X size={14} />
              Clear image
            </button>
          )}
        </div>
      </div>

      {(error || (imgBroken && previewUrl)) && (
        <p className="form-error">
          {error || 'Image could not be loaded — try another file'}
        </p>
      )}
    </div>
  );
}
