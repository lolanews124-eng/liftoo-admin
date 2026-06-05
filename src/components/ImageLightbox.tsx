import { useEffect } from 'react';

type ImageLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" role="dialog" aria-modal="true" aria-label="Document preview" onClick={onClose}>
      <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close preview">
          ×
        </button>
        <img src={src} alt={alt} className="lightbox-image" />
        <a href={src} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm lightbox-open">
          Open in new tab
        </a>
      </div>
    </div>
  );
}
