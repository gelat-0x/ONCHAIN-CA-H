import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackArrow = () => {
  const navigate = useNavigate();

  return (
    <div className="learn-back-arrow fixed top-20 left-0 right-0 z-30 px-6 max-w-6xl mx-auto flex items-center justify-between">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );
};

export default BackArrow;
