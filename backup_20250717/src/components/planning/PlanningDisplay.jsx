import { useState, useEffect, useMemo } from 'react';
import { format, addDays, addMinutes, startOfMonth, endOfMonth, isWithinInterval, isMonday, isSameMonth, parse, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaCopy, FaPaste, FaToggleOn } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import RecapModal from './RecapModal';
import PlanningTable from './PlanningTable';
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning: initialPlanning, onBack, onBackToShop, onBackToWeek, onBackToConfig, onReset }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, initialPlanning || {}) || {});
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [copyMode, setCopyMode] = useState('all');
    const [sourceDay, setSourceDay] = useState(0);
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployee, setTargetEmployee] = useState('');
    const [sourceWeek, setSourceWeek] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmployee, setResetEmployee] = useState('');
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
    const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(selectedWeek), i);
        return {
            name: format(date, 'EEEE', { locale: fr }),
            date: format(date, 'd MMMM', { locale: fr }),
        };
    });

    useEffect(() => {
        console.log('Initial planning state:', { initialPlanning, selectedEmployees, selectedWeek, configTimeSlots: config.timeSlots });
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            if (!storedSelectedEmployees || storedSelectedEmployees.length === 0) {
                setFeedback('Erreur: Aucun employé sélectionné.');
                return updatedPlanning;
            }
            storedSelectedEmployees.forEach(employee => {
                updatedPlanning[employee] = updatedPlanning[employee] || {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                    if (!updatedPlanning[employee][dayKey] || updatedPlanning[employee][dayKey].length !== config.timeSlots?.length) {
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots?.length || 0).fill(false);
                    }
                }
            });
            console.log('Synchronized planning with new config:', { config, updatedPlanning, storedSelectedEmployees });
            if (Object.keys(updatedPlanning).length > 0 && config.timeSlots?.length > 0) {
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                console.log('Saved planning to localStorage:', { key: `planning_${selectedShop}_${selectedWeek}`, planning: updatedPlanning });
            }
            return updatedPlanning;
        });
    }, [selectedEmployees, selectedWeek, config, selectedShop]);

    useEffect(() => {
        if (Object.keys(planning).length > 0 && config.timeSlots?.length > 0) {
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
            console.log('Saved planning to localStorage:', { key: `planning_${selectedShop}_${selectedWeek}`, planning });
        }
    }, [planning, selectedShop, selectedWeek]);

    useEffect(() => {
        return () => {
            if (Object.keys(planning).length > 0 && config.timeSlots?.length > 0) {
                saveToLocalStorage(`lastPlanning_${selectedShop}`, {
                    week: selectedWeek,
                    planning: planning
                });
                console.log('Saved last planning:', { week: selectedWeek, planning });
            }
        };
    }, [planning, selectedShop, selectedWeek]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        let totalHours = 0;
        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
        (storedSelectedEmployees || []).forEach(employee => {
            const slots = planning[employee]?.[dayKey] || [];
            const hours = slots.reduce((sum, slot, index) => {
                if (!slot || !config.timeSlots[index]) return sum;
                const [start, end] = config.timeSlots[index].split('-');
                if (!start || !end) return sum;
                const startTime = parse(start, 'H:mm', new Date());
                const endTime = parse(end, 'H:mm', new Date());
                if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                return sum + (slot ? differenceInMinutes(endTime, startTime) / 60 : 0);
            }, 0);
            totalHours += hours;
        });
        return totalHours;
    };

    const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey] || [];
        console.log(`Calculating daily hours for ${employee} on ${dayKey}:`, { slots });
        return slots.reduce((sum, slot, index) => {
            if (!slot || !config.timeSlots[index]) return sum;
            const timeSlot = config.timeSlots[index];
            if (!timeSlot || typeof timeSlot !== 'string') return sum;
            const match = timeSlot.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            if (!match) return sum;
            const [, start, end] = match;
            const startTime = parse(start, 'H:mm', new Date());
            const endTime = parse(end, 'H:mm', new Date());
            if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
            return sum + (slot ? differenceInMinutes(endTime, startTime) / 60 : 0);
        }, 0);
    };

    const calculateEmployeeWeeklyHours = (employee, weekStart, weekPlanning, targetMonth = null) => {
        let totalHours = 0;
        for (let i = 0; i < 7; i++) {
            const dayDate = addDays(new Date(weekStart), i);
            const dayKey = format(dayDate, 'yyyy-MM-dd');
            if (targetMonth && !isSameMonth(dayDate, new Date(selectedWeek))) {
                continue;
            }
            totalHours += calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
        }
        console.log(`Calculating weekly hours for ${employee} starting ${weekStart}:`, { totalHours });
        return totalHours;
    };

    const calculateShopWeeklyHours = () => {
        let totalHours = 0;
        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
        (storedSelectedEmployees || []).forEach(employee => {
            totalHours += calculateEmployeeWeeklyHours(employee, selectedWeek, planning);
        });
        return totalHours.toFixed(1);
    };

    const toggleSlot = (employee, slotIndex, dayIndex) => {
        console.log('toggleSlot called:', { employee, slotIndex, dayIndex, configTimeSlots: config.timeSlots });
        if (!config.timeSlots || config.timeSlots.length === 0) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
            if (!updatedPlanning[employee]) {
                updatedPlanning[employee] = {};
            }
            if (!updatedPlanning[employee][dayKey]) {
                updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
            }
            updatedPlanning[employee][dayKey][slotIndex] = !updatedPlanning[employee][dayKey][slotIndex];
            console.log('Updated planning:', updatedPlanning);
            if (Object.keys(updatedPlanning).length > 0 && config.timeSlots?.length > 0) {
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                setFeedback(`Créneau ${updatedPlanning[employee][dayKey][slotIndex] ? 'activé' : 'désactivé'} pour ${employee} le ${dayKey}.`);
            }
            return updatedPlanning;
        });
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
        } else if (copyMode === 'individual') {
            if (!sourceEmployee) {
                setFeedback('Veuillez sélectionner un employé source.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false) };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'individual', data: copiedData });
            setFeedback(`Données copiées pour ${sourceEmployee} le ${days[sourceDay].name}`);
        } else if (copyMode === 'employeeToEmployee') {
            if (!sourceEmployee || !targetEmployee) {
                setFeedback('Veuillez sélectionner les employés source et cible.');
                return;
            }
            const copiedData = { [sourceEmployee]: planning[sourceEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false), targetEmployee };
            saveToLocalStorage(`copied_${selectedShop}_${selectedWeek}`, { mode: 'employeeToEmployee', data: copiedData });
            setFeedback(`Données copiées de ${sourceEmployee} vers ${targetEmployee} pour ${days[sourceDay].name}`);
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
            }
            return updatedPlanning;
        });
        setFeedback(`Données collées pour ${targetDays.map(i => days[i].name).join(', ')}`);
    };

    const handleReset = () => {
        console.log('Opening reset modal:', { selectedEmployees });
        setShowResetModal(true);
    };

    const confirmReset = () => {
        console.log('Confirm reset:', { resetEmployee, selectedEmployees });
        if (!resetEmployee) {
            setFeedback('Veuillez sélectionner une option.');
            return;
        }
        if (!config || !config.timeSlots || !config.timeSlots.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        if (!selectedEmployees || selectedEmployees.length === 0) {
            setFeedback('Aucun employé sélectionné.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = JSON.parse(JSON.stringify(prev));
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            if (resetEmployee === 'all') {
                storedSelectedEmployees.forEach(employee => {
                    updatedPlanning[employee] = {};
                    for (let i = 0; i < 7; i++) {
                        const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                    }
                });
            } else {
                updatedPlanning[resetEmployee] = {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                    updatedPlanning[resetEmployee][dayKey] = Array(config.timeSlots.length).fill(false);
                }
            }
            console.log('Reset planning:', updatedPlanning);
            setFeedback(`Planning réinitialisé pour ${resetEmployee === 'all' ? 'tous les employés' : resetEmployee}.`);
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
            return updatedPlanning;
        });
        setShowResetModal(false);
        setResetEmployee('');
    };

    const getAvailableWeeks = () => {
        const weeks = [];
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Available storage keys:', storageKeys);

        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            try {
                const weekDate = new Date(weekKey);
                if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                    const weekPlanning = loadFromLocalStorage(key);
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

        weeks.sort((a, b) => a.date - b.date);
        console.log('Available weeks:', weeks);
        return weeks;
    };

    const copyWeek = () => {
        if (!sourceWeek) {
            setFeedback('Veuillez sélectionner une semaine source.');
            return;
        }
        const weekPlanning = loadFromLocalStorage(`planning_${selectedShop}_${sourceWeek}`);
        if (weekPlanning && Object.keys(weekPlanning).length > 0) {
            saveToLocalStorage(`week_${selectedShop}_${selectedWeek}`, weekPlanning);
            setFeedback(`Semaine du ${format(new Date(sourceWeek), 'd MMMM yyyy', { locale: fr })} copiée.`);
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
                return updatedPlanning;
            });
            setFeedback('Semaine collée.');
        } else {
            setFeedback('Aucune semaine copiée.');
        }
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'H:mm');
    };

    const getMonthlyWeeks = () => {
        const monthStart = startOfMonth(new Date(selectedWeek));
        const monthEnd = endOfMonth(new Date(selectedWeek));
        const weeks = [];
        const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');

        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Available storage keys:', storageKeys);

        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            try {
                const weekDate = new Date(weekKey);
                if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                    const weekEnd = addDays(weekDate, 6);
                    if (isWithinInterval(weekDate, { start: monthStart, end: monthEnd }) ||
                        isWithinInterval(weekEnd, { start: monthStart, end: monthEnd }) ||
                        (weekDate < monthStart && weekEnd > monthEnd)) {
                        const weekPlanning = loadFromLocalStorage(key);
                        if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                            weeks.push({ weekStart: weekKey, planning: weekPlanning });
                            console.log(`Week data for ${key}:`, weekPlanning);
                        }
                    }
                }
            } catch (e) {
                console.error(`Invalid date format for key ${key}:`, e);
            }
        });

        if (isMonday(new Date(selectedWeek)) && Object.keys(planning).length > 0) {
            const weekExists = weeks.some(week => week.weekStart === currentWeekKey);
            if (!weekExists) {
                weeks.push({ weekStart: currentWeekKey, planning });
                console.log(`Added current week data for ${currentWeekKey}:`, planning);
            }
        }

        weeks.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
        console.log('Sorted weeks found for month:', weeks);
        return weeks;
    };

    const getMonthlyRecapData = useMemo(() => {
        const weeks = getMonthlyWeeks();
        const monthlyTotals = {};
        const weeklyRecaps = [];

        if (weeks.length === 0) {
            console.log('No weeks found for monthly recap');
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            (storedSelectedEmployees || []).forEach(employee => {
                monthlyTotals[employee] = 0;
                weeklyRecaps.push({
                    employee,
                    week: `Semaine du ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(selectedWeek), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: '0.0'
                });
            });
            return { monthlyTotals, weeklyRecaps };
        }

        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
        (storedSelectedEmployees || []).forEach(employee => {
            monthlyTotals[employee] = 0;
        });

        weeks.forEach(({ weekStart, planning: weekPlanning }) => {
            console.log(`Processing week ${weekStart}:`, weekPlanning);
            (storedSelectedEmployees || []).forEach(employee => {
                if (!weekPlanning[employee]) {
                    console.log(`No data for employee ${employee} in week ${weekStart}`);
                    weeklyRecaps.push({
                        employee,
                        week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                        hours: '0.0'
                    });
                    return;
                }

                const weekTotalHours = calculateEmployeeWeeklyHours(employee, weekStart, weekPlanning, selectedWeek);
                monthlyTotals[employee] += weekTotalHours;
                weeklyRecaps.push({
                    employee,
                    week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: weekTotalHours.toFixed(1)
                });
            });
        });

        console.log('Monthly recap data:', { monthlyTotals, weeklyRecaps });
        return { monthlyTotals, weeklyRecaps };
    }, [selectedEmployees, selectedWeek, planning]);

    const calculateShopMonthlyHours = () => {
        const { monthlyTotals } = getMonthlyRecapData;
        let totalHours = 0;
        Object.values(monthlyTotals).forEach(hours => {
            totalHours += hours;
        });
        return totalHours.toFixed(1);
    };

    const getEmployeeMonthlyRecapData = (employee) => {
        const weeks = getMonthlyWeeks();
        const weeklyRecaps = [];
        let monthlyTotal = 0;

        if (weeks.length === 0) {
            console.log(`No weeks found for employee ${employee} monthly recap`);
            return { monthlyTotal: 0, weeklyRecaps };
        }

        weeks.forEach(({ weekStart, planning: weekPlanning }) => {
            if (!weekPlanning[employee]) {
                console.log(`No data for employee ${employee} in week ${weekStart}`);
                weeklyRecaps.push({
                    week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: '0.0'
                });
                return;
            }

            const weekTotalHours = calculateEmployeeWeeklyHours(employee, weekStart, weekPlanning, selectedWeek);
            monthlyTotal += weekTotalHours;
            weeklyRecaps.push({
                week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                hours: weekTotalHours.toFixed(1)
            });
        });

        console.log(`Employee monthly recap data for ${employee}:`, { monthlyTotal, weeklyRecaps });
        return { monthlyTotal, weeklyRecaps };
    };

    if (!config.timeSlots || config.timeSlots.length === 0) {
        return (
            <div className="planning-container">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                    Erreur: Aucune configuration de tranches horaires disponible.
                </p>
                <div className="navigation-buttons">
                    <Button className="button-base button-retour" onClick={onBack}>Retour Employés</Button>
                    <Button className="button-base button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                    <Button className="button-base button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                    <Button className="button-base button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                    <Button className="button-base button-reinitialiser" onClick={handleReset}>Réinitialiser</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="planning-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
            </h2>
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Erreur') ? '#e53935' : '#4caf50', marginBottom: '10px' }}>
                    {feedback}
                </p>
            )}
            <div className="navigation-buttons">
                <Button className="button-base button-retour" onClick={onBack}>Retour Employés</Button>
                <Button className="button-base button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                <Button className="button-base button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                <Button className="button-base button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>Réinitialiser</Button>
            </div>
            <div className="day-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                {days.map((day, index) => (
                    <Button
                        key={day.name}
                        className={`button-base button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => setCurrentDay(index)}
                    >
                        <span className="day-button-content">
                            {day.name}
                            <br />
                            {day.date}
                            <br />
                            ({calculateDailyHours(index).toFixed(1)} h)
                        </span>
                    </Button>
                ))}
            </div>
            <div className="recap-buttons" style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
                {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map((employee, index) => (
                    <div
                        key={employee}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            width: 'fit-content',
                            minWidth: '120px',
                            maxWidth: '300px',
                            alignItems: 'center',
                            backgroundColor: pastelColors[index % pastelColors.length],
                            padding: '8px',
                            borderRadius: '4px'
                        }}
                    >
                        <h4 style={{
                            fontFamily: 'Roboto, sans-serif',
                            textAlign: 'center',
                            marginBottom: '4px',
                            lineHeight: '1.2',
                            maxHeight: '2.8em',
                            fontSize: '14px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%'
                        }}>
                            <span>RECAP</span><br />
                            <span>{employee}</span>
                        </h4>
                        <Button
                            className="button-base button-recap"
                            onClick={() => setShowRecapModal(employee)}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '12px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            JOUR ({calculateEmployeeDailyHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'), planning).toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-base button-recap"
                            onClick={() => setShowRecapModal(employee + '_week')}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '12px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            SEMAINE ({calculateEmployeeWeeklyHours(employee, selectedWeek, planning).toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-base button-recap"
                            onClick={() => {
                                setSelectedEmployeeForMonthlyRecap(employee);
                                setShowEmployeeMonthlyRecap(true);
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '12px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            MOIS ({getEmployeeMonthlyRecapData(employee).monthlyTotal.toFixed(1)} h)
                        </Button>
                    </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: 'fit-content', minWidth: '120px', maxWidth: '300px', alignItems: 'center' }}>
                    <h4 style={{
                        fontFamily: 'Roboto, sans-serif',
                        textAlign: 'center',
                        marginBottom: '4px',
                        lineHeight: '1.2',
                        maxHeight: '2.8em',
                        fontSize: '14px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                    }}>
                        <span>PLANNING</span><br />
                        <span>{selectedShop}</span>
                    </h4>
                    <Button
                        className="button-base button-recap"
                        onClick={() => setShowRecapModal('week')}
                        style={{
                            backgroundColor: '#1e88e5',
                            color: '#fff',
                            padding: '8px 16px',
                            fontSize: '12px',
                            width: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                    >
                        PLANNING SEMAINE ({calculateShopWeeklyHours()} h)
                    </Button>
                    <Button
                        className="button-base button-recap"
                        onClick={() => setShowMonthlyRecapModal(true)}
                        style={{
                            backgroundColor: '#1e88e5',
                            color: '#fff',
                            padding: '8px 16px',
                            fontSize: '12px',
                            width: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                    >
                        PLANNING MENSUEL ({calculateShopMonthlyHours()} h)
                    </Button>
                </div>
            </div>
            <PlanningTable
                config={config}
                selectedWeek={selectedWeek}
                planning={planning}
                selectedEmployees={loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []}
                toggleSlot={toggleSlot}
                currentDay={currentDay}
            />
            <Button
                className="button-base button-primary"
                onClick={() => setShowCopyPaste(!showCopyPaste)}
            >
                <FaToggleOn /> {showCopyPaste ? 'Masquer Copier/Coller' : 'Afficher Copier/Coller'}
            </Button>
            {showCopyPaste && (
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
                                <Button className="button-base button-primary" onClick={copyDay}>
                                    <FaCopy /> Copier
                                </Button>
                                <Button className="button-base button-primary" onClick={pasteDay}>
                                    <FaPaste /> Coller
                                </Button>
                                <Button className="button-base button-reinitialiser" onClick={() => setFeedback('')}>
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
                                <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935' }}>
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
                            <Button className="button-base button-primary" onClick={copyWeek}>
                                <FaCopy /> Copier semaine
                            </Button>
                            <Button className="button-base button-primary" onClick={pasteWeek}>
                                <FaPaste /> Coller semaine
                            </Button>
                            <Button className="button-base button-reinitialiser" onClick={() => setFeedback('')}>
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowResetModal(false)}>
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Confirmer la réinitialisation
                        </h3>
                        <div className="form-group">
                            <label>Réinitialiser</label>
                            <select value={resetEmployee} onChange={(e) => setResetEmployee(e.target.value)}>
                                <option value="">Choisir une option</option>
                                <option value="all">Tous les employés</option>
                                {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map(employee => (
                                    <option key={employee} value={employee}>{employee}</option>
                                ))}
                            </select>
                        </div>
                        <div className="button-group">
                            <Button className="button-base button-primary" onClick={confirmReset}>
                                Confirmer
                            </Button>
                            <Button className="button-base button-retour" onClick={() => setShowResetModal(false)}>
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {typeof showRecapModal !== 'undefined' && showRecapModal && (
                <RecapModal
                    type={showRecapModal.includes('_week') ? 'employee' : showRecapModal === 'week' ? 'week' : 'employee'}
                    employee={showRecapModal.includes('_week') ? showRecapModal.replace('_week', '') : showRecapModal !== 'week' ? showRecapModal : null}
                    shop={selectedShop}
                    days={days}
                    config={config}
                    selectedWeek={selectedWeek}
                    planning={planning}
                    selectedEmployees={loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []}
                    onClose={() => setShowRecapModal(null)}
                    calculateEmployeeDailyHours={calculateEmployeeDailyHours}
                    calculateEmployeeWeeklyHours={calculateEmployeeWeeklyHours}
                    calculateShopWeeklyHours={calculateShopWeeklyHours}
                />
            )}
            {showMonthlyRecapModal && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => setShowMonthlyRecapModal(false)}
                            style={{ color: '#dc3545', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Récapitulatif mensuel ({calculateShopMonthlyHours()} h)
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                            Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                        </p>
                        {(() => {
                            const { monthlyTotals, weeklyRecaps } = getMonthlyRecapData;
                            const shopTotalHours = Object.values(monthlyTotals).reduce((sum, hours) => sum + hours, 0).toFixed(1);
                            if (Object.keys(monthlyTotals).length === 0 || weeklyRecaps.every(recap => recap.hours === '0.0')) {
                                return (
                                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                                        Aucune donnée disponible pour ce mois.
                                    </p>
                                );
                            }
                            return (
                                <table style={{ fontFamily: 'Inter, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Employé</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total mois (h)</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Semaine</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total semaine (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map((employee, empIndex) => (
                                            weeklyRecaps
                                                .filter(recap => recap.employee === employee)
                                                .map((recap, recapIndex) => (
                                                    <tr key={`${employee}-${recapIndex}`} style={{ backgroundColor: pastelColors[empIndex % pastelColors.length] }}>
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.employee}</td>
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recapIndex === 0 ? (monthlyTotals[employee] ? monthlyTotals[employee].toFixed(1) : '0.0') : ''}</td>
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.week}</td>
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.hours}</td>
                                                    </tr>
                                                ))
                                                .concat([
                                                    <tr key={`${employee}-spacer`} style={{ height: '10px' }}><td colSpan="4"></td></tr>
                                                ])
                                        ))}
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{shopTotalHours} h</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })()}
                        <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <Button
                                className="button-base button-retour"
                                onClick={() => setShowMonthlyRecapModal(false)}
                            >
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showEmployeeMonthlyRecap && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowEmployeeMonthlyRecap(false);
                                setSelectedEmployeeForMonthlyRecap('');
                            }}
                            style={{ color: '#dc3545', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Récapitulatif mensuel - {selectedEmployeeForMonthlyRecap} ({getEmployeeMonthlyRecapData(selectedEmployeeForMonthlyRecap).monthlyTotal.toFixed(1)} h)
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                            Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                        </p>
                        {(() => {
                            const { monthlyTotal, weeklyRecaps } = getEmployeeMonthlyRecapData(selectedEmployeeForMonthlyRecap);
                            if (weeklyRecaps.length === 0 || weeklyRecaps.every(recap => recap.hours === '0.0')) {
                                return (
                                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                                        Aucune donnée disponible pour ce mois.
                                    </p>
                                );
                            }
                            return (
                                <table style={{ fontFamily: 'Inter, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Semaine</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total semaine (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklyRecaps.map((recap, index) => (
                                            <tr key={index} style={{ backgroundColor: pastelColors[index % pastelColors.length] }}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.week}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.hours}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{monthlyTotal.toFixed(1)} h</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })()}
                        <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <Button
                                className="button-base button-retour"
                                onClick={() => {
                                    setShowEmployeeMonthlyRecap(false);
                                    setSelectedEmployeeForMonthlyRecap('');
                                }}
                            >
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default PlanningDisplay;