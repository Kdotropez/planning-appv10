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
    const [confirmationMessage, setConfirmationMessage] = useState('');

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

    useEffect(() => {
        // Générer un message de confirmation dynamique
        let message = '';
        if (sourceType === 'day' && sourceDay) {
            message = `Copier ${sourceDay} vers `;
            if (targetDays.length) {
                message += targetDays.join(', ');
            }
            if (targetWeek) {
                message += `${targetDays.length ? ' et ' : ''}la semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}`;
            }
        } else if (sourceType === 'week' && sourceWeek) {
            message = `Copier la semaine du ${format(new Date(sourceWeek), 'd MMMM yyyy', { locale: fr })} vers `;
            if (targetDays.length) {
                message += targetDays.join(', ');
            }
            if (targetWeek) {
                message += `${targetDays.length ? ' et ' : ''}la semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}`;
            }
        } else if (sourceType === 'week' && targetWeek) {
            message = `Copier la semaine actuelle vers la semaine du ${format(new Date(targetWeek), 'd MMMM yyyy', { locale: fr })}`;
        }
        setConfirmationMessage(message || 'Veuillez sélectionner une source et une cible.');
    }, [sourceType, sourceDay, sourceWeek, targetDays, targetWeek]);

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

    const handleClearSelection = () => {
        console.log('handleClearSelection called');
        setSourceType('day');
        setSourceDay('');
        setSourceWeek('');
        setTargetDays([]);
        setTargetWeek('');
        setConfirmationMessage('Veuillez sélectionner une source et une cible.');
        setFeedback('Succès: Sélection réinitialisée.');
    };

    return (
        <div className="copy-paste-section">
            <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Copier/Coller
            </h3>
            <p className="confirmation-message" style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', color: '#333' }}>
                {confirmationMessage}
            </p>
            <div className="copy-paste-container">
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Type de source
                    </label>
                    <div className="source-type-buttons">
                        <Button
                            className={`button-base ${sourceType === 'day' ? 'selected-source' : ''}`}
                            onClick={() => {
                                console.log('Source type set to day');
                                setSourceType('day');
                                setSourceDay('');
                                setSourceWeek('');
                            }}
                        >
                            Jour actuel
                        </Button>
                        <Button
                            className={`button-base ${sourceType === 'week' ? 'selected-source' : ''}`}
                            onClick={() => {
                                console.log('Source type set to week');
                                setSourceType('week');
                                setSourceDay('');
                                setSourceWeek('');
                            }}
                        >
                            Semaine sauvegardée
                        </Button>
                    </div>
                </div>
                {sourceType === 'day' ? (
                    <div className="form-group">
                        <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                            Jour source
                        </label>
                        <div className="source-day-buttons">
                            {days.map(day => (
                                <Button
                                    key={`${day.name} ${day.date}`}
                                    className={`button-base ${sourceDay === `${day.name} ${day.date}` ? 'selected-source' : ''}`}
                                    onClick={() => {
                                        console.log('Source day set to:', `${day.name} ${day.date}`);
                                        setSourceDay(`${day.name} ${day.date}`);
                                    }}
                                >
                                    {day.name} {day.date}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                            Semaine source
                        </label>
                        <div className="source-week-buttons">
                            {availableWeeks.map(week => (
                                <Button
                                    key={week.key}
                                    className={`button-base ${sourceWeek === week.key ? 'selected-source' : ''}`}
                                    onClick={() => {
                                        console.log('Source week set to:', week.key);
                                        setSourceWeek(week.key);
                                    }}
                                >
                                    {week.display}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Jours cibles
                    </label>
                    <div className="target-days-buttons">
                        {days.map(day => {
                            const dayValue = `${day.name} ${day.date}`;
                            return (
                                <Button
                                    key={dayValue}
                                    className={`button-base ${targetDays.includes(dayValue) ? 'selected-target' : ''}`}
                                    onClick={() => {
                                        console.log('Target day toggled:', dayValue);
                                        setTargetDays(prev =>
                                            prev.includes(dayValue)
                                                ? prev.filter(d => d !== dayValue)
                                                : [...prev, dayValue]
                                        );
                                    }}
                                >
                                    {dayValue}
                                </Button>
                            );
                        })}
                    </div>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px' }}>
                        Semaine cible
                    </label>
                    <div className="target-week-buttons">
                        {availableWeeks.map(week => (
                            <Button
                                key={week.key}
                                className={`button-base ${targetWeek === week.key ? 'selected-target' : ''}`}
                                onClick={() => {
                                    console.log('Target week set to:', week.key);
                                    setTargetWeek(week.key);
                                }}
                            >
                                {week.display}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="button-group">
                    <Button className="button-primary" onClick={handleCopy}>
                        Copier
                    </Button>
                    <Button className="button-primary" onClick={handleCopyCurrentWeek}>
                        Copier Semaine Actuelle
                    </Button>
                    <Button className="button-reinitialiser" onClick={handleClearSelection}>
                        Effacer Sélection
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CopyPasteSection;