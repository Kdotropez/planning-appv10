import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage } from '../../utils/localStorage';
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
    const [weekTarget, setWeekTarget] = useState('');
    const [showWeekCopyModal, setShowWeekCopyModal] = useState(false);

    const days = config.days || [
        { name: 'Lundi' },
        { name: 'Mardi' },
        { name: 'Mercredi' },
        { name: 'Jeudi' },
        { name: 'Vendredi' },
        { name: 'Samedi' },
        { name: 'Dimanche' }
    ];

    const weeks = [];
    for (let i = -4; i <= 4; i++) {
        const weekStart = addDays(new Date(selectedWeek), i * 7);
        weeks.push({
            value: format(weekStart, 'yyyy-MM-dd'),
            label: `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`
        });
    }

    const handleWeekCopy = () => {
        if (!weekTarget) {
            setFeedback({ type: 'error', message: 'Veuillez sélectionner une semaine cible.' });
            return;
        }
        setShowWeekCopyModal(true);
    };

    const confirmWeekCopy = () => {
        if (typeof setGlobalPlanning !== 'function') {
            console.error('WeekCopySection: setGlobalPlanning is not a function', { setGlobalPlanning });
            setFeedback({ type: 'error', message: 'Erreur : impossible de mettre à jour le planning.' });
            return;
        }
        console.log('WeekCopySection: Copying entire week', { weekSource: selectedWeek, weekTarget });
        const newPlanning = { ...planning };
        selectedEmployees.forEach(employee => {
            days.forEach((day, index) => {
                const sourceKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                const targetKey = format(addDays(new Date(weekTarget), index), 'yyyy-MM-dd');
                if (!newPlanning[employee]) newPlanning[employee] = {};
                newPlanning[employee][targetKey] = [...(planning[employee]?.[sourceKey] || config.timeSlots.map(() => false))];
            });
        });
        setGlobalPlanning(newPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${weekTarget}`, newPlanning);
        setFeedback({
            type: 'success',
            message: `Planning de la semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })} copié vers la semaine du ${format(new Date(weekTarget), 'd MMMM yyyy', { locale: fr })}.`
        });
        setShowWeekCopyModal(false);
        setWeekTarget('');
    };

    return (
        <div className="week-copy-section">
            <div className="week-copy-container">
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Copier toute la semaine
                </h3>
                <div className="form-group">
                    <label>Semaine source (courante)</label>
                    <input
                        type="text"
                        value={`Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}`}
                        readOnly
                        className="copy-paste-select"
                    />
                </div>
                <div className="form-group">
                    <label>Semaine cible</label>
                    <select
                        className="copy-paste-select"
                        value={weekTarget}
                        onChange={(e) => setWeekTarget(e.target.value)}
                    >
                        <option value="">Sélectionner une semaine</option>
                        {weeks.map(week => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="navigation-buttons">
                    <Button
                        className="button-primary"
                        onClick={handleWeekCopy}
                        text="Copier la semaine entière"
                    />
                </div>
                {showWeekCopyModal && (
                    <div className="modal-overlay">
                        <div className="modal-content copy-paste-modal">
                            <button
                                className="modal-close"
                                onClick={() => setShowWeekCopyModal(false)}
                            >
                                ✕
                            </button>
                            <h3>Confirmer la copie de la semaine</h3>
                            <p>
                                Voulez-vous copier tout le planning de la semaine du{' '}
                                {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}{' '}
                                vers la semaine du {format(new Date(weekTarget), 'd MMMM yyyy', { locale: fr })} ?
                            </p>
                            <Button
                                className="button-validate"
                                onClick={confirmWeekCopy}
                                text="Confirmer"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeekCopySection;