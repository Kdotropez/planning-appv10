import React, { useState, useEffect } from 'react';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import ShopSelection from './components/steps/ShopSelection';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ResetModal from './components/planning/ResetModal';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import '@/assets/styles.css';

const App = () => {
    const [step, setStep] = useState(1);
    const [selectedShop, setSelectedShop] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [config, setConfig] = useState({
        timeSlots: [],
        interval: 30,
        startTime: '09:00',
        endTime: '01:00',
        startTimeCustom: '',
        endTimeCustom: ''
    });
    const [feedback, setFeedback] = useState('');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetSource, setResetSource] = useState('');

    // Vider localStorage au démarrage initial
    useEffect(() => {
        console.log('Clearing localStorage on initial load');
        localStorage.clear();
    }, []);

    // Réinitialiser le feedback lors du changement d'étape
    useEffect(() => {
        console.log('Resetting feedback on step change:', step);
        setFeedback('');
    }, [step]);

    const shops = loadFromLocalStorage('shops', []);

    const handleNextConfig = (newConfig) => {
        console.log('App: Setting config:', newConfig);
        setConfig(newConfig);
        setStep(2);
    };

    const handleNextShop = (shop) => {
        console.log('App: Setting selectedShop:', shop);
        setSelectedShop(shop);
        setStep(3);
    };

    const handleNextWeek = (week) => {
        console.log('App: Setting selectedWeek:', week);
        setSelectedWeek(week);
        setStep(4);
    };

    const handleBackWeek = () => {
        console.log('App: Going back to shop selection');
        setStep(2);
    };

    const handleBackEmployee = () => {
        console.log('App: Going back to week selection');
        setStep(3);
    };

    const handleReset = (data) => {
        console.log('App: handleReset called with:', data);
        if (data.source === 'shops') {
            console.log('App: Resetting shops only');
            saveToLocalStorage('shops', []);
            saveToLocalStorage('lastPlanning', {});
            setSelectedShop('');
            setFeedback(data.feedback);
            setStep(2);
        } else if (data.source === 'week') {
            console.log('App: Resetting week');
            if (data.resetOption === 'week' && data.selectedWeek) {
                saveToLocalStorage(`planning_${selectedShop}_${data.selectedWeek}`, {});
                saveToLocalStorage(`selected_employees_${selectedShop}_${data.selectedWeek}`, []);
                setFeedback(data.feedback);
                setStep(3);
            } else if (data.resetOption === 'all_weeks' && selectedShop) {
                const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`) || key.startsWith(`selected_employees_${selectedShop}_`));
                storageKeys.forEach(key => localStorage.removeItem(key));
                setFeedback(data.feedback);
                setStep(3);
            }
        } else {
            console.log('App: Full reset');
            setSelectedShop('');
            setSelectedWeek('');
            setSelectedEmployees([]);
            setConfig({
                timeSlots: [],
                interval: 30,
                startTime: '09:00',
                endTime: '01:00',
                startTimeCustom: '',
                endTimeCustom: ''
            });
            localStorage.clear();
            setFeedback(data.feedback || 'Succès: Toutes les données réinitialisées.');
            setStep(1);
        }
        setIsResetModalOpen(false);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <TimeSlotConfig
                        config={config}
                        setConfig={setConfig}
                        setStep={setStep}
                        setFeedback={setFeedback}
                        onNext={handleNextConfig}
                        onReset={() => {
                            setResetSource('config');
                            setIsResetModalOpen(true);
                        }}
                    />
                );
            case 2:
                return (
                    <ShopSelection
                        shops={shops}
                        selectedShop={selectedShop}
                        setSelectedShop={setSelectedShop}
                        onNext={handleNextShop}
                        onReset={() => {
                            setResetSource('shops');
                            setIsResetModalOpen(true);
                        }}
                        setFeedback={setFeedback}
                        setStep={setStep}
                    />
                );
            case 3:
                return (
                    <WeekSelection
                        onNext={handleNextWeek}
                        onBack={handleBackWeek}
                        onReset={() => {
                            setResetSource('week');
                            setIsResetModalOpen(true);
                        }}
                        selectedWeek={selectedWeek}
                        selectedShop={selectedShop}
                    />
                );
            case 4:
                return (
                    <EmployeeSelection
                        selectedEmployees={selectedEmployees}
                        setSelectedEmployees={setSelectedEmployees}
                        selectedShop={selectedShop}
                        selectedWeek={selectedWeek}
                        setStep={setStep}
                        setFeedback={setFeedback}
                        onReset={() => {
                            setResetSource('employees');
                            setIsResetModalOpen(true);
                        }}
                    />
                );
            case 5:
                return (
                    <PlanningDisplay
                        config={config}
                        selectedShop={selectedShop}
                        selectedWeek={selectedWeek}
                        selectedEmployees={selectedEmployees}
                        planning={{}}
                        onBack={handleBackEmployee}
                        onBackToShop={() => setStep(2)}
                        onBackToWeek={() => setStep(3)}
                        onBackToConfig={() => setStep(1)}
                        onReset={() => {
                            setResetSource('planning');
                            setIsResetModalOpen(true);
                        }}
                    />
                );
            default:
                return <div>Étape inconnue</div>;
        }
    };

    return (
        <div>
            {renderStep()}
            <ResetModal
                showResetModal={isResetModalOpen}
                setShowResetModal={setIsResetModalOpen}
                config={config}
                selectedShop={selectedShop}
                selectedWeek={selectedWeek}
                selectedEmployees={selectedEmployees}
                planning={{}}
                setPlanning={() => {}}
                setFeedback={setFeedback}
                setAvailableWeeks={() => {}}
                resetSource={resetSource}
            />
            {feedback && (
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Succès') ? '#4caf50' : '#e53935' }}>
                    {feedback}
                </p>
            )}
        </div>
    );
};

export default App;