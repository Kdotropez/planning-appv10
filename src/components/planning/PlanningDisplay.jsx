import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isMonday } from 'date-fns';
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
import '../../assets/styles.css';

const PlanningDisplay = ({ config, selectedShop, selectedWeek, selectedEmployees, planning: initialPlanning, onBack, onBackToShop, onBackToWeek, onBackToConfig, onReset, setStep }) => {
    const [currentDay, setCurrentDay] = useState(0);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, initialPlanning || {}) || {});
    const [showCopyPaste, setShowCopyPaste] = useState(false);
    const [feedback, setFeedback] = useState('');
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
        setFeedback('');
        if (!selectedWeek || isNaN(new Date(selectedWeek).getTime())) {
            setFeedback('Erreur: Date de semaine non valide.');
            return;
        }
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        if (!storedEmployees.length) {
            setFeedback('Erreur: Aucun employé sélectionné.');
            return;
        }
        if (!config?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
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
    }, [planning, selectedShop, selectedWeek, config]);

    useEffect(() => {
        setFeedback('');
    }, [showCopyPaste]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        return storedEmployees.reduce((total, employee) => {
            const slots = planning[employee]?.[dayKey] || [];
            return total + slots.reduce((sum, slot) => sum + (slot ? (config.interval || 30) / 60 : 0), 0);
        }, 0);
    };

    const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey] || [];
        const hours = slots.reduce((sum, slot) => sum + (slot ? (config.interval || 30) / 60 : 0), 0);
        return hours;
    };

    const calculateEmployeeWeeklyHours = (employee, weekStart, weekPlanning) => {
        let totalHours = 0;
        for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
            totalHours += calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
        }
        return totalHours;
    };

    const calculateShopWeeklyHours = () => {
        const storedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || [];
        const totalHours = storedEmployees.reduce((sum, employee) => sum + calculateEmployeeWeeklyHours(employee, selectedWeek, planning), 0);
        return totalHours.toFixed(1);
    };

    const toggleSlot = useCallback((employee, slotIndex, dayIndex, forceValue = null) => {
        if (!config?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }
        setPlanning(prev => {
            const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
            return {
                ...prev,
                [employee]: {
                    ...prev[employee],
                    [dayKey]: prev[employee]?.[dayKey]?.map((val, idx) => idx === slotIndex ? (forceValue !== null ? forceValue : !val) : val) || Array(config.timeSlots.length).fill(false)
                }
            };
        });
    }, [config, selectedWeek]);

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
                    <Button className="button-base button-retour" onClick={onBack}>Retour Employés</Button>
                    <Button className="button-base button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                    <Button className="button-base button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                    <Button className="button-base button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                    <Button className="button-base button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        <FaDownload /> Exporter
                    </Button>
                    <Button className="button-base button-reinitialiser" onClick={() => {
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
                    <Button className="button-base button-retour" onClick={onBack}>Retour Employés</Button>
                    <Button className="button-base button-retour" onClick={onBackToShop}>Retour Boutique</Button>
                    <Button className="button-base button-retour" onClick={onBackToWeek}>Retour Semaine</Button>
                    <Button className="button-base button-retour" onClick={onBackToConfig}>Retour Configuration</Button>
                    <Button className="button-base button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        <FaDownload /> Exporter
                    </Button>
                    <Button className="button-base button-reinitialiser" onClick={() => {
                        console.log('Opening ResetModal');
                        setShowResetModal(true);
                    }}>Réinitialiser</Button>
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
                <Button className="button-base button-primary" onClick={() => exportAllData(setFeedback)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    <FaDownload /> Exporter
                </Button>
                <Button className="button-base button-reinitialiser" onClick={() => {
                    console.log('Opening ResetModal');
                    setShowResetModal(true);
                }}>Réinitialiser</Button>
            </div>
            <div className="day-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
                {days.map((day, index) => (
                    <Button
                        key={day.name}
                        className={`button-base button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => {
                            console.log('Setting currentDay:', index);
                            setCurrentDay(index);
                        }}
                        style={{ padding: '8px 16px', fontSize: '12px', minHeight: '60px' }}
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
            <div className="recap-buttons" style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', justifyContent: 'center', gap: '12px', marginBottom: '15px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
                {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map((employee, index) => (
                    <div
                        key={employee}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            width: 'fit-content',
                            minWidth: '120px',
                            maxWidth: '200px',
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
                            onClick={() => {
                                console.log('Opening RecapModal for employee (day):', employee);
                                setShowRecapModal(employee);
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
                            JOUR ({calculateEmployeeDailyHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'), planning).toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-base button-recap"
                            onClick={() => {
                                console.log('Opening RecapModal for employee (week):', employee + '_week');
                                setShowRecapModal(employee + '_week');
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
                            SEMAINE ({calculateEmployeeWeeklyHours(employee, selectedWeek, planning).toFixed(1)} h)
                        </Button>
                        <Button
                            className="button-base button-recap"
                            onClick={() => {
                                console.log('Opening EmployeeMonthlyRecap for:', employee);
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
                            MOIS
                        </Button>
                    </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: 'fit-content', minWidth: '120px', maxWidth: '200px', alignItems: 'center' }}>
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
                        PLANNING SEMAINE ({calculateShopWeeklyHours()} h)
                    </Button>
                    <Button
                        className="button-base button-recap"
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
                        PLANNING MENSUEL
                    </Button>
                </div>
            </div>
            <div className="table-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <PlanningTable
                    config={config}
                    selectedWeek={selectedWeek}
                    planning={planning}
                    selectedEmployees={loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []}
                    toggleSlot={toggleSlot}
                    currentDay={currentDay}
                    calculateEmployeeDailyHours={calculateEmployeeDailyHours}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <Button
                    className="button-base button-primary"
                    onClick={() => {
                        console.log('Toggling CopyPasteSection:', !showCopyPaste);
                        setShowCopyPaste(!showCopyPaste);
                        setFeedback('');
                    }}
                >
                    <FaToggleOn /> {showCopyPaste ? 'Masquer Copier/Coller' : 'Afficher Copier/Coller'}
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
                    setFeedback={setFeedback}
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
                    setFeedback={setFeedback}
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