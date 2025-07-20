import React, { useState, useEffect } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const CopyPasteSection = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, days, setAvailableWeeks, setFeedback }) => {
    const [sourceType, setSourceType] = useState('day');
    const [sourceDay, setSourceDay] = useState('');
    const [sourceWeek, setSourceWeek] = useState('');
    const [targetDays, setTargetDays] = useState([]);
    const [targetWeek, setTargetWeek] = useState('');
    const [availableWeeks, setLocalAvailableWeeks] = useState([]);

    useEffect(() => {
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('CopyPasteSection: Storage keys:', storageKeys);
        const weeks = storageKeys
            .map(key => {
                const weekKey = key.replace(`planning_${selectedShop}_`, '');
                try {
                    const weekDate = new Date(weekKey);
                    if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                        return {
                            key: weekKey,
                            display: `Semaine du ${format(weekDate, 'd MMMM yyyy', { locale: fr })}`
                        };
                    }
                    return null;
                } catch (e) {
                    console.error(`Invalid date format for key ${key}:`, e);
                    return null;
                }
            })
            .filter(week => week !== null)
            .sort((a, b) => new Date(a.key) - new Date(b.key));
        setLocalAvailableWeeks(weeks);
        console.log('CopyPasteSection: Available weeks:', weeks);
    }, [selectedShop]);

    const handleCopy = () => {
        console.log('handleCopy called with:', { sourceType, sourceDay, sourceWeek, targetDays, targetWeek });
        if (!config?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            console.log('Copy failed: Invalid time slots configuration');
            return;
        }

        if (sourceType === 'day' && !sourceDay) {
            setFeedback('Erreur: Veuillez sélectionner un jour source.');
            console.log('Copy failed: No source day selected');
            return;
        }

        if (sourceType === 'week' && !sourceWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine source.');
            console.log('Copy failed: No source week selected');
            return;
        }

        if (!targetDays.length && !targetWeek) {
            setFeedback('Erreur: Veuillez sélectionner au moins un jour ou une semaine cible.');
            console.log('Copy failed: No target selected');
            return;
        }

        const sourceData = sourceType === 'day'
            ? planning
            : loadFromLocalStorage(`planning_${selectedShop}_${sourceWeek}`, {});

        if (!sourceData || !Object.keys(sourceData).length) {
            setFeedback('Erreur: Aucune donnée à copier pour la source sélectionnée.');
            console.log('Copy failed: No source data found', { sourceData });
            return;
        }

        setPlanning(prev => {
            const updatedPlanning = { ...prev };
            const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];

            if (sourceType === 'day') {
                const sourceDayIndex = days.findIndex(d => `${d.name} ${d.date}` === sourceDay);
                if (sourceDayIndex === -1) {
                    setFeedback('Erreur: Jour source invalide.');
                    console.log('Copy failed: Invalid source day', { sourceDay });
                    return prev;
                }
                const sourceDayKey = format(addDays(new Date(selectedWeek), sourceDayIndex), 'yyyy-MM-dd');
                storedEmployees.forEach(employee => {
                    if (!sourceData[employee]?.[sourceDayKey]) {
                        console.log(`No data for employee ${employee} on ${sourceDayKey}`);
                        return;
                    }
                    targetDays.forEach(target => {
                        const targetDayIndex = days.findIndex(d => `${d.name} ${d.date}` === target);
                        const targetDayKey = format(addDays(new Date(selectedWeek), targetDayIndex), 'yyyy-MM-dd');
                        updatedPlanning[employee] = updatedPlanning[employee] || {};
                        updatedPlanning[employee][targetDayKey] = [...sourceData[employee][sourceDayKey]];
                    });
                });
            } else {
                storedEmployees.forEach(employee => {
                    updatedPlanning[employee] = updatedPlanning[employee] || {};
                    if (targetWeek) {
                        for (let i = 0; i < 7; i++) {
                            const sourceDayKey = format(addDays(new Date(sourceWeek), i), 'yyyy-MM-dd');
                            const targetDayKey = format(addDays(new Date(targetWeek), i), 'yyyy-MM-dd');
                            if (sourceData[employee]?.[sourceDayKey]) {
                                updatedPlanning[employee][targetDayKey] = [...sourceData[employee][sourceDayKey]];
                            } else {
                                updatedPlanning[employee][targetDayKey] = Array(config.timeSlots.length).fill(false);
                            }
                        }
                    } else {
                        targetDays.forEach(target => {
                            const targetDayIndex = days.findIndex(d => `${d.name} ${d.date}` === target);
                            const sourceDayKey = format(addDays(new Date(sourceWeek), targetDayIndex), 'yyyy-MM-dd');
                            const targetDayKey = format(addDays(new Date(selectedWeek), targetDayIndex), 'yyyy-MM-dd');
                            if (sourceData[employee]?.[sourceDayKey]) {
                                updatedPlanning[employee][targetDayKey] = [...sourceData[employee][sourceDayKey]];
                            } else {
                                updatedPlanning[employee][targetDayKey] = Array(config.timeSlots.length).fill(false);
                            }
                        });
                    }
                });
            }

            console.log('CopyPasteSection: Updated planning:', updatedPlanning);
            if (targetWeek && isMonday(new Date(targetWeek))) {
                saveToLocalStorage(`planning_${selectedShop}_${targetWeek}`, updatedPlanning);
                console.log(`CopyPasteSection: Saved planning to localStorage: planning_${selectedShop}_${targetWeek}`);
                setAvailableWeeks(prev => {
                    const weeks = prev.slice();
                    const weekExists = weeks.some(week => week.key === targetWeek);
                    if (!weekExists) {
                        weeks.push({
                            key: targetWeek,
                            date: new Date(targetWeek),
                            display: `Semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}`
                        });
                    }
                    weeks.sort((a, b) => a.date - b.date);
                    console.log('CopyPasteSection: Updated available weeks:', weeks);
                    return weeks;
                });
            } else {
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                console.log(`CopyPasteSection: Saved planning to localStorage: planning_${selectedShop}_${selectedWeek}`);
            }

            return updatedPlanning;
        });

        setFeedback('Succès: Données copiées avec succès.');
        console.log('CopyPasteSection: Copy successful');
    };

    const handleCopyCurrentWeek = () => {
        console.log('handleCopyCurrentWeek called with:', { selectedWeek, targetWeek });
        if (!config?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            console.log('Copy failed: Invalid time slots configuration');
            return;
        }
        if (!targetWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine cible.');
            console.log('Copy failed: No target week selected');
            return;
        }
        if (!Object.keys(planning).length) {
            setFeedback('Erreur: Aucune donnée à copier dans la semaine actuelle.');
            console.log('Copy failed: No data in current week');
            return;
        }

        setPlanning(prev => {
            const updatedPlanning = { ...prev };
            saveToLocalStorage(`planning_${selectedShop}_${targetWeek}`, updatedPlanning);
            console.log(`CopyPasteSection: Saved planning to localStorage: planning_${selectedShop}_${targetWeek}`);
            setAvailableWeeks(prev => {
                const weeks = prev.slice();
                const weekExists = weeks.some(week => week.key === targetWeek);
                if (!weekExists) {
                    weeks.push({
                        key: targetWeek,
                        date: new Date(targetWeek),
                        display: `Semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}`
                    });
                }
                weeks.sort((a, b) => a.date - b.date);
                console.log('CopyPasteSection: Updated available weeks:', weeks);
                return weeks;
            });
            return updatedPlanning;
        });

        setFeedback('Succès: Semaine actuelle copiée avec succès.');
        console.log('CopyPasteSection: Copy current week successful');
    };

    return (
        <div className="copy-paste-section">
            <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Copier/Coller
            </h3>
            <div className="copy-paste-container">
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Type de source
                    </label>
                    <select value={sourceType} onChange={(e) => {
                        console.log('Source type changed:', e.target.value);
                        setSourceType(e.target.value);
                        setSourceDay('');
                        setSourceWeek('');
                    }}>
                        <option value="day">Jour actuel</option>
                        <option value="week">Semaine sauvegardée</option>
                    </select>
                </div>
                {sourceType === 'day' ? (
                    <div className="form-group">
                        <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                            Jour source
                        </label>
                        <select value={sourceDay} onChange={(e) => {
                            console.log('Source day changed:', e.target.value);
                            setSourceDay(e.target.value);
                        }}>
                            <option value="">Choisir un jour</option>
                            {days.map(day => (
                                <option key={`${day.name} ${day.date}`} value={`${day.name} ${day.date}`}>
                                    {day.name} {day.date}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="form-group">
                        <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                            Semaine source
                        </label>
                        <select value={sourceWeek} onChange={(e) => {
                            console.log('Source week changed:', e.target.value);
                            setSourceWeek(e.target.value);
                        }}>
                            <option value="">Choisir une semaine</option>
                            {availableWeeks.map(week => (
                                <option key={week.key} value={week.key}>{week.display}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Jours cibles
                    </label>
                    <div className="target-days-grid">
                        {days.map(day => {
                            const dayValue = `${day.name} ${day.date}`;
                            return (
                                <div key={dayValue} className="target-day-item">
                                    <input
                                        type="checkbox"
                                        checked={targetDays.includes(dayValue)}
                                        onChange={() => {
                                            console.log('Target day toggled:', dayValue);
                                            setTargetDays(prev =>
                                                prev.includes(dayValue)
                                                    ? prev.filter(d => d !== dayValue)
                                                    : [...prev, dayValue]
                                            );
                                        }}
                                    />
                                    <label style={{ fontFamily: 'Roboto, sans-serif' }}>{dayValue}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Semaine cible
                    </label>
                    <select value={targetWeek} onChange={(e) => {
                        console.log('Target week changed:', e.target.value);
                        setTargetWeek(e.target.value);
                    }}>
                        <option value="">Choisir une semaine</option>
                        {availableWeeks.map(week => (
                            <option key={week.key} value={week.key}>{week.display}</option>
                        ))}
                    </select>
                </div>
                <div className="button-group">
                    <Button className="button-primary" onClick={handleCopy}>
                        Copier
                    </Button>
                    <Button className="button-primary" onClick={handleCopyCurrentWeek}>
                        Copier Semaine Actuelle
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CopyPasteSection;