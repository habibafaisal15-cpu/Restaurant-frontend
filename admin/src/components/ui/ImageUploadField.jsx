import { useEffect, useId, useRef, useState } from 'react';
import { ImageIcon, Link2, Upload, X } from 'lucide-react';
import { uploadImage, isImageFile } from '../../api/upload';
import { resolveMediaUrl } from '../../api/adapters';
import './ImageUploadField.css';

const MAX_FILE_MB = 4;

export default function ImageUploadField({
  label,
  value = '',
  onChange,
  placeholder = 'https://… or upload a file',
  uploadFolder = 'products',
}) {
  const uid = useId();
  const fileRef = useRef(null);
  const [mode, setMode] = useState('upload');
  const [error, setError] = useState('');
  const [imgBroken, setImgBroken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    setImgBroken(false);
  }, [value]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleUrlChange = (e) => {
    setError('');
    setImgBroken(false);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
    onChange?.(e.target.value);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!isImageFile(file)) {
      setError('Please select an image file (JPG, PNG, WEBP…)');
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_FILE_MB}MB`);
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    setError('');
    setImgBroken(false);

    try {
      const url = await uploadImage(file, uploadFolder);
      onChange?.(url);
      setMode('upload');
    } catch (err) {
      setError(err.message || 'Upload failed — try again');
      URL.revokeObjectURL(objectUrl);
      setLocalPreview('');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setError('');
    setImgBroken(false);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
    onChange?.('');
  };

  const remotePreview =
    value && !String(value).startsWith('data:') ? resolveMediaUrl(value) : '';
  const previewUrl = localPreview || remotePreview;
  const showPreview = Boolean(previewUrl) && !imgBroken;

  return (
    <div className="form-group image-upload-field">
      {label && <span className="image-upload-field__label">{label}</span>}

      <div className="image-upload-field__modes" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'upload'}
          className={`image-upload-field__mode ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
        >
          <Upload size={14} />
          Upload image
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'link'}
          className={`image-upload-field__mode ${mode === 'link' ? 'active' : ''}`}
          onClick={() => setMode('link')}
        >
          <Link2 size={14} />
          Image URL
        </button>
      </div>

      <div className="image-upload-field__row">
        <div className="image-upload-field__preview">
          {showPreview ? (
            <img
              src={previewUrl}
              alt="Preview"
              onError={() => {
                if (!localPreview) setImgBroken(true);
              }}
            />
          ) : (
            <div className="image-upload-field__placeholder">
              <ImageIcon size={22} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="image-upload-field__controls">
          {mode === 'upload' ? (
            <>
              <input
                ref={fileRef}
                id={`${uid}-file`}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.jfif"
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
              <p className="form-hint">
                {uploading
                  ? 'Uploading to server…'
                  : value
                    ? 'Image ready — save the deal to apply it'
                    : `Saved to server (max ${MAX_FILE_MB}MB)`}
              </p>
            </>
          ) : (
            <div className="image-upload-field__input-wrap">
              <Link2 size={16} className="image-upload-field__icon" aria-hidden="true" />
              <input
                id={`${uid}-url`}
                type="text"
                inputMode="url"
                className="form-control image-upload-field__input"
                value={value?.startsWith('data:') ? '' : value}
                onChange={handleUrlChange}
                placeholder={placeholder}
              />
            </div>
          )}

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

      {error && <p className="form-error">{error}</p>}
      {!error && imgBroken && remotePreview && !localPreview && (
        <p className="form-error">
          Image could not be loaded — try another file or URL
        </p>
      )}
    </div>
  );
}
