import { useState } from 'react';
import { format, addDays, isValid } from 'date-fns';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import { getAvailableWeeks } from '../../utils/planningUtils';
import Button from '../common/Button';
import '../../assets/styles.css';

const CopyPasteSection = ({ config, selectedWeek, selectedShop, planning, selectedEmployees, setPlanning, setFeedback }) => {
    const [sourceWeek, setSourceWeek] = useState('');
    const [sourceDay, setSourceDay] = useState('');
    const [targetDays, setTargetDays] = useState([]);
    const availableWeeks = getAvailableWeeks(selectedShop);

    const handleCopyPaste = () => {
        if (!sourceWeek || !sourceDay || targetDays.length === 0) {
            setFeedback('Erreur: Veuillez sélectionner une semaine source, un jour source, et au moins un jour cible.');
            return;
        }
        const sourcePlanning = loadFromLocalStorage(`planning_${selectedShop}_${sourceWeek}`, {});
        if (!sourcePlanning || Object.keys(sourcePlanning).length === 0) {
            setFeedback('Erreur: Aucun planning trouvé pour la semaine source sélectionnée.');
            return;
        }
        const updatedPlanning = JSON.parse(JSON.stringify(planning));
        selectedEmployees.forEach(employee => {
            if (!sourcePlanning[employee]) return;
            const sourceDayKey = format(addDays(new Date(sourceWeek), parseInt(sourceDay)), 'yyyy-MM-dd');
            const sourceSlots = sourcePlanning[employee][sourceDayKey] || [];
            targetDays.forEach(targetDayIndex => {
                const targetDayKey = format(addDays(new Date(selectedWeek), targetDayIndex), 'yyyy-MM-dd');
                if (!updatedPlanning[employee]) {
                    updatedPlanning[employee] = {};
                }
                updatedPlanning[employee][targetDayKey] = [...sourceSlots];
            });
        });
        setPlanning(updatedPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
        setFeedback('Succès: Planning copié avec succès.');
        setSourceWeek('');
        setSourceDay('');
        setTargetDays([]);
    };

    const days = Array.from({ length: 7 }, (_, i) => ({
        name: format(addDays(new Date(selectedWeek), i), 'EEEE'),
        index: i
    }));

    return (
        <div className="copy-paste-section">
            <div className="copy-paste-container">
                <h3>Copier-Coller le Planning</h3>
                <div className="copy-paste-form">
                    <div className="form-group">
                        <label>Semaine Source</label>
                        <select value={sourceWeek} onChange={(e) => setSourceWeek(e.target.value)}>
                            <option value="">Sélectionner une semaine</option>
                            {availableWeeks.map(week => (
                                <option key={week.key} value={week.key}>{week.display}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Jour Source</label>
                        <select value={sourceDay} onChange={(e) => setSourceDay(e.target.value)}>
                            <option value="">Sélectionner un jour</option>
                            {days.map(day => (
                                <option key={day.index} value={day.index}>{day.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Jours Cibles</label>
                        <div className="target-days-grid">
                            {days.map(day => (
                                <div key={day.index} className="target-day-item">
                                    <input
                                        type="checkbox"
                                        checked={targetDays.includes(day.index)}
                                        onChange={() => {
                                            setTargetDays(prev =>
                                                prev.includes(day.index)
                                                    ? prev.filter(d => d !== day.index)
                                                    : [...prev, day.index]
                                            );
                                        }}
                                    />
                                    {day.name}
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button
                        className="button-base button-primary"
                        onClick={handleCopyPaste}
                        text="Copier-Coller"
                    />
                </div>
            </div>
        </div>
    );
};

export default CopyPasteSection;