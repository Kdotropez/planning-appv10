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
    const [selectedWeek, setSelectedWeek] = useState(
        loadFromLocalStorage('lastPlanning', {}).week || format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    );
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [planning, setPlanning] = useState({});
    const [currentDay, setCurrentDay] = useState(0);
    const [showRecapModal, setShowRecapModal] = useState(null);
    const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
    const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
    const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');

    useEffect(() => {
        if (selectedShop) {
            const employees = loadFromLocalStorage(`employees_${selectedShop}`, []);
            setSelectedEmployees(employees);
            const weekData = loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
            setPlanning(weekData);
            console.log(`PlanningDisplay: Loaded planning for ${selectedShop}, week ${selectedWeek}:`, weekData);
            console.log(`PlanningDisplay: Loaded employees for ${selectedShop}:`, employees);
            console.log(`PlanningDisplay: Config timeSlots:`, config.timeSlots);

            // Vérifier si selectedWeek est valide, sinon sélectionner une semaine disponible
            const availableWeeks = Object.keys(loadFromLocalStorage(`lastPlanning_${selectedShop}`, {}).weeks || {});
            if (!weekData || Object.keys(weekData).length === 0) {
                const latestWeek = availableWeeks.sort().pop();
                if (latestWeek) {
                    setSelectedWeek(latestWeek);
                    saveToLocalStorage('lastPlanning', { shop: selectedShop, week: latestWeek });
                    console.log(`PlanningDisplay: Switched to latest week for ${selectedShop}:`, latestWeek);
                }
            }
        }
    }, [selectedShop, selectedWeek, config]);

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

    const toggleSlot = (employee, slotIndex, dayIndex, value) => {
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const updatedPlanning = { ...planning };
        if (!updatedPlanning[employee]) {
            updatedPlanning[employee] = {};
        }
        if (!updatedPlanning[employee][dayKey]) {
            updatedPlanning[employee][dayKey] = new Array(config.timeSlots.length).fill(false);
        }
        updatedPlanning[employee][dayKey][slotIndex] = value;
        setPlanning(updatedPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
        console.log(`PlanningDisplay: Toggled slot for ${employee}, day ${dayKey}, slot ${slotIndex}:`, value);
    };

    return (
        <div className="planning-container">
            <h2>Planning - {selectedShop}</h2>
            <div className="week-selection-container">
                <select
                    value={selectedWeek}
                    onChange={(e) => {
                        setSelectedWeek(e.target.value);
                        saveToLocalStorage('lastPlanning', { shop: selectedShop, week: e.target.value });
                    }}
                >
                    {shops
                        .filter(shop => shop && typeof shop === 'string')
                        .flatMap(shop => {
                            const weeks = Object.keys(loadFromLocalStorage(`lastPlanning_${shop}`, {}).weeks || {});
                            return weeks.map(week => (
                                <option key={`${shop}-${week}`} value={week}>
                                    Semaine du {format(new Date(week), 'd MMMM yyyy', { locale: fr })}
                                </option>
                            ));
                        })}
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
                toggleSlot={toggleSlot}
                selectedWeek={selectedWeek}
                currentDay={currentDay}
                calculateEmployeeDailyHours={calculateEmployeeDailyHours}
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