// src/App.jsx
import { useState, useEffect } from 'react';
import { loadFromLocalStorage, saveToLocalStorage, loadShopBackup } from './utils/localStorage';
import ErrorBoundary from './components/common/ErrorBoundary';
import TimeSlotConfig from './components/steps/TimeSlotConfig';
import ShopSelection from './components/steps/ShopSelection';
import WeekSelection from './components/steps/WeekSelection';
import EmployeeSelection from './components/steps/EmployeeSelection';
import PlanningDisplay from './components/planning/PlanningDisplay';
import './App.css';

const App = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(loadFromLocalStorage('timeSlotConfig', { interval: 30, startTime: '09:00', endTime: '23:00', timeSlots: [] }));
  const [shops, setShops] = useState(loadFromLocalStorage('shops', []));
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [planning, setPlanning] = useState({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (selectedShop) {
      const shopData = loadShopBackup(selectedShop);
      if (shopData.timeSlotConfig && Object.keys(shopData.timeSlotConfig).length > 0) {
        setConfig(shopData.timeSlotConfig);
      } else {
        setConfig({ interval: 30, startTime: '09:00', endTime: '23:00', timeSlots: [] });
      }
    }
  }, [selectedShop]);

  useEffect(() => {
    console.log('App.jsx: Current state:', { step, config, shops, selectedShop2, selectedWeek, selectedEmployees, planning });
    if (feedback) {
      const timer = setTimeout(() => setFeedback(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [step, shops, selectedShop, selectedWeek, selectedEmployees, planning, feedback]);

  const handleNext = (newShop) => {
    setSelectedShop(newShop);
    const shopData = loadShopBackup(newShop);
    if (shopData.timeSlotConfig && Object.keys(shopData.timeSlotConfig).length > 0) {
      setConfig(shopData.timeSlotConfig);
    } else {
      setConfig({ interval: 30, startTime: '09:00', endTime: '23:00', timeSlots: [] });
    }
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
      const shopData = loadShopBackup(selectedShop);
      shopData.employees = [];
      saveShopBackup(selectedShop, shopData);
      setFeedback(feedback || 'Succès: Liste des employés réinitialisée.');
    } else if (source === 'week') {
      setSelectedWeek('');
      setSelectedEmployees([]);
      const shopData = loadShopBackup(selectedShop);
      delete shopData.weeks[selectedWeek];
      saveShopBackup(selectedShop, shopData);
      setFeedback(feedback || `Succès: Semaine du ${selectedWeek} réinitialisée.`);
    } else if (source === 'all_weeks') {
      const shopData = loadShopBackup(selectedShop);
      shopData.weeks = {};
      saveShopBackup(selectedShop, shopData);
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
            setConfig={(newConfig) => {
              setConfig(newConfig);
              if (selectedShop) {
                const shopData = loadShopBackup(selectedShop);
                shopData.timeSlotConfig = newConfig;
                saveShopBackup(selectedShop, shopData);
              }
            }}
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
            setSelectedEmployees={(employees) => {
              setSelectedEmployees(employees);
              const shopData = loadShopBackup(selectedShop);
              shopData.employees = employees;
              saveShopBackup(selectedShop, shopData);
            }}
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
            setGlobalPlanning={(newPlanning) => {
              setPlanning(newPlanning);
              const shopData = loadShopBackup(selectedShop);
              shopData.weeks[selectedWeek] = shopData.weeks[selectedWeek] || {};
              shopData.weeks[selectedWeek].planning = newPlanning;
              shopData.weeks[selectedWeek].selectedEmployees = selectedEmployees;
              saveShopBackup(selectedShop, shopData);
            }}
            setFeedback={setFeedback}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;