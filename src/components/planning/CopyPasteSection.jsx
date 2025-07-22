import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const CopyPasteSection = ({
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning,
    setPlanning,
    setFeedback
}) => {
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [sourceWeek, setSourceWeek] = useState('');
    const [sourceDay, setSourceDay] = useState('');
    const [targetWeek, setTargetWeek] = useState('');
    const [targetDay, setTargetDay] = useState('');
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [showWeekCopyModal, setShowWeekCopyModal] = useState(false);
    const [weekSource, setWeekSource] = useState('');
    const [weekTarget, setWeekTarget] = useState('');

    const days = config.days || [
        { name: 'Lundi' },
        { name: 'Mardi' },
        { name: 'Mercredi' },
        { name: 'Jeudi' },
        { name: 'Vendredi' },
        { name: 'Samedi' },
        { name: 'Dimanche' }
    ];

    const getEmployeeColorClass = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return index >= 0 ? colors[index % colors.length] : '';
    };

    const weeks = [];
    for (let i = -4; i <= 4; i++) {
        const weekStart = addDays(new Date(selectedWeek), i * 7);
        weeks.push({
            value: format(weekStart, 'yyyy-MM-dd'),
            label: `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`
        });
    }

    const dayOptions = [
        { value: 'all', label: 'Tous les jours' },
        ...days.map((day, index) => ({
            value: format(addDays(new Date(sourceWeek || selectedWeek), index), 'yyyy-MM-dd'),
            label: `${day.name} ${format(addDays(new Date(sourceWeek || selectedWeek), index), 'dd/MM', { locale: fr })}`
        }))
    ];

    const targetDayOptions = [
        { value: 'all', label: 'Tous les jours' },
        ...days.map((day, index) => ({
            value: format(addDays(new Date(targetWeek || selectedWeek), index), 'yyyy-MM-dd'),
            label: `${day.name} ${format(addDays(new Date(targetWeek || selectedWeek), index), 'dd/MM', { locale: fr })}`
        }))
    ];

    const handleCopy = () => {
        if (!sourceEmployee || !sourceWeek) {
            setFeedback({ type: 'error', message: 'Veuillez sélectionner un employé source et une semaine source.' });
            return;
        }
        setShowCopyModal(true);
    };

    const confirmCopy = () => {
        console.log('CopyPasteSection: Copying', { sourceEmployee, sourceWeek, sourceDay });
        setFeedback({
            type: 'success',
            message: `Créneaux de ${sourceEmployee} ${sourceDay === 'all' ? 'pour toute la semaine' : `du ${dayOptions.find(opt => opt.value === sourceDay)?.label}`} copiés.`
        });
        setShowCopyModal(false);
    };

    const handlePaste = () => {
        if (!sourceEmployee || !sourceWeek || !targetWeek) {
            setFeedback({ type: 'error', message: 'Veuillez sélectionner un employé source, une semaine source et une semaine cible.' });
            return;
        }
        setShowPasteModal(true);
    };

    const confirmPaste = () => {
        console.log('CopyPasteSection: Pasting', { sourceEmployee, sourceWeek, sourceDay, targetWeek, targetDay });
        const newPlanning = { ...planning };

        if (sourceDay === 'all' && targetDay === 'all') {
            // Copier toute la semaine source vers toute la semaine cible
            selectedEmployees.forEach(employee => {
                if (employee !== sourceEmployee) {
                    days.forEach((day, index) => {
                        const sourceKey = format(addDays(new Date(sourceWeek), index), 'yyyy-MM-dd');
                        const targetKey = format(addDays(new Date(targetWeek), index), 'yyyy-MM-dd');
                        if (!newPlanning[employee]) newPlanning[employee] = {};
                        newPlanning[employee][targetKey] = [...(planning[sourceEmployee]?.[sourceKey] || config.timeSlots.map(() => false))];
                    });
                }
            });
        } else if (sourceDay === 'all') {
            // Copier toute la semaine source vers un jour cible
            selectedEmployees.forEach(employee => {
                if (employee !== sourceEmployee) {
                    days.forEach((day, index) => {
                        const sourceKey = format(addDays(new Date(sourceWeek), index), 'yyyy-MM-dd');
                        if (!newPlanning[employee]) newPlanning[employee] = {};
                        newPlanning[employee][targetDay] = [...(planning[sourceEmployee]?.[sourceKey] || config.timeSlots.map(() => false))];
                    });
                }
            });
        } else if (targetDay === 'all') {
            // Copier un jour source vers toute la semaine cible
            selectedEmployees.forEach(employee => {
                if (employee !== sourceEmployee) {
                    days.forEach((day, index) => {
                        const targetKey = format(addDays(new Date(targetWeek), index), 'yyyy-MM-dd');
                        if (!newPlanning[employee]) newPlanning[employee] = {};
                        newPlanning[employee][targetKey] = [...(planning[sourceEmployee]?.[sourceDay] || config.timeSlots.map(() => false))];
                    });
                }
            });
        } else {
            // Copier un jour source vers un jour cible
            selectedEmployees.forEach(employee => {
                if (employee !== sourceEmployee) {
                    if (!newPlanning[employee]) newPlanning[employee] = {};
                    newPlanning[employee][targetDay] = [...(planning[sourceEmployee]?.[sourceDay] || config.timeSlots.map(() => false))];
                }
            });
        }

        setPlanning(newPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${targetWeek}`, newPlanning);
        setFeedback({
            type: 'success',
            message: `Créneaux de ${sourceEmployee} ${sourceDay === 'all' ? 'pour toute la semaine' : `du ${dayOptions.find(opt => opt.value === sourceDay)?.label}`} collés ${targetDay === 'all' ? 'sur toute la semaine' : `sur ${targetDayOptions.find(opt => opt.value === targetDay)?.label}`} de la semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}.`
        });
        setShowPasteModal(false);
        setSourceEmployee('');
        setSourceWeek('');
        setSourceDay('');
        setTargetWeek('');
        setTargetDay('');
    };

    const handleWeekCopy = () => {
        if (!weekSource || !weekTarget) {
            setFeedback({ type: 'error', message: 'Veuillez sélectionner une semaine source et une semaine cible.' });
            return;
        }
        setShowWeekCopyModal(true);
    };

    const confirmWeekCopy = () => {
        console.log('CopyPasteSection: Copying entire week', { weekSource, weekTarget });
        const newPlanning = { ...planning };
        selectedEmployees.forEach(employee => {
            days.forEach((day, index) => {
                const sourceKey = format(addDays(new Date(weekSource), index), 'yyyy-MM-dd');
                const targetKey = format(addDays(new Date(weekTarget), index), 'yyyy-MM-dd');
                if (!newPlanning[employee]) newPlanning[employee] = {};
                newPlanning[employee][targetKey] = [...(planning[employee]?.[sourceKey] || config.timeSlots.map(() => false))];
            });
        });
        setPlanning(newPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${weekTarget}`, newPlanning);
        setFeedback({
            type: 'success',
            message: `Planning de la semaine du ${format(new Date(weekSource), 'd MMMM yyyy', { locale: fr })} copié vers la semaine du ${format(new Date(weekTarget), 'd MMMM yyyy', { locale: fr })}.`
        });
        setShowWeekCopyModal(false);
        setWeekSource('');
        setWeekTarget('');
    };

    return (
        <div className="copy-paste-section">
            <div className="copy-paste-container">
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Copier/Coller les créneaux d’un employé
                </h3>
                <div className="form-group">
                    <label>Employé source</label>
                    <select
                        className="copy-paste-select"
                        value={sourceEmployee}
                        onChange={(e) => setSourceEmployee(e.target.value)}
                    >
                        <option value="">Sélectionner un employé</option>
                        {selectedEmployees.map(employee => (
                            <option key={employee} value={employee}>
                                {employee}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Semaine source</label>
                    <select
                        className="copy-paste-select"
                        value={sourceWeek}
                        onChange={(e) => setSourceWeek(e.target.value)}
                    >
                        <option value="">Sélectionner une semaine</option>
                        {weeks.map(week => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Jour source</label>
                    <select
                        className="copy-paste-select"
                        value={sourceDay}
                        onChange={(e) => setSourceDay(e.target.value)}
                    >
                        <option value="">Sélectionner un jour</option>
                        {dayOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Semaine cible</label>
                    <select
                        className="copy-paste-select"
                        value={targetWeek}
                        onChange={(e) => setTargetWeek(e.target.value)}
                    >
                        <option value="">Sélectionner une semaine</option>
                        {weeks.map(week => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Jour cible</label>
                    <select
                        className="copy-paste-select"
                        value={targetDay}
                        onChange={(e) => setTargetDay(e.target.value)}
                    >
                        <option value="">Sélectionner un jour</option>
                        {targetDayOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="navigation-buttons">
                    <Button
                        className="button-primary"
                        onClick={handleCopy}
                        text="Copier"
                    />
                    <Button
                        className="button-validate"
                        onClick={handlePaste}
                        text="Coller"
                    />
                </div>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', margin: '20px 0 15px' }}>
                    Copier toute la semaine
                </h3>
                <div className="form-group">
                    <label>Semaine source</label>
                    <select
                        className="copy-paste-select"
                        value={weekSource}
                        onChange={(e) => setWeekSource(e.target.value)}
                    >
                        <option value="">Sélectionner une semaine</option>
                        {weeks.map(week => (
                            <option key={week.value} value={week.value}>
                                {week.label}
                            </option>
                        ))}
                    </select>
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
                {showCopyModal && (
                    <div className="modal-overlay">
                        <div className="modal-content copy-paste-modal">
                            <button
                                className="modal-close"
                                onClick={() => setShowCopyModal(false)}
                            >
                                ✕
                            </button>
                            <h3>Confirmer la copie</h3>
                            <p>
                                Voulez-vous copier les créneaux de{' '}
                                <span className={getEmployeeColorClass(sourceEmployee)}>
                                    {sourceEmployee}
                                </span>{' '}
                                {sourceDay === 'all' ? 'pour toute la semaine' : `du ${dayOptions.find(opt => opt.value === sourceDay)?.label}`} ?
                            </p>
                            <Button
                                className="button-validate"
                                onClick={confirmCopy}
                                text="Confirmer"
                            />
                        </div>
                    </div>
                )}
                {showPasteModal && (
                    <div className="modal-overlay">
                        <div className="modal-content copy-paste-modal">
                            <button
                                className="modal-close"
                                onClick={() => setShowPasteModal(false)}
                            >
                                ✕
                            </button>
                            <h3>Confirmer le collage</h3>
                            <p>
                                Voulez-vous coller les créneaux de{' '}
                                <span className={getEmployeeColorClass(sourceEmployee)}>
                                    {sourceEmployee}
                                </span>{' '}
                                {sourceDay === 'all' ? 'pour toute la semaine' : `du ${dayOptions.find(opt => opt.value === sourceDay)?.label}`}{' '}
                                sur {targetDay === 'all' ? 'tous les employés pour toute la semaine' : `tous les employés pour ${targetDayOptions.find(opt => opt.value === targetDay)?.label}`}{' '}
                                de la semaine du {format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })} ?
                            </p>
                            <Button
                                className="button-validate"
                                onClick={confirmPaste}
                                text="Confirmer"
                            />
                        </div>
                    </div>
                )}
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
                                {format(new Date(weekSource), 'd MMMM yyyy', { locale: fr })}{' '}
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

export default CopyPasteSection;