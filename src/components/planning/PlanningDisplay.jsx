import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isMonday, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaToggleOn, FaDownload } from 'react-icons/fa';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import { exportAllData } from '../../utils/backupUtils';
import Button from '../common/Button';
import RecapModal from './RecapModal';
import PlanningTable from './PlanningTable';
import MonthlyRecapModals from './MonthlyRecapModals';
import ResetModal from './ResetModal';
import CopyPasteSection from './CopyPasteSection';
import WeekCopySection from './WeekCopySection';
import GlobalDayViewModal from './GlobalDayViewModal';
import '@/assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning: initialPlanning, onBack, onBackToShop, onBackToWeek, onBackToConfig, onReset, setStep, setGlobalPlanning, setFeedback }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, initialPlanning || {}) || {});
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [showWeekCopy, setShowWeekCopy] = useState(false);
    const [showGlobalDayViewModal, setShowGlobalDayViewModal] = useState(false);
    const [feedback, setLocalFeedback] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
    const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [error, setError] = useState(null);

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const days = Array.from({ length: 7 }, (_, i) => {
        try {
            const date = addDays(new Date(selectedWeek), i);
            return {
                name: format(date, 'EEEE', { locale: fr }),
                date: format(date, 'd MMMM', { locale: fr }),
            };
        } catch (error) {
            console.error('Invalid time value in days calculation:', selectedWeek, error);
            return {
                name: 'Erreur',
                date: 'Date non valide',
            };
        }
    });

    useEffect(() => {
        setLocalFeedback('');
        if (!selectedWeek || isNaN(new Date(selectedWeek).getTime())) {
            setLocalFeedback('Erreur: Date de semaine non valide.');
            return;
        }
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        if (!storedEmployees.length) {
            setLocalFeedback('Erreur: Aucun employé sélectionné.');
            return;
        }
        if (!config?.timeSlots?.length) {
            setLocalFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = { ...prev };
            storedEmployees.forEach(employee => {
                updatedPlanning[employee] = updatedPlanning[employee] || {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                    if (!updatedPlanning[employee][dayKey] || updatedPlanning[employee][dayKey].length !== config.timeSlots.length) {
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                    }
                }
            });
            return updatedPlanning;
        });
    }, [selectedEmployees, selectedWeek, config, selectedShop]);

    useEffect(() => {
        if (Object.keys(planning).length && config?.timeSlots?.length) {
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
            setGlobalPlanning(planning);
            const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');
            if (isMonday(new Date(selectedWeek))) {
                saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, planning);
                setAvailableWeeks(prev => {
                    const weeks = prev.slice();
                    if (!weeks.some(week => week.key === currentWeekKey)) {
                        weeks.push({
                            key: currentWeekKey,
                            date: new Date(selectedWeek),
                            display: `Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}`
                        });
                    }
                    weeks.sort((a, b) => a.date - b.date);
                    return weeks;
                });
            }
            saveToLocalStorage(`lastPlanning_${selectedShop}`, { week: selectedWeek, planning });
        }
    }, [planning, selectedShop, selectedWeek, config, setGlobalPlanning]);

    useEffect(() => {
        setLocalFeedback('');
    }, [showCopyPaste, showWeekCopy]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        return storedEmployees.reduce((total, employee) => {
            return total + calculateEmployeeDailyHours(employee, dayKey, planning);
        }, 0);
    };

    const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey];
        if (!slots || slots === 'Congé ☀️') return 0;
        if (Array.isArray(slots)) {
            return slots.reduce((sum, slot) => sum + (slot ? config.interval / 60 : 0), 0);
        }
        // Calcul basé sur les créneaux horaires (ENTRÉE, PAUSE, RETOUR, SORTIE)
        const [entry, pause, resume, exit] = slots || [];
        if (!entry || !exit) return 0;
        const entryTime = new Date(`1970-01-01T${entry}`);
        const exitTime = new Date(`1970-01-01T${exit}`);
        let hours = (exitTime - entryTime) / 1000 / 3600;
        if (pause && resume) {
            const pauseTime = new Date(`1970-01-01T${pause}`);
            const resumeTime = new Date(`1970-01-01T${resume}`);
            hours -= (resumeTime - pauseTime) / 1000 / 3600;
        }
        return hours > 0 ? hours : 0;
    };

    const calculateEmployeeWeeklyHours = (employee, week, weekPlanning) => {
        let calendarHours = 0;
        let realHours = 0;
        const monthStart = startOfMonth(new Date(week));
        const monthEnd = endOfMonth(new Date(week));
        for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(new Date(week), i), 'yyyy-MM-dd');
            const hours = calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
            realHours += hours;
            if (isWithinInterval(new Date(dayKey), { start: monthStart, end: monthEnd })) {
                calendarHours += hours;
            }
        }
        console.log('Weekly hours for', employee, week, { calendar: calendarHours.toFixed(1), real: realHours.toFixed(1) });
        return { calendarHours, realHours };
    };

    const calculateEmployeeMonthlyHours = (employee, week) => {
        let calendarHours = 0;
        let realHours = 0;
        const monthStart = startOfMonth(new Date(week));
        const monthEnd = endOfMonth(new Date(week));
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            const weekDate = new Date(weekKey);
            if (weekDate >= monthStart && weekDate <= monthEnd) {
                const weekPlanning = loadFromLocalStorage(key, {});
                let weeklyCalendarHours = 0;
                let weeklyRealHours = 0;
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(weekKey), i), 'yyyy-MM-dd');
                    const hours = calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
                    weeklyRealHours += hours;
                    if (isWithinInterval(new Date(dayKey), { start: monthStart, end: monthEnd })) {
                        weeklyCalendarHours += hours;
                    }
                }
                calendarHours += weeklyCalendarHours;
                realHours += weeklyRealHours;
            }
        });
        console.log('Monthly hours for', employee, { calendar: calendarHours.toFixed(1), real: realHours.toFixed(1) });
        return { calendarHours, realHours };
    };

    const calculateShopWeeklyHours = () => {
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        const totals = storedEmployees.reduce((sum, employee) => {
            const { calendarHours, realHours } = calculateEmployeeWeeklyHours(employee, selectedWeek, planning);
            return {
                calendarHours: sum.calendarHours + calendarHours,
                realHours: sum.realHours + realHours
            };
        }, { calendarHours: 0, realHours: 0 });
        return { calendarHours: totals.calendarHours.toFixed(1), realHours: totals.realHours.toFixed(1) };
    };

    const calculateShopMonthlyHours = () => {
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        let calendarHours = 0;
        let realHours = 0;
        const monthStart = startOfMonth(new Date(selectedWeek));
        const monthEnd = endOfMonth(new Date(selectedWeek));
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${selectedShop}_`, '');
            const weekDate = new Date(weekKey);
            if (weekDate >= monthStart && weekDate <= monthEnd) {
                const weekPlanning = loadFromLocalStorage(key, {});
                let weeklyCalendarHours = 0;
                let weeklyRealHours = 0;
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(weekKey), i), 'yyyy-MM-dd');
                    const dailyHours = storedEmployees.reduce((sum, employee) => sum + calculateEmployeeDailyHours(employee, dayKey, weekPlanning), 0);
                    weeklyRealHours += dailyHours;
                    if (isWithinInterval(new Date(dayKey), { start: monthStart, end: monthEnd })) {
                        weeklyCalendarHours += dailyHours;
                    }
                }
                calendarHours += weeklyCalendarHours;
                realHours += weeklyRealHours;
            }
        });
        return { calendarHours: calendarHours.toFixed(1), realHours: realHours.toFixed(1) };
    };

    const toggleSlot = useCallback((employee, slotIndex, dayIndex, forceValue = null) => {
        if (!config?.timeSlots?.length) {
            setLocalFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        setPlanning(prev => {
            const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
            const updatedPlanning = {
                ...prev,
                [employee]: {
                    ...prev[employee],
                    [dayKey]: prev[employee]?.[dayKey]?.map((val, idx) => idx === slotIndex ? (forceValue !== null ? forceValue : !val) : val) || Array(config.timeSlots.length).fill(false)
                }
            };
            setGlobalPlanning(updatedPlanning);
            return updatedPlanning;
        });
    }, [config, selectedWeek, setGlobalPlanning]);

    if (error) {
        return (
            <div className="planning-container">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Erreur dans le planning
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                    Une erreur s’est produite : {error.message}
                </p>
                <div className="navigation-buttons">
                    <Button className="button-retour" onClick={onBack}>Retour Employés</Button>
                    <Button className="button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                    <Button className="button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                    <Button className="button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                    <Button className="button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}>
                        <FaDownload /> Exporter
                    </Button>
                    <Button className="button-reinitialiser" onClick={() => {
                        console.log('Opening ResetModal');
                        setShowResetModal(true);
                    }}>Réinitialiser</Button>
                </div>
            </div>
        );
    }

    if (!config?.timeSlots?.length) {
        return (
            <div className="planning-container">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                    Erreur: Aucune configuration de tranches horaires disponible.
                </p>
                <div className="navigation-buttons">
                    <Button className="button-retour" onClick={onBack}>Retour Employés</Button>
                    <Button className="button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                    <Button className="button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                    <Button className="button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                    <Button className="button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}>
                        <FaDownload /> Exporter
                    </Button>
                    <Button className="button-reinitialiser" onClick={() => {
                        console.log('Opening ResetModal');
                        setShowResetModal(true);
                    }}>Réinitialiser</Button>
                </div>
            </div>
        );
    }

    const shopWeeklyHours = calculateShopWeeklyHours();
    const shopMonthlyHours = calculateShopMonthlyHours();

    return (
        <div className="planning-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                Planning pour {selectedShop} - Semaine du {format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}
            </h2>
            {feedback && (
                <p style={{
                    fontFamily: 'Roboto, sans-serif',
                    textAlign: 'center',
                    color: (typeof feedback === 'string' ? feedback.includes('Erreur') : feedback.message?.includes('Erreur')) ? '#e53935' : '#4caf50',
                    marginBottom: '10px'
                }}>
                    {typeof feedback === 'string' ? feedback : feedback.message}
                </p>
            )}
            <div className="navigation-buttons">
                <Button className="button-retour" onClick={onBack}>Retour Employés</Button>
                <Button className="button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                <Button className="button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                <Button className="button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                <Button className="button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    <FaDownload /> Exporter
                </Button>
                <Button className="button-reinitialiser" onClick={() => {
                    console.log('Opening ResetModal');
                    setShowResetModal(true);
                }}>Réinitialiser</Button>
                <Button className="button-primary" onClick={() => {
                    console.log('Opening GlobalDayViewModal');
                    setShowGlobalDayViewModal(true);
                }} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    Vue globale par jour
                </Button>
            </div>
            <div className="day-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                {days.map((day, index) => (
                    <Button
                        key={day.name}
                        className={`button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => {
                            console.log('Setting currentDay:', index);
                            setCurrentDay(index);
                        }}
                        style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '12px', minHeight: '60px' }}
                    >
                        <span className="day-button-content">
                            {day.name}
                            <br />
                            {day.date}
                            <br />
                            {calculateDailyHours(index).toFixed(1)} h
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
                            className="button-recap"
                            onClick={() => {
                                console.log('Opening RecapModal for employee (day):', employee);
                                setShowRecapModal(employee);
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '11px',
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
                            className="button-recap"
                            onClick={() => {
                                console.log('Opening RecapModal for employee (week):', employee + '_week');
                                setShowRecapModal(employee + '_week');
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '11px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            SEMAINE RÉELLE ({calculateEmployeeWeeklyHours(employee, selectedWeek, planning).realHours.toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-recap"
                            onClick={() => {
                                console.log('Opening RecapModal for employee (week):', employee + '_week');
                                setShowRecapModal(employee + '_week');
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '11px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            SEMAINE CALENDAIRE ({calculateEmployeeWeeklyHours(employee, selectedWeek, planning).calendarHours.toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-recap"
                            onClick={() => {
                                console.log('Opening EmployeeMonthlyRecap for:', employee);
                                setSelectedEmployeeForMonthlyRecap(employee);
                                setShowEmployeeMonthlyRecap(true);
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '11px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            MOIS RÉEL ({calculateEmployeeMonthlyHours(employee, selectedWeek).realHours.toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-recap"
                            onClick={() => {
                                console.log('Opening EmployeeMonthlyRecap for:', employee);
                                setSelectedEmployeeForMonthlyRecap(employee);
                                setShowEmployeeMonthlyRecap(true);
                            }}
                            style={{
                                backgroundColor: '#1e88e5',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '11px',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            MOIS CALENDAIRE ({calculateEmployeeMonthlyHours(employee, selectedWeek).calendarHours.toFixed(1)} h)
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
                        className="button-recap"
                        onClick={() => {
                            console.log('Opening RecapModal for week');
                            setShowRecapModal('week');
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
                        SEMAINE CALENDAIRE ({shopWeeklyHours.calendarHours} h)
                    </Button>
                    <Button
                        className="button-recap"
                        onClick={() => {
                            console.log('Opening MonthlyRecapModal');
                            setShowMonthlyRecapModal(true);
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
                        MENSUEL CALENDAIRE ({shopMonthlyHours.calendarHours} h)
                    </Button>
                    <Button
                        className="button-recap"
                        onClick={() => {
                            console.log('Opening RecapModal for week');
                            setShowRecapModal('week');
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
                        SEMAINE RÉELLE ({shopWeeklyHours.realHours} h)
                    </Button>
                    <Button
                        className="button-recap"
                        onClick={() => {
                            console.log('Opening MonthlyRecapModal');
                            setShowMonthlyRecapModal(true);
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
                        MENSUEL RÉEL ({shopMonthlyHours.realHours} h)
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
                calculateEmployeeDailyHours={calculateEmployeeDailyHours}
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <Button
                    className="button-primary"
                    onClick={() => {
                        console.log('Toggling CopyPasteSection:', !showCopyPaste);
                        setShowCopyPaste(!showCopyPaste);
                        setLocalFeedback('');
                    }}
                >
                    <FaToggleOn /> {showCopyPaste ? 'Masquer Copier/Coller sur la semaine en cours' : 'Afficher Copier/Coller sur la semaine en cours'}
                </Button>
                <Button
                    className="button-primary"
                    onClick={() => {
                        console.log('Toggling WeekCopySection:', !showWeekCopy);
                        setShowWeekCopy(!showWeekCopy);
                        setLocalFeedback('');
                    }}
                >
                    <FaToggleOn /> {showWeekCopy ? 'Masquer Copier semaine sur une autre' : 'Afficher Copier semaine sur une autre'}
                </Button>
            </div>
            {showCopyPaste && (
                <CopyPasteSection
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    setPlanning={setPlanning}
                    days={days}
                    setAvailableWeeks={setAvailableWeeks}
                    setFeedback={setLocalFeedback}
                />
            )}
            {showWeekCopy && (
                <WeekCopySection
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    setGlobalPlanning={setGlobalPlanning}
                    setFeedback={setLocalFeedback}
                />
            )}
            {showResetModal && (
                <ResetModal
                    showResetModal={showResetModal}
                    setShowResetModal={setShowResetModal}
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    setPlanning={setPlanning}
                    setFeedback={setLocalFeedback}
                    setAvailableWeeks={setAvailableWeeks}
                    setStep={setStep}
                    onBack={onBack}
                />
            )}
            {showRecapModal && (
                <RecapModal
                    showRecapModal={showRecapModal}
                    setShowRecapModal={setShowRecapModal}
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    currentDay={currentDay}
                    days={days}
                    calculateEmployeeDailyHours={calculateEmployeeDailyHours}
                    calculateEmployeeWeeklyHours={calculateEmployeeWeeklyHours}
                    calculateShopWeeklyHours={calculateShopWeeklyHours}
                />
            )}
            {showGlobalDayViewModal && (
                <GlobalDayViewModal
                    showGlobalDayViewModal={showGlobalDayViewModal}
                    setShowGlobalDayViewModal={setShowGlobalDayViewModal}
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                />
            )}
            {(showMonthlyRecapModal || showEmployeeMonthlyRecap) && (
                <MonthlyRecapModals
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    showMonthlyRecapModal={showMonthlyRecapModal}
                    setShowMonthlyRecapModal={setShowMonthlyRecapModal}
                    showEmployeeMonthlyRecap={showEmployeeMonthlyRecap}
                    setShowEmployeeMonthlyRecap={setShowEmployeeMonthlyRecap}
                    selectedEmployeeForMonthlyRecap={selectedEmployeeForMonthlyRecap}
                    setSelectedEmployeeForMonthlyRecap={setSelectedEmployeeForMonthlyRecap}
                    calculateEmployeeDailyHours={calculateEmployeeDailyHours}
                    calculateEmployeeWeeklyHours={calculateEmployeeWeeklyHours}
                />
            )}
        </div>
    );
};

export default PlanningDisplay;