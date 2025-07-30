import React, { useState } from 'react';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekCopySection = ({
  config,
  selectedShop,
  selectedWeek,
  selectedEmployees,
  planning,
  setGlobalPlanning,
  setFeedback
}) => {
  const [showWeekCopyModal, setShowWeekCopyModal] = useState(false);

  console.log('WeekCopySection: Rendering component', {
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning,
    showWeekCopyModal
  });

  return (
    <div className="week-copy-section">
      <div className="week-copy-container">
        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
          Copie Semaine vide
        </h3>
        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
          Section temporaire pour {selectedShop} - Semaine du {selectedWeek}
        </p>
        {showWeekCopyModal && (
          <div className="modal-overlay">
            <div className="modal-content copy-paste-modal">
              <button
                className="modal-close"
                onClick={() => {
                  console.log('WeekCopySection: Closing week copy modal');
                  setShowWeekCopyModal(false);
                }}
              >
                ✕
              </button>
              <h3>Modal Copie Semaine vide</h3>
              <p>Modal temporaire</p>
              <Button
                className="button-validate"
                onClick={() => {
                  console.log('WeekCopySection: Confirm week copy');
                  setShowWeekCopyModal(false);
                }}
                text="Fermer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekCopySection;