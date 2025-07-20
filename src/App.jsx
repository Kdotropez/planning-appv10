import { useState, useEffect } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import ErrorBoundary from './components/common/ErrorBoundary';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import './App.css';

const App = () => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig', { interval: 30, startTime: '09:00', endTime: '01:00', timeSlots: [] }));
    const [shops, setShops] = useState(loadFromLocalStorage('shops', []));
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [planning, setPlanning] = useState({});
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        console.log('App.jsx: Current state:', { step, config, shops, selectedShop, selectedWeek, selectedEmployees, planning });
        if (feedback) {
            const timer = setTimeout(() => setFeedback(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [step, config, shops, selectedShop, selectedWeek, selectedEmployees, planning, feedback]);

    const handleNext = (newShop) => {
        setSelectedShop(newShop);
        setStep(3);
    };

    const handleWeekSelect = (week) => {
        setSelectedWeek(week);
        setStep(4);
    };

    const handleReset = ({ source, feedback, selectedWeek }) => {
        console.log('Reset called with source:', source);
        if (source === 'shops') {
            setShops([]);
            setSelectedShop('');
            saveToLocalStorage('shops', []);
            saveToLocalStorage('lastPlanning', {});
            setFeedback(feedback || 'Succès: Liste des boutiques réinitialisée.');
        } else if (source === 'employees') {
            setSelectedEmployees([]);
            saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []);
            setFeedback(feedback || 'Succès: Liste des employés réinitialisée.');
        } else if (source === 'week') {
            setSelectedWeek('');
            setSelectedEmployees([]);
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
            saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []);
            setFeedback(feedback || `Succès: Semaine du ${selectedWeek} réinitialisée.`);
        } else if (source === 'all_weeks') {
            const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`) || key.startsWith(`selected_employees_${selectedShop}_`));
            storageKeys.forEach(key => localStorage.removeItem(key));
            setFeedback(feedback || 'Succès: Toutes les semaines de la boutique réinitialisées.');
        }
    };

    return (
        <ErrorBoundary>
            <div className="app-container">
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
                        selectedShop={selectedShop}
                    />
                )}
                {step === 2 && (
                    <ShopSelection
                        shops={shops}
                        setShops={setShops}
                        selectedShop={selectedShop}
                        setSelectedShop={setSelectedShop}
                        onNext={handleNext}
                        onReset={handleReset}
                        setFeedback={setFeedback}
                        setStep={setStep}
                    />
                )}
                {step === 3 && (
                    <WeekSelection
                        onNext={handleWeekSelect}
                        onBack={() => setStep(2)}
                        onReset={handleReset}
                        selectedWeek={selectedWeek}
                        selectedShop={selectedShop}
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
                        onBack={() => setStep(4)}
                        onBackToShop={() => setStep(2)}
                        onBackToWeek={() => setStep(3)}
                        onBackToConfig={() => setStep(1)}
                        onReset={handleReset}
                        setStep={setStep}
                        setPlanning={setPlanning}
                        setFeedback={setFeedback}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
};

export default App;