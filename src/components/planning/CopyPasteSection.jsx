import React, { useState } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCopy, FaPaste } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const CopyPasteSection = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, days, setAvailableWeeks }) => {
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(0);
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [sourceWeek, setSourceWeek] = useState('');
    const [feedback, setFeedback] = useState('');

    const getAvailableWeeks = () => {
        const weeks = [];
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Available storage keys:', storageKeys);

        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            try {
                const weekDate = new Date(weekKey);
                if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                    const weekPlanning = loadFromLocalStorage(key, {});
                    if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                        weeks.push({
                            key: weekKey,
                            date: weekDate,
                            display: `Semaine du ${format(weekDate, 'd MMMM yyyy', { locale: fr })}`
                        });
                        console.log(`Week data for ${key}:`, weekPlanning);
                    }
                }
            } catch (e) {
                console.error(`Invalid date format for key ${key}:`, e);
            }
        });

        const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');
        if (isMonday(new Date(selectedWeek))) {
            saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, planning);
            const weekExists = weeks.some(week => week.key === currentWeekKey);
            if (!weekExists) {
                weeks.push({
                    key: currentWeekKey,
                    date: new Date(selectedWeek),
                    display: `Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}`
                });
                console.log(`Added current week to available weeks: ${currentWeekKey}`, planning);
            }
        }

        weeks.sort((a, b) => a.date - b.date);
        console.log('Available weeks:', weeks);
        return weeks;
    };

    const copyDay = () => {
        if (!config.timeSlots || config.timeSlots.length === 0) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        const dayKey = format(addDays(new Date(selectedWeek), sourceDay), 'yyyy-MM-dd');
        if (copyMode === 'all') {
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            const copiedData = (storedSelectedEmployees || []).reduce((acc, employee) => {
                acc[employee] = planning[employee]?.[dayKey] || Array(config.timeSlots.length).fill(false);
                return acc;
            }, {});
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'all', data: copiedData });
            setFeedback(`Données copiées pour ${days[sourceDay].name}`);
            console.log('Saved copied day data:', { key: `copied_${selectedShop}_${selectedWeek}`, data: copiedData });
        } else if (copyMode === 'individual') {
            if (!sourceEmployee) {
                setFeedback('Veuillez sélectionner un employé source.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false) };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'individual', data: copiedData });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${days[sourceDay].name}`);
            console.log('Saved copied individual data:', { key: `copied_${selectedShop}_${selectedWeek}`, data: copiedData });
        } else if (copyMode === 'employeeToEmployee') {
            if (!sourceEmployee || !targetEmployee) {
                setFeedback('Veuillez sélectionner les employés source et cible.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false), targetEmployee };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'employeeToEmployee', data: copiedData });
            setFeedback(`Données copiées de ${sourceEmployee} vers ${targetEmployee} pour ${days[sourceDay].name}`);
            console.log('Saved copied employee-to-employee data:', { key: `copied_${selectedShop}_${selectedWeek}`, data: copiedData });
        }
    };

    const pasteDay = () => {
        if (!config.timeSlots || config.timeSlots.length === 0) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        const copied = loadFromLocalStorage(`copied_${selectedShop}_${selectedWeek}`);
        if (!copied || !copied.data) {
            setFeedback('Aucune donnée copiée.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            targetDays.forEach(dayIndex => {
                const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
                if (copied.mode === 'all') {
                    (storedSelectedEmployees || []).forEach(employee => {
                        if (!updatedPlanning[employee]) updatedPlanning[employee] = {};
                        updatedPlanning[employee][dayKey] = [...(copied.data[employee] || Array(config.timeSlots.length).fill(false))];
                    });
                } else if (copied.mode === 'individual') {
                    const employee = Object.keys(copied.data)[0];
                    if (!updatedPlanning[employee]) updatedPlanning[employee] = {};
                    updatedPlanning[employee][dayKey] = [...copied.data[employee]];
                } else if (copied.mode === 'employeeToEmployee') {
                    const employee = Object.keys(copied.data)[0];
                    const target = copied.data.targetEmployee;
                    if (!updatedPlanning[target]) updatedPlanning[target] = {};
                    updatedPlanning[target][dayKey] = [...copied.data[employee]];
                }
            });
            if (Object.keys(updatedPlanning).length > 0 && config.timeSlots?.length > 0) {
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                console.log('Saved planning to localStorage after paste:', { key: `planning_${selectedShop}_${selectedWeek}`, planning: updatedPlanning });
                setAvailableWeeks(getAvailableWeeks());
            }
            return updatedPlanning;
        });
        setFeedback(`Données collées pour ${targetDays.map(i => days[i].name).join(', ')}`);
    };

    const copyWeek = () => {
        if (!sourceWeek) {
            setFeedback('Veuillez sélectionner une semaine source.');
            return;
        }
        const weekPlanning = loadFromLocalStorage(`Planning_${selectedShop}_${sourceWeek}`, {});
        if (weekPlanning && Object.keys(weekPlanning).length > 0) {
            saveToLocalStorage(`week_${selectedShop}_${selectedWeek}`, weekPlanning);
            setFeedback(`Semaine du ${format(new Date(sourceWeek), 'd MMMM yyyy', { locale: fr })} copiée.`);
            console.log('Copied week:', { sourceWeek, weekPlanning });
        } else {
            setFeedback('Aucune donnée disponible pour la semaine sélectionnée.');
        }
    };

    const pasteWeek = () => {
        const copiedWeek = loadFromLocalStorage(`week_${selectedShop}_${selectedWeek}`);
        if (copiedWeek && Object.keys(copiedWeek).length > 0) {
            setPlanning(prev => {
                const updatedPlanning = JSON.parse(JSON.stringify(prev));
                Object.keys(copiedWeek).forEach(employee => {
                    updatedPlanning[employee] = copiedWeek[employee];
                });
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                console.log('Pasted week to planning:', { key: `planning_${selectedShop}_${selectedWeek}`, planning: updatedPlanning });
                setAvailableWeeks(getAvailableWeeks());
                return updatedPlanning;
            });
            setFeedback('Semaine collée.');
        } else {
            setFeedback('Aucune semaine copiée.');
        }
    };

    return (
        <div className="copy-paste-section">
            <div className="copy-paste-container">
                <h3>Copier/Coller un jour</h3>
                <div className="copy-paste-form">
                    <div className="form-group">
                        <label>Mode de copie</label>
                        <select value={copyMode} onChange={(e) => setCopyMode(e.target.value)}>
                            <option value="all">Tous les employés</option>
                            <option value="individual">Employé spécifique</option>
                            <option value="employeeToEmployee">D’un employé à un autre</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Jour source</label>
                        <select value={sourceDay} onChange={(e) => setSourceDay(Number(e.target.value))}>
                            {days.map((day, index) => (
                                <option key={day.name} value={index}>{day.name} {day.date}</option>
                            ))}
                        </select>
                    </div>
                    {copyMode !== 'all' && (
                        <div className="form-group">
                            <label>Employé source</label>
                            <select value={sourceEmployee} onChange={(e) => setSourceEmployee(e.target.value)}>
                                <option value="">Choisir un employé</option>
                                {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {copyMode === 'employeeToEmployee' && (
                        <div className="form-group">
                            <label>Employé cible</label>
                            <select value={targetEmployee} onChange={(e) => setTargetEmployee(e.target.value)}>
                                <option value="">Choisir un employé</option>
                                {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Jours cibles</label>
                        <div className="target-days-grid">
                            {days.map((day, index) => (
                                <div key={day.name} className="target-day-item">
                                    <input
                                        type="checkbox"
                                        checked={targetDays.includes(index)}
                                        onChange={() => {
                                            setTargetDays(targetDays.includes(index)
                                                ? targetDays.filter(d => d !== index)
                                                : [...targetDays, index]);
                                        }}
                                    />
                                    {day.name} {day.date}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="button-group">
                        <Button className="button-primary" onClick={copyDay}>
                            <FaCopy /> Copier
                        </Button>
                        <Button className="button-primary" onClick={pasteDay}>
                            <FaPaste /> Coller
                        </Button>
                        <Button className="button-reinitialiser" onClick={() => setFeedback('')}>
                            Réinitialiser
                        </Button>
                    </div>
                    {feedback && <p className="feedback">{feedback}</p>}
                </div>
            </div>
            <div className="copy-paste-container">
                <h3>Copier/Coller une semaine existante</h3>
                <div className="form-group">
                    <label>Semaine source</label>
                    {getAvailableWeeks().length === 0 ? (
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                            Aucune semaine disponible pour la copie.
                        </p>
                    ) : (
                        <select value={sourceWeek} onChange={(e) => setSourceWeek(e.target.value)}>
                            <option value="">Choisir une semaine</option>
                            {getAvailableWeeks().map(week => (
                                <option key={week.key} value={week.key}>{week.display}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="button-group">
                    <Button className="button-primary" onClick={copyWeek}>
                        <FaCopy /> Copier semaine
                    </Button>
                    <Button className="button-primary" onClick={pasteWeek}>
                        <FaPaste /> Coller semaine
                    </Button>
                    <Button className="button-reinitialiser" onClick={() => setFeedback('')}>
                        Réinitialiser
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CopyPasteSection;