import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isMonday, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaToggleOn, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
    const [availableWeeks, setAvailableWeeks] = useState(loadFromLocalStorage(`available_weeks_${selectedShop}`, []) || []);
    const [error, setError] = useState(null);
    const [currentShop, setCurrentShop] = useState(selectedShop);
    const [currentWeek, setCurrentWeek] = useState(selectedWeek);
    const [showCalendarTotals, setShowCalendarTotals] = useState(false);
    const [showMonthlyDetailModal, setShowMonthlyDetailModal] = useState(false);

    console.log('PlanningDisplay props:', { config, selectedShop, selectedWeek, selectedEmployees, initialPlanning });

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const shops = loadFromLocalStorage('shops', [selectedShop]) || [selectedShop];

    const days = Array.from({ length: 7 }, (_, i) => {
        try {
            const date = addDays(new Date(currentWeek), i);
            return {
                name: format(date, 'EEEE', { locale: fr }),
                date: format(date, 'd MMMM', { locale: fr }),
            };
        } catch (err) {
            console.error('Invalid time value in days calculation:', currentWeek, err);
            setError({ message: 'Erreur dans le calcul des jours: Date invalide' });
            return {
                name: 'Erreur',
                date: 'Date non valide',
            };
        }
    });

    useEffect(() => {
        setLocalFeedback('');
        if (!currentWeek || isNaN(new Date(currentWeek).getTime())) {
            setLocalFeedback('Erreur: Date de semaine non valide.');
            setError({ message: 'Date de semaine non valide' });
            return;
        }
        const storedEmployees = loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || [];
        console.log('Stored employees:', storedEmployees);
        if (!storedEmployees.length) {
            setLocalFeedback('Erreur: Aucun employé sélectionné.');
            setError({ message: 'Aucun employé sélectionné' });
            return;
        }
        if (!config?.timeSlots?.length) {
            setLocalFeedback('Erreur: Configuration des tranches horaires non valide.');
            setError({ message: 'Configuration des tranches horaires non valide' });
            return;
        }
        setPlanning(prev => {
            const updatedPlanning = { ...prev };
            storedEmployees.forEach(employee => {
                if (!updatedPlanning[employee]) {
                    updatedPlanning[employee] = {};
                }
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
                    if (!updatedPlanning[employee][dayKey]) {
                        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                    } else if (updatedPlanning[employee][dayKey].length !== config.timeSlots.length) {
                        const existingSlots = updatedPlanning[employee][dayKey];
                        const newSlots = Array(config.timeSlots.length).fill(false);
                        for (let j = 0; j < Math.min(existingSlots.length, config.timeSlots.length); j++) {
                            newSlots[j] = existingSlots[j];
                        }
                        updatedPlanning[employee][dayKey] = newSlots;
                    }
                }
            });
            Object.keys(updatedPlanning).forEach(employee => {
                if (!storedEmployees.includes(employee)) {
                    delete updatedPlanning[employee];
                }
            });
            console.log('Updated planning:', updatedPlanning);
            return updatedPlanning;
        });
    }, [selectedEmployees, currentWeek, config, currentShop]);

    useEffect(() => {
        if (Object.keys(planning).length && config?.timeSlots?.length) {
            console.log('Saving planning to localStorage:', `planning_${currentShop}_${currentWeek}`, planning);
            saveToLocalStorage(`planning_${currentShop}_${currentWeek}`, planning);
            setGlobalPlanning(planning);
            const currentWeekKey = format(new Date(currentWeek), 'yyyy-MM-dd');
            if (isMonday(new Date(currentWeek))) {
                saveToLocalStorage(`planning_${currentShop}_${currentWeekKey}`, planning);
                setAvailableWeeks(prev => {
                    const weeks = [...prev];
                    if (!weeks.some(week => week.key === currentWeekKey)) {
                        weeks.push({
                            key: currentWeekKey,
                            date: new Date(currentWeek),
                            display: `Semaine du ${format(new Date(currentWeek), 'd MMMM yyyy', { locale: fr })}`
                        });
                    }
                    const uniqueWeeks = Array.from(new Set(weeks.map(w => w.key)))
                        .map(key => weeks.find(w => w.key === key))
                        .sort((a, b) => a.date - b.date);
                    console.log('Saving available weeks to localStorage:', `available_weeks_${currentShop}`, uniqueWeeks);
                    saveToLocalStorage(`available_weeks_${currentShop}`, uniqueWeeks);
                    return uniqueWeeks;
                });
            }
            saveToLocalStorage(`lastPlanning_${currentShop}`, { week: currentWeek, planning });
        }
    }, [planning, currentShop, currentWeek, config, setGlobalPlanning]);

    useEffect(() => {
        setLocalFeedback('');
    }, [showCopyPaste, showWeekCopy]);

    const calculateDailyHours = (dayIndex) => {
        const dayKey = format(addDays(new Date(currentWeek), dayIndex), 'yyyy-MM-dd');
        const storedEmployees = loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || [];
        const total = storedEmployees.reduce((total, employee) => {
            const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
            console.log('Daily hours for', employee, dayKey, hours.toFixed(1));
            return total + hours;
        }, 0);
        return total;
    };

    const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey];
        if (!slots || slots === 'Congé ☀️') return 0;
        if (Array.isArray(slots)) {
            return slots.reduce((sum, slot) => sum + (slot ? config.interval / 60 : 0), 0);
        }
        const [entry, pause, resume, exit] = slots || [];
        if (!entry || !exit) return 0;
        try {
            const entryTime = new Date(`1970-01-01T${entry}`);
            const exitTime = new Date(`1970-01-01T${exit}`);
            let hours = (exitTime - entryTime) / 1000 / 3600;
            if (pause && resume) {
                const pauseTime = new Date(`1970-01-01T${pause}`);
                const resumeTime = new Date(`1970-01-01T${resume}`);
                hours -= (resumeTime - pauseTime) / 1000 / 3600;
            }
            return hours > 0 ? hours : 0;
        } catch (err) {
            console.error('Error calculating hours for', employee, dayKey, err);
            setError({ message: `Erreur dans le calcul des heures pour ${employee} le ${dayKey}` });
            return 0;
        }
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
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${currentShop}_`));
        console.log('LocalStorage keys for monthly hours:', storageKeys);
        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${currentShop}_`, '');
            const weekDate = new Date(weekKey);
            if (weekDate >= addDays(monthStart, -6) && weekDate <= monthEnd) {
                const weekPlanning = loadFromLocalStorage(key, {});
                console.log(`Week planning for ${weekKey}:`, weekPlanning);
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
                console.log(`Weekly hours for ${employee} in ${weekKey}:`, { calendar: weeklyCalendarHours.toFixed(1), real: weeklyRealHours.toFixed(1) });
            }
        });
        console.log('Monthly hours for', employee, { calendar: calendarHours.toFixed(1), real: realHours.toFixed(1) });
        return { calendarHours, realHours };
    };

    const calculateShopWeeklyHours = () => {
        const storedEmployees = loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || [];
        const totals = storedEmployees.reduce((sum, employee) => {
            const { calendarHours, realHours } = calculateEmployeeWeeklyHours(employee, currentWeek, planning);
            return {
                calendarHours: sum.calendarHours + calendarHours,
                realHours: sum.realHours + realHours
            };
        }, { calendarHours: 0, realHours: 0 });
        console.log('Shop weekly hours:', { calendar: totals.calendarHours.toFixed(1), real: totals.realHours.toFixed(1) });
        return { calendarHours: totals.calendarHours.toFixed(1), realHours: totals.realHours.toFixed(1) };
    };

    const calculateShopMonthlyHours = () => {
        const storedEmployees = loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || [];
        let calendarHours = 0;
        let realHours = 0;
        const monthStart = startOfMonth(new Date(currentWeek));
        const monthEnd = endOfMonth(new Date(currentWeek));
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${currentShop}_`));
        console.log('LocalStorage keys for shop monthly hours:', storageKeys);
        storageKeys.forEach(key => {
            const weekKey = key.replace(`planning_${currentShop}_`, '');
            const weekDate = new Date(weekKey);
            if (weekDate >= addDays(monthStart, -6) && weekDate <= monthEnd) {
                const weekPlanning = loadFromLocalStorage(key, {});
                console.log(`Week planning for ${weekKey}:`, weekPlanning);
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
                console.log(`Shop weekly hours for ${weekKey}:`, { calendar: weeklyCalendarHours.toFixed(1), real: weeklyRealHours.toFixed(1) });
            }
        });
        console.log('Shop monthly hours:', { calendar: calendarHours.toFixed(1), real: realHours.toFixed(1) });
        return { calendarHours: calendarHours.toFixed(1), realHours: realHours.toFixed(1) };
    };

    const toggleSlot = useCallback((employee, slotIndex, dayIndex, forceValue = null) => {
        if (!config?.timeSlots?.length) {
            setLocalFeedback('Erreur: Configuration des tranches horaires non valide.');
            setError({ message: 'Configuration des tranches horaires non valide' });
            return;
        }
        setPlanning(prev => {
            const dayKey = format(addDays(new Date(currentWeek), dayIndex), 'yyyy-MM-dd');
            const updatedPlanning = {
                ...prev,
                [employee]: {
                    ...prev[employee],
                    [dayKey]: prev[employee]?.[dayKey]?.map((val, idx) => idx === slotIndex ? (forceValue !== null ? forceValue : !val) : val) || Array(config.timeSlots.length).fill(false)
                }
            };
            console.log('Toggling slot for', employee, dayKey, slotIndex, 'New planning:', updatedPlanning);
            setGlobalPlanning(updatedPlanning);
            return updatedPlanning;
        });
    }, [config, currentWeek, setGlobalPlanning]);

    const changeWeek = (direction) => {
        const newWeek = addDays(new Date(currentWeek), direction * 7);
        setCurrentWeek(newWeek.toISOString());
        setPlanning(loadFromLocalStorage(`planning_${currentShop}_${format(newWeek, 'yyyy-MM-dd')}`, {}) || {});
        setLocalFeedback('');
    };

    const changeShop = (newShop) => {
        setCurrentShop(newShop);
        setPlanning(loadFromLocalStorage(`planning_${newShop}_${format(new Date(currentWeek), 'yyyy-MM-dd')}`, {}) || {});
        setLocalFeedback('');
    };

    const MonthlyDetailModal = ({ show, setShow }) => {
        if (!show) return null;

        const monthStart = startOfMonth(new Date(currentWeek));
        const monthEnd = endOfMonth(new Date(currentWeek));
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const storedEmployees = loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || [];

        const exportToPDF = () => {
            try {
                const doc = new jsPDF({ orientation: 'portrait' });
                const title = `Récap. mensuel - ${currentShop} (${format(monthStart, 'MMMM yyyy', { locale: fr })})`;
                doc.setFontSize(10);
                doc.text(title, 10, 10);

                const tableData = monthDays.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const row = [format(day, 'dd/MM/yyyy')];
                    storedEmployees.forEach(employee => {
                        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
                        row.push(hours > 0 ? `${hours.toFixed(1)} h` : 'CONGÉ');
                    });
                    return row;
                });

                const totalRow = ['TOTAL MOIS'];
                storedEmployees.forEach(employee => {
                    const { realHours } = calculateEmployeeMonthlyHours(employee, currentWeek);
                    totalRow.push(`${realHours.toFixed(1)} h`);
                });

                autoTable(doc, {
                    head: [['Date', ...storedEmployees]],
                    body: [...tableData, totalRow],
                    startY: 15,
                    styles: { fontSize: 8, cellPadding: 1, lineHeight: 0.5 },
                    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
                    columnStyles: storedEmployees.reduce((acc, emp, idx) => ({
                        ...acc,
                        [idx + 1]: { fillColor: pastelColors[idx % pastelColors.length] }
                    }), { 0: { fillColor: [255, 255, 255] } }),
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.row.index === tableData.length) {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    },
                    margin: { top: 15, left: 10, right: 10 },
                });

                doc.save(`${title}.pdf`);
                setLocalFeedback('Succès: Récapitulatif mensuel exporté en PDF.');
            } catch (error) {
                console.error('Erreur lors de l\'exportation en PDF:', error);
                setLocalFeedback('Erreur: Échec de l\'exportation en PDF.');
            }
        };

        const exportToPDFImage = async () => {
            try {
                const element = document.querySelector('.monthly-detail-modal-content');
                const canvas = await html2canvas(element, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const doc = new jsPDF({ orientation: 'portrait' });
                const title = `Récap. mensuel - ${currentShop} (${format(monthStart, 'MMMM yyyy', { locale: fr })})`;
                doc.setFontSize(10);
                doc.text(title, 10, 10);
                const imgWidth = 190;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                doc.addImage(imgData, 'PNG', 10, 15, imgWidth, imgHeight);
                doc.save(`${title}_image.pdf`);
                setLocalFeedback('Succès: Récapitulatif mensuel exporté en PDF (image fidèle).');
            } catch (error) {
                console.error('Erreur lors de l\'exportation en PDF (image fidèle):', error);
                setLocalFeedback('Erreur: Échec de l\'exportation en PDF (image fidèle).');
            }
        };

        return (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div className="monthly-detail-modal-content" style={{
                    backgroundColor: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    maxWidth: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    width: '700px'
                }}>
                    <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px', fontWeight: '700', fontSize: '12px' }}>
                        Récap. mensuel - {currentShop} ({format(monthStart, 'MMMM yyyy', { locale: fr })})
                    </h2>
                    <table style={{ fontFamily: 'Roboto, sans-serif', width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '8px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ccc', padding: '4px', fontWeight: '700' }}>Date</th>
                                {storedEmployees.map((employee, index) => (
                                    <th key={employee} style={{ border: '1px solid #ccc', padding: '4px', fontWeight: '700', backgroundColor: pastelColors[index % pastelColors.length] }}>
                                        {employee}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {monthDays.map(day => (
                                <tr key={format(day, 'yyyy-MM-dd')}>
                                    <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>
                                        {format(day, 'dd/MM/yyyy')}
                                    </td>
                                    {storedEmployees.map((employee, index) => {
                                        const dayKey = format(day, 'yyyy-MM-dd');
                                        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
                                        return (
                                            <td key={`${employee}-${dayKey}`} style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center', backgroundColor: pastelColors[index % pastelColors.length] }}>
                                                {hours > 0 ? `${hours.toFixed(1)} h` : 'CONGÉ'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            <tr>
                                <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center', fontWeight: '700' }}>
                                    TOTAL MOIS
                                </td>
                                {storedEmployees.map((employee, index) => {
                                    const { realHours } = calculateEmployeeMonthlyHours(employee, currentWeek);
                                    return (
                                        <td key={`${employee}-total`} style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center', fontWeight: '700', backgroundColor: pastelColors[index % pastelColors.length] }}>
                                            {realHours.toFixed(1)} h
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button
                            className="button-primary"
                            onClick={() => setShow(false)}
                            style={{ backgroundColor: '#e53935', color: '#fff', padding: '6px 12px', fontSize: '12px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                        >
                            Fermer
                        </Button>
                        <Button
                            className="button-primary"
                            onClick={exportToPDF}
                            style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '6px 12px', fontSize: '12px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            Exporter en PDF
                        </Button>
                        <Button
                            className="button-primary"
                            onClick={exportToPDFImage}
                            style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '6px 12px', fontSize: '12px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                        >
                            Exporter en PDF (image fidèle)
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (error !== null && error !== undefined) {
        return (
            <div className="planning-container">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Erreur dans le planning
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                    Une erreur s’est produite : {error.message || 'Erreur inconnue'}
                </p>
                <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Button className="button-retour" onClick={() => changeWeek(-1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Semaine précédente
                    </Button>
                    <Button className="button-retour" onClick={() => changeWeek(1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Semaine suivante
                    </Button>
                    <select
                        value={currentShop}
                        onChange={(e) => changeShop(e.target.value)}
                        style={{ padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        {shops.map(shop => (
                            <option key={shop} value={shop}>{shop}</option>
                        ))}
                    </select>
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
                    <Button className="button-primary" onClick={() => {
                        console.log('Opening GlobalDayViewModal');
                        setShowGlobalDayViewModal(true);
                    }} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Vue globale par jour
                    </Button>
                </div>
            </div>
        );
    }

    if (!config?.timeSlots?.length) {
        return (
            <div className="planning-container">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Planning pour {currentShop}
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                    Erreur: Aucune configuration de tranches horaires disponible.
                </p>
                <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Button className="button-retour" onClick={() => changeWeek(-1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Semaine précédente
                    </Button>
                    <Button className="button-retour" onClick={() => changeWeek(1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Semaine suivante
                    </Button>
                    <select
                        value={currentShop}
                        onChange={(e) => changeShop(e.target.value)}
                        style={{ padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        {shops.map(shop => (
                            <option key={shop} value={shop}>{shop}</option>
                        ))}
                    </select>
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
                    <Button className="button-primary" onClick={() => {
                        console.log('Opening GlobalDayViewModal');
                        setShowGlobalDayViewModal(true);
                    }} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                        Vue globale par jour
                    </Button>
                </div>
            </div>
        );
    }

    const shopWeeklyHours = calculateShopWeeklyHours();
    const shopMonthlyHours = calculateShopMonthlyHours();
    const monthDisplay = format(new Date(currentWeek), 'MM');

    return (
        <div className="planning-container">
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', fontSize: '14px', marginBottom: '5px' }}>
                Planning pour {currentShop}
            </h2>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', fontSize: '14px', marginBottom: '15px' }}>
                Semaine du Lundi {format(new Date(currentWeek), 'd MMMM yyyy', { locale: fr })} au Dimanche {format(addDays(new Date(currentWeek), 6), 'd MMMM yyyy', { locale: fr })}
            </p>
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
            <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <Button className="button-retour" onClick={() => changeWeek(-1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    Semaine précédente
                </Button>
                <Button className="button-retour" onClick={() => changeWeek(1)} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    Semaine suivante
                </Button>
                <select
                    value={currentShop}
                    onChange={(e) => changeShop(e.target.value)}
                    style={{ padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                    {shops.map(shop => (
                        <option key={shop} value={shop}>{shop}</option>
                    ))}
                </select>
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
                <Button className="button-primary" onClick={() => {
                    console.log('Opening GlobalDayViewModal');
                    setShowGlobalDayViewModal(true);
                }} style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}>
                    Vue globale par jour
                </Button>
                <Button
                    className="button-primary"
                    onClick={() => {
                        console.log('Toggling calendar totals:', !showCalendarTotals);
                        setShowCalendarTotals(!showCalendarTotals);
                    }}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    {showCalendarTotals ? 'Masquer totaux calendaires' : 'Afficher totaux calendaires'}
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
                {(loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || []).map((employee, index) => (
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
                            JOUR ({calculateEmployeeDailyHours(employee, format(addDays(new Date(currentWeek), currentDay), 'yyyy-MM-dd'), planning).toFixed(1)} h)
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
                            SEMAINE RÉELLE ({calculateEmployeeWeeklyHours(employee, currentWeek, planning).realHours.toFixed(1)} h)
                        </Button>
                        {showCalendarTotals && (
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
                                SEMAINE CALENDAIRE ({calculateEmployeeWeeklyHours(employee, currentWeek, planning).calendarHours.toFixed(1)} h)
                            </Button>
                        )}
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
                            MOIS RÉEL ({monthDisplay}) ({calculateEmployeeMonthlyHours(employee, currentWeek).realHours.toFixed(1)} h)
                        </Button>
                        {showCalendarTotals && (
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
                                MOIS CALENDAIRE ({monthDisplay}) ({calculateEmployeeMonthlyHours(employee, currentWeek).calendarHours.toFixed(1)} h)
                            </Button>
                        )}
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
                        <span>{currentShop}</span>
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
                        SEMAINE RÉELLE ({shopWeeklyHours.realHours} h)
                    </Button>
                    {showCalendarTotals && (
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
                    )}
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
                        MENSUEL RÉEL ({monthDisplay}) ({shopMonthlyHours.realHours} h)
                    </Button>
                    {showCalendarTotals && (
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
                            MENSUEL CALENDAIRE ({monthDisplay}) ({shopMonthlyHours.calendarHours} h)
                        </Button>
                    )}
                    <Button
                        className="button-recap"
                        onClick={() => {
                            console.log('Opening MonthlyDetailModal');
                            setShowMonthlyDetailModal(true);
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
                        MENSUEL DÉTAIL ({monthDisplay})
                    </Button>
                </div>
            </div>
            <PlanningTable
                config={config}
                selectedWeek={currentWeek}
                planning={planning}
                selectedEmployees={loadFromLocalStorage(`selected_employees_${currentShop}_${currentWeek}`, selectedEmployees || []) || []}
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
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
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
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
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
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
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
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
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
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                />
            )}
            {(showMonthlyRecapModal || showEmployeeMonthlyRecap) && (
                <MonthlyRecapModals
                    config={config}
                    selectedShop={currentShop}
                    selectedWeek={currentWeek}
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
            <MonthlyDetailModal
                show={showMonthlyDetailModal}
                setShow={setShowMonthlyDetailModal}
            />
        </div>
    );
};

export default PlanningDisplay;