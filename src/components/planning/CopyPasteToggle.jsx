import React from 'react';
import Button from '../common/Button';
import '@/assets/styles.css';

const CopyPasteToggle = ({
  showCopyPaste,
  setShowCopyPaste,
  showWeekCopy,
  setShowWeekCopy,
  setLocalFeedback
}) => {
  return (
    <div className="copy-paste-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
      <Button
        className={`button-toggle ${showCopyPaste ? 'active' : ''}`}
        onClick={() => {
          setShowCopyPaste(!showCopyPaste);
          setShowWeekCopy(false);
          setLocalFeedback('');
        }}
      >
        {showCopyPaste ? 'Masquer Copier/Coller' : 'Afficher Copier/Coller'}
      </Button>
      <Button
        className={`button-toggle ${showWeekCopy ? 'active' : ''}`}
        onClick={() => {
          setShowWeekCopy(!showWeekCopy);
          setShowCopyPaste(false);
          setLocalFeedback('');
        }}
      >
        {showWeekCopy ? 'Masquer Copie Semaine' : 'Afficher Copie Semaine'}
      </Button>
    </div>
  );
};

export default CopyPasteToggle;