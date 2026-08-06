import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import './BackButton.css';

function BackButton({ label = 'Back', to = ROUTES.HOME, className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(to);
  };

  return (
    <button
      type="button"
      className={`back-button ${className}`.trim()}
      onClick={handleBack}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

export default BackButton;
