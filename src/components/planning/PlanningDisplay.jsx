import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaFileExport, FaFileImport } from 'react-icons/fa';
import PlanningTable from './PlanningTable';
import Header from './Header';
import Footer from './Footer';
import NavigationButtons from './NavigationButtons';
import RecapModal from './RecapModal';
import ResetModal from './ResetModal';
import DayButtons from './DayButtons';
import CopyPasteSection from './CopyPasteSection';
import MonthlyRecapModals from './MonthlyRecapModals';
import {
  calculateEmployeeDailyHours,
  calculateEmployeeWeeklyHours,
  calculateShopWeeklyHours,
  getAvailableWeeks,
} from '../../utils/planningUtils';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import { exportAllData, importAllData } from '../../utils/backupUtils';
import '../../assets/styles.css';

const PlanningDisplay = ({ selectedShop, selectedWeek, config, selectedEmployees, setStep }) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [planning, setPlanning] = useState(loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {}));
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [showMonthlyRecap, setShowMonthlyRecap] = useState(false);
  const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState(getAvailableWeeks(selectedShop));

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() + i);
    return {
      name: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd MMMM', { locale: fr }),
    };
  });

  useEffect(() => {
    saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, planning);
  }, [planning, selectedShop, selectedWeek]);

  const handleCellClick = (employee, timeSlot, dayIndex) => {
    const dayKey = format(new Date(selectedWeek), 'yyyy-MM-dd', { locale: fr });
    const newPlanning = { ...planning };
    if (!newPlanning[employee]) newPlanning[employee] = {};
    if (!newPlanning[employee][dayKey]) newPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
    newPlanning[employee][dayKey][timeSlot] = !newPlanning[employee][dayKey][timeSlot];
    setPlanning(newPlanning);
  };

  return (
    <div className="app-container">
      <Header selectedShop={selectedShop} selectedWeek={selectedWeek} />
      <DayButtons days={days} currentDay={currentDay} setCurrentDay={setCurrentDay} />
      <div className="table-container">
        <PlanningTable
          planning={planning}
          config={config}
          selectedEmployees={selectedEmployees}
          currentDay={currentDay}
          days={days}
          handleCellClick={handleCellClick}
          calculateEmployeeDailyHours={calculateEmployeeDailyHours}
          calculateEmployeeWeeklyHours={calculateEmployeeWeeklyHours}
          calculateShopWeeklyHours={calculateShopWeeklyHours}
        />
      </div>
      <CopyPasteSection
        planning={planning}
        setPlanning={setPlanning}
        selectedShop={selectedShop}
        selectedWeek={selectedWeek}
        config={config}
        selectedEmployees={selectedEmployees}
      />
      <NavigationButtons
        setStep={setStep}
        exportAllData={() => exportAllData(selectedShop, 'all')}
        importAllData={(e) => importAllData(e, setAvailableWeeks)}
        setShowResetModal={setShowResetModal}
      />
      <RecapModal
        showRecapModal={showRecapModal}
        setShowRecapModal={setShowRecapModal}
        selectedShop={selectedShop}
        selectedWeek={selectedWeek}
        planning={planning}
        config={config}
        selectedEmployees={selectedEmployees}
        days={days}
      />
      <MonthlyRecapModals
        showMonthlyRecap={showMonthlyRecap}
        setShowMonthlyRecap={setShowMonthlyRecap}
        showEmployeeMonthlyRecap={showEmployeeMonthlyRecap}
        setShowEmployeeMonthlyRecap={setShowEmployeeMonthlyRecap}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        selectedShop={selectedShop}
        selectedWeek={selectedWeek}
        config={config}
        selectedEmployees={selectedEmployees}
      />
      <ResetModal
        showResetModal={showResetModal}
        setShowResetModal={setShowResetModal}
        setPlanning={setPlanning}
        selectedShop={selectedShop}
        selectedWeek={selectedWeek}
      />
      <Footer />
    </div>
  );
};

export default PlanningDisplay;