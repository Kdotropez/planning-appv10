import { useState } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const ResetModal = ({ config, selectedWeek, selectedShop, selectedEmployees, setPlanning, setFeedback, showResetModal, setShowResetModal }) => {
    const [confirmReset, setConfirmReset] = useState('');

    const handleReset = () => {
        if (confirmReset.toLowerCase() !== 'confirmer') {
            setFeedback('Erreur: Veuillez entrer "confirmer" pour réinitialiser.');
            return;
        }
        try {
            localStorage.removeItem(`planning_${selectedShop}_${selectedWeek}`);
            localStorage.removeItem(`selected_employees_${selectedShop}_${selectedWeek}`);
            localStorage.removeItem(`lastPlanning_${selectedShop}`);
            localStorage.removeItem('config');
            localStorage.removeItem('selectedShop');
            localStorage.removeItem('selectedWeek');
            setPlanning({});
            setFeedback('Succès: Toutes les données ont été réinitialisées.');
            setShowResetModal(false);
            setConfirmReset('');
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            setFeedback('Erreur: Échec de la réinitialisation.');
        }
    };

    return showResetModal ? (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={() => setShowResetModal(false)}>
                    X
                </button>
                <h2>Réinitialiser le planning</h2>
                <p>
                    Cette action supprimera toutes les données du planning pour {selectedShop} et la semaine du {selectedWeek}.
                    Veuillez taper "confirmer" pour continuer.
                </p>
                <input
                    type="text"
                    value={confirmReset}
                    onChange={(e) => setConfirmReset(e.target.value)}
                    placeholder="Taper 'confirmer'"
                    className="calendar-input"
                />
                <div className="button-group">
                    <Button
                        className="button-base button-reinitialiser"
                        onClick={handleReset}
                        text="Réinitialiser"
                    />
                    <Button
                        className="button-base button-retour"
                        onClick={() => setShowResetModal(false)}
                        text="Annuler"
                    />
                </div>
            </div>
        </div>
    ) : null;
};

export default ResetModal;