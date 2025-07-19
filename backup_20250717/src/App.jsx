import React, { useState, useEffect } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/localStorage';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import './assets/styles.css';

const App = () => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig', {}) || {});
    const [selectedShop, setSelectedShop] = useState(loadFromLocalStorage('selectedShop', '') || '');
    const [selectedWeek, setSelectedWeek] = useState(loadFromLocalStorage('selectedWeek', '') || '');
    const [selectedEmployees, setSelectedEmployees] = useState(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || []);
    const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
    const [feedback, setFeedback] = useState('');

    const handleReset = ({ feedback }) => {
        setConfig({});
        setSelectedShop('');
        setSelectedWeek('');
        setSelectedEmployees([]);
        setPlanning({});
        setFeedback(feedback);
        setStep(1);
    };

    const handleNext = (data) => {
        console.log('handleNext called with data:', data, 'for step:', step);
        setFeedback('');
        if (step === 1) {
            setConfig(data);
            setStep(step + 1);
        } else if (step === 2) {
            setSelectedShop(data);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${data}_${selectedWeek}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${data}_${selectedWeek}`, {}) || {});
            saveToLocalStorage('selectedShop', data);
            setStep(step + 1);
        } else if (step === 3) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!data || !dateRegex.test(data) || isNaN(new Date(data).getTime())) {
                setFeedback('Erreur: Veuillez sélectionner une semaine valide (format YYYY-MM-DD).');
                console.log('Invalid week data:', data);
                return;
            }
            setSelectedWeek(data);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${selectedShop}_${data}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${data}`, {}) || {});
            setStep(step + 1);
        } else if (step === 4) {
            setSelectedEmployees(data);
            saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, data);
            setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        console.log('handleBack called, current step:', step);
        if (step > 1) {
            setStep(step - 1);
            const storedSelectedShop = loadFromLocalStorage('selectedShop', '') || '';
            setSelectedShop(storedSelectedShop);
            setSelectedEmployees(loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []) || []);
            setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
            console.log('Returning to step:', step - 1, 'Restored selectedShop:', storedSelectedShop, 'Restored employees:', loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []));
        }
    };

    const handleBackToShop = () => {
        console.log('handleBackToShop called');
        setStep(2);
        const storedSelectedShop = loadFromLocalStorage('selectedShop', '') || '';
        setSelectedShop(storedSelectedShop);
        setSelectedEmployees(loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []) || []);
        setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
        console.log('Restored selectedShop:', storedSelectedShop, 'Restored employees:', loadFromLocalStorage(`selected_employees_${storedSelectedShop}_${selectedWeek}`, []));
    };

    const handleBackToWeek = () => {
        console.log('handleBackToWeek called');
        setStep(3);
        setSelectedWeek(loadFromLocalStorage('selectedWeek', '') || '');
        setSelectedEmployees(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || []);
        setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
        console.log('Restored selectedWeek:', loadFromLocalStorage('selectedWeek', ''), 'Restored employees:', loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []));
    };

    const handleBackToConfig = () => {
        console.log('handleBackToConfig called');
        setStep(1);
        setConfig(loadFromLocalStorage('timeSlotConfig', {}) || {});
        setPlanning(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {});
        console.log('Restored config:', loadFromLocalStorage('timeSlotConfig', ''));
    };

    const validateImportedData = (data) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validKeys = ['shops', 'selectedWeek', 'timeSlotConfig'];
        const errors = [];

        for (const key in data) {
            if (!validKeys.includes(key) && !key.startsWith('employees_') && !key.startsWith('selected_employees_') && !key.startsWith('planning_') && !key.startsWith('copied_') && !key.startsWith('lastPlanning_')) {
                errors.push(`Clé non reconnue: ${key}`);
            }
            if (key.startsWith('planning_') || key === 'selectedWeek') {
                const datePart = key.startsWith('planning_') ? key.split('_')[2] : data[key];
                if (datePart && (!dateRegex.test(datePart) || isNaN(new Date(datePart).getTime()))) {
                    errors.push(`Date invalide dans ${key}: ${datePart}`);
                }
            }
            if (key === 'shops' && !Array.isArray(data[key])) {
                errors.push('La clé "shops" doit être un tableau.');
            }
            if (key === 'timeSlotConfig') {
                const config = data[key];
                if (!config || typeof config !== 'object' || !config.interval || !config.startTime || !config.endTime || !Array.isArray(config.timeSlots)) {
                    errors.push('La clé "timeSlotConfig" doit contenir interval, startTime, endTime et timeSlots.');
                }
            }
            if (key.startsWith('employees_') && !Array.isArray(data[key])) {
                errors.push(`La clé ${key} doit être un tableau.`);
            }
            if (key.startsWith('selected_employees_') && !Array.isArray(data[key])) {
                errors.push(`La clé ${key} doit être un tableau.`);
            }
        }

        return errors.length === 0 ? null : errors.join('; ');
    };

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    useEffect(() => {
        if (selectedShop && selectedWeek) {
            const newPlanning = loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}) || {};
            setPlanning(newPlanning);
            const newSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []) || [];
            setSelectedEmployees(newSelectedEmployees);
            console.log('Reloaded from localStorage:', {
                planningKey: `planning_${selectedShop}_${selectedWeek}`,
                planning: newPlanning,
                employeesKey: `selected_employees_${selectedShop}_${selectedWeek}`,
                employees: newSelectedEmployees
            });
        }
    }, [selectedShop, selectedWeek]);

    return (
        <div id="app-root" data-testid="app-container" className="app-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="landscape-prompt">
                Veuillez passer en mode paysage pour continuer.
            </div>
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Succès') ? '#4caf50' : '#e53935', marginBottom: '10px' }}>
                    {feedback}
                </p>
            )}
            {step === 1 && (
                <TimeSlotConfig
                    config={config}
                    setConfig={setConfig}
                    setStep={setStep}
                    setFeedback={setFeedback}
                />
            )}
            {step === 2 && (
                <ShopSelection
                    selectedShop={selectedShop}
                    setSelectedShop={setSelectedShop}
                    setStep={setStep}
                    setFeedback={setFeedback}
                />
            )}
            {step === 3 && (
                <WeekSelection
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                    selectedShop={selectedShop}
                    setStep={setStep}
                    setFeedback={setFeedback}
                />
            )}
            {step === 4 && (
                <EmployeeSelection
                    selectedEmployees={selectedEmployees}
                    setSelectedEmployees={setSelectedEmployees}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    setStep={setStep}
                    setFeedback={setFeedback}
                />
            )}
            {step === 5 && (
                <PlanningDisplay
                    config={config}
                    selectedShop={selectedShop}
                    selectedWeek={selectedWeek}
                    selectedEmployees={selectedEmployees}
                    planning={planning}
                    onBack={handleBack}
                    onBackToShop={handleBackToShop}
                    onBackToWeek={handleBackToWeek}
                    onBackToConfig={handleBackToConfig}
                    onReset={handleReset}
                />
            )}
        </div>
    );
};

export default App;