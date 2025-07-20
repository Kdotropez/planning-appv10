import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import { exportAllData } from '../../utils/backupUtils';
import Button from '../common/Button';
import PlanningTable from './PlanningTable';
import RecapModal from './RecapModal';
import MonthlyRecapModals from './MonthlyRecapModals';
import CopyPasteSection from './CopyPasteSection';
import '@/assets/styles.css';

const PlanningDisplay = ({ config, shops, selectedShop, setSelectedShop, setStep, setFeedback }) => {
    const [selectedWeek, setSelectedWeek] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [planning, setPlanning] = useState({});
    const [currentDay, setCurrentDay] = useState(0);
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
    const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');

    useEffect(() => {
        if (selectedShop) {
            const shopData = loadFromLocalStorage('shops', []).find(s => s.shop === selectedShop) || { employees: [], weeks: {} };
            setSelectedEmployees(loadFromLocalStorage(`employees_${selectedShop}`, []));
            const weekData = loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
            setPlanning(weekData);
            console.log(`PlanningDisplay: Loaded planning for ${selectedShop}, week ${selectedWeek}:`, weekData);
        }
    }, [selectedShop, selectedWeek]);

    const days = Array.from({ length: 7 }, (_, i) => ({
        name: format(addDays(new Date(selectedWeek), i), 'EEEE', { locale: fr }),
        date: format(addDays(new Date(selectedWeek), i), 'dd/MM', { locale: fr })
    }));

    const calculateEmployeeDailyHours = (employee, dayKey, planning) => {
        if (!planning[employee]?.[dayKey]) return 0;
        const slots = planning[employee][dayKey];
        const slotCount = slots.filter(Boolean).length;
        return (slotCount * config.interval) / 60;
    };

    const calculateEmployeeWeeklyHours = (employee, week, planning) => {
        let totalHours = 0;
        for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(new Date(week), i), 'yyyy-MM-dd');
            totalHours += calculateEmployeeDailyHours(employee, dayKey, planning);
        }
        return totalHours;
    };

    const calculateShopWeeklyHours = () => {
        let totalHours = 0;
        selectedEmployees.forEach(employee => {
            totalHours += calculateEmployeeWeeklyHours(employee, selectedWeek, planning);
        });
        return totalHours.toFixed(1);
    };

    const handleExport = () => {
        exportAllData(setFeedback);
    };

    return (
        <div className="planning-container">
            <h2>Planning - {selectedShop}</h2>
            <div className="week-selection-container">
                <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                >
                    {loadFromLocalStorage('shops', [])
                        .find(s => s.shop === selectedShop)?.weeks &&
                        Object.keys(loadFromLocalStorage('shops', []).find(s => s.shop === selectedShop).weeks).map(week => (
                            <option key={week} value={week}>
                                Semaine du {format(new Date(week), 'd MMMM yyyy', { locale: fr })}
                            </option>
                        ))
                    }
                </select>
            </div>
            <div className="button-group">
                {days.map((day, index) => (
                    <Button
                        key={index}
                        className={`button-jour ${currentDay === index ? 'selected' : ''}`}
                        onClick={() => setCurrentDay(index)}
                    >
                        <div className="day-button-content">
                            <span>{day.name}</span>
                            <span>{day.date}</span>
                        </div>
                    </Button>
                ))}
            </div>
            <PlanningTable
                config={config}
                selectedEmployees={selectedEmployees}
                planning={planning}
                setPlanning={setPlanning}
                selectedShop={selectedShop}
                selectedWeek={selectedWeek}
                currentDay={currentDay}
            />
            <div className="navigation-buttons">
                <Button className="button-retour" onClick={() => setStep(2)}>
                    Retour Boutique
                </Button>
                <Button className="button-retour" onClick={() => setStep(3)}>
                    Retour Employés
                </Button>
                <Button className="button-primary" onClick={handleExport}>
                    Exporter
                </Button>
                <Button className="button-primary" onClick={() => setShowRecapModal('week')}>
                    Planning Semaine
                </Button>
                <Button className="button-primary" onClick={() => setShowMonthlyRecapModal(true)}>
                    Planning Mensuel
                </Button>
            </div>
            <CopyPasteSection
                config={config}
                selectedShop={selectedShop}
                selectedWeek={selectedWeek}
                selectedEmployees={selectedEmployees}
                planning={planning}
                setPlanning={setPlanning}
                setFeedback={setFeedback}
            />
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
        </div>
    );
};

export default PlanningDisplay;