import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import NavigationButtons from './NavigationButtons';
import DayButtons from './DayButtons';
import RecapButtons from './RecapButtons';
import PlanningTable from './PlanningTable';
import CopyPasteToggle from './CopyPasteToggle';
import CopyPasteSection from './CopyPasteSection';
import WeekCopySection from './WeekCopySection';
import ResetModal from './ResetModal';
import RecapModal from './RecapModal';
import GlobalDayViewModal from './GlobalDayViewModal';
import MonthlyRecapModals from './MonthlyRecapModals';
import MonthlyDetailModal from './MonthlyDetailModal';

import EmployeeMonthlyWeeklyModal from './EmployeeMonthlyWeeklyModal';
import EmployeeMonthlyRecapModal from './EmployeeMonthlyRecapModal';
import EmployeeWeeklyRecapModal from './EmployeeWeeklyRecapModal';
import EmployeeMonthlyDetailModal from './EmployeeMonthlyDetailModal';
import { getShopById, getWeekPlanning, saveWeekPlanning, saveWeekPlanningForEmployee } from '../../utils/planningDataManager';
import '@/assets/styles.css';

const PlanningDisplay = ({ 
  planningData, 
  setPlanningData,
  selectedShop, 
  setSelectedShop,
  selectedWeek, 
  setSelectedWeek,
  selectedEmployees, 
  setSelectedEmployees,
  planning: initialPlanning, 
  setPlanning: setGlobalPlanning,
  onExport,
  onReset,
  onBackToStartup,
  onBackToEmployees,
  onBackToShopSelection,
  onBackToWeekSelection,
  onBackToConfig,
  setFeedback 
}) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [showCopyPaste, setShowCopyPaste] = useState(false);
  const [showWeekCopy, setShowWeekCopy] = useState(false);
  const [showGlobalDayViewModal, setShowGlobalDayViewModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(null);
  const [showMonthlyRecapModal, setShowMonthlyRecapModal] = useState(false);
  const [showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap] = useState(false);
  const [showEmployeeWeeklyRecap, setShowEmployeeWeeklyRecap] = useState(false);
  const [showMonthlyDetailModal, setShowMonthlyDetailModal] = useState(false);

  const [showEmployeeMonthlyWeeklyModal, setShowEmployeeMonthlyWeeklyModal] = useState(false);
  const [selectedEmployeeForMonthlyRecap, setSelectedEmployeeForMonthlyRecap] = useState('');
  const [selectedEmployeeForWeeklyRecap, setSelectedEmployeeForWeeklyRecap] = useState('');
  const [showEmployeeMonthlyDetail, setShowEmployeeMonthlyDetail] = useState(false);
  const [selectedEmployeeForMonthlyDetail, setSelectedEmployeeForMonthlyDetail] = useState('');


  const [showCalendarTotals, setShowCalendarTotals] = useState(false);
  const [localFeedback, setLocalFeedback] = useState('');

  // Récupérer la boutique actuelle et sa configuration
  const currentShopData = getShopById(planningData, selectedShop);
  const config = currentShopData?.config || { timeSlots: [] };
  const shops = planningData?.shops || [];
  
  // État pour les employés de la boutique actuelle
  const [currentShopEmployees, setCurrentShopEmployees] = useState([]);

  // Récupérer le planning de la semaine actuelle
  const weekData = selectedShop && selectedWeek ? getWeekPlanning(planningData, selectedShop, selectedWeek) : { planning: {}, selectedEmployees: [] };
  const [planning, setPlanning] = useState(weekData.planning || {});
  
  // Initialiser localSelectedEmployees avec les employés sélectionnés globaux si weekData est vide
  const initialSelectedEmployees = weekData.selectedEmployees && weekData.selectedEmployees.length > 0 
    ? weekData.selectedEmployees 
    : selectedEmployees;
  const [localSelectedEmployees, setLocalSelectedEmployees] = useState(initialSelectedEmployees);
  


  // Mettre à jour les employés sélectionnés globalement
  useEffect(() => {
    setSelectedEmployees(localSelectedEmployees);
  }, [localSelectedEmployees, setSelectedEmployees]);

  // Mettre à jour localSelectedEmployees quand selectedEmployees change (pour la première initialisation)
  useEffect(() => {
    if (selectedEmployees && selectedEmployees.length > 0) {
      setLocalSelectedEmployees(selectedEmployees);
    }
  }, [selectedEmployees]);

  // Mettre à jour le planning global
  useEffect(() => {
    setGlobalPlanning(planning);
  }, [planning, setGlobalPlanning]);

  // Sauvegarder les données quand elles changent (désactivé temporairement pour éviter les boucles)
  // useEffect(() => {
  //   if (selectedShop && selectedWeek) {
  //     const updatedPlanningData = saveWeekPlanning(planningData, selectedShop, selectedWeek, planning, localSelectedEmployees);
  //     setPlanningData(updatedPlanningData);
  //   }
  // }, [planning, localSelectedEmployees, selectedShop, selectedWeek]);

  const validWeek = selectedWeek && !isNaN(new Date(selectedWeek).getTime()) ? selectedWeek : format(new Date(), 'yyyy-MM-dd');
  
  // S'assurer que la semaine commence par lundi
  const getMondayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi = 1
    return new Date(date.setDate(diff));
  };
  
  const mondayOfWeek = getMondayOfWeek(validWeek);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(mondayOfWeek, i);
    return {
      name: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd MMMM', { locale: fr }),
    };
  });

  // Formater le titre de la semaine
  const getWeekTitle = () => {
    const monday = format(mondayOfWeek, 'd MMMM', { locale: fr });
    const sunday = format(addDays(mondayOfWeek, 6), 'd MMMM yyyy', { locale: fr });
    return `Semaine du ${monday} au ${sunday}`;
  };

  useEffect(() => {
    setLocalFeedback('');
    // Réinitialiser toutes les modales pour éviter l'ouverture automatique
    setShowMonthlyRecapModal(false);
    setShowEmployeeMonthlyRecap(false);
    setShowEmployeeMonthlyWeeklyModal(false);
    setShowMonthlyDetailModal(false);
    setShowEmployeeWeeklyRecap(false);
    setShowEmployeeMonthlyDetail(false);
    setShowRecapModal(null);
    setShowGlobalDayViewModal(false);
    setShowResetModal(false);
    setSelectedEmployeeForMonthlyRecap('');
    setSelectedEmployeeForWeeklyRecap('');
    setSelectedEmployeeForMonthlyDetail('');
  }, [selectedShop, selectedWeek]);

  // Gérer le changement de boutique et de semaine de manière unifiée
  useEffect(() => {
    if (selectedShop && selectedWeek) {
      // 1. Récupérer les données de la boutique actuelle (recalculer à chaque changement)
      const currentShopData = getShopById(planningData, selectedShop);
      const allShopEmployees = currentShopData?.employees || [];
      
      // Filtrer les employés qui peuvent travailler dans cette boutique
      const shopEmployees = allShopEmployees.filter(emp => 
        emp.canWorkIn && emp.canWorkIn.includes(selectedShop)
      );
      
      const currentShopEmployeeIds = shopEmployees.map(emp => emp.id);
      
      // Mettre à jour les employés de la boutique actuelle
      setCurrentShopEmployees(shopEmployees);
      
      // 2. Récupérer le planning existant pour cette boutique/semaine
      const weekData = getWeekPlanning(planningData, selectedShop, selectedWeek);
      setPlanning(weekData.planning || {});
      
      // 3. Gérer les employés sélectionnés
      if (weekData.selectedEmployees && weekData.selectedEmployees.length > 0) {
        // Si des employés étaient sauvegardés pour cette semaine, les filtrer pour la boutique actuelle
        const validEmployees = weekData.selectedEmployees.filter(empId => currentShopEmployeeIds.includes(empId));
        setLocalSelectedEmployees(validEmployees);
        setSelectedEmployees(validEmployees);
      } else {
        // Si aucun employé n'était sauvegardé, sélectionner tous les employés de la boutique
        if (currentShopEmployeeIds.length > 0) {
          setLocalSelectedEmployees(currentShopEmployeeIds);
          setSelectedEmployees(currentShopEmployeeIds);
        } else {
          setLocalSelectedEmployees([]);
          setSelectedEmployees([]);
        }
      }
    }
  }, [selectedShop, selectedWeek, planningData]);

  const toggleSlot = useCallback((employee, slotIndex, dayIndex, forceValue = null) => {
    if (!(config?.timeSlots?.length || 0)) {
      setLocalFeedback('Erreur: Configuration des tranches horaires non valide.');
      return;
    }
    setPlanning(prev => {
      const dayKey = format(addDays(mondayOfWeek, dayIndex), 'yyyy-MM-dd');
      const updatedPlanning = { ...prev };
      if (!updatedPlanning[employee]) {
        updatedPlanning[employee] = {};
      }
      if (!Array.isArray(updatedPlanning[employee][dayKey])) {
        updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
      }
      updatedPlanning[employee][dayKey] = updatedPlanning[employee][dayKey].map((val, idx) =>
        idx === slotIndex ? (forceValue !== null ? forceValue : !val) : val
      );
      return updatedPlanning;
    });
  }, [config, mondayOfWeek]);

  const changeWeek = (direction) => {
    const currentDate = new Date(validWeek);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    const newWeek = format(newDate, 'yyyy-MM-dd');
    setSelectedWeek(newWeek);
  };

  const changeMonth = (monthKey) => {
    // monthKey est au format 'yyyy-MM'
    const [year, month] = monthKey.split('-');
    // Aller au premier lundi du mois sélectionné
    const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    const firstMondayOfMonth = new Date(firstDayOfMonth);
    firstMondayOfMonth.setDate(firstDayOfMonth.getDate() + daysToAdd);
    
    const newWeek = format(firstMondayOfMonth, 'yyyy-MM-dd');
    setSelectedWeek(newWeek);
  };

  const changeShop = (newShop) => {
    try {
      // Sauvegarder le planning actuel avant de changer de boutique
      if (selectedShop && selectedWeek && Object.keys(planning).length > 0) {
        console.log('Sauvegarde avant changement de boutique:', { selectedShop, selectedWeek, planning, localSelectedEmployees });
        let updatedPlanningData = planningData;
        // Sauvegarder pour tous les employés multi-boutiques
        localSelectedEmployees.forEach(employeeId => {
          updatedPlanningData = saveWeekPlanningForEmployee(
            updatedPlanningData,
            employeeId,
            selectedWeek,
            planning,
            localSelectedEmployees,
            selectedShop // on sauvegarde dans la boutique qu'on quitte
          );
        });
        setPlanningData(updatedPlanningData);
      }
    } catch (e) {
      console.error("Erreur lors de la sauvegarde du planning avant changement de boutique :", e);
    }
    setSelectedShop(newShop);
    // Fermer toutes les modales
    setShowMonthlyRecapModal(false);
    setShowEmployeeMonthlyRecap(false);
    setShowEmployeeWeeklyRecap(false);
    setShowEmployeeMonthlyWeeklyModal(false);
    setShowMonthlyDetailModal(false);
    setShowEmployeeMonthlyDetail(false);
    setShowRecapModal(null);
    setShowGlobalDayViewModal(false);
    setShowResetModal(false);
    setSelectedEmployeeForMonthlyRecap('');
    setSelectedEmployeeForWeeklyRecap('');
    setSelectedEmployeeForMonthlyDetail('');
    // Réinitialiser le feedback
    setLocalFeedback('');
  };

  const handleEmployeeToggle = (employee) => {
    setLocalSelectedEmployees(prev => {
      const isSelected = prev.includes(employee);
      if (isSelected) {
        return prev.filter(emp => emp !== employee);
      } else {
        return [...prev, employee];
      }
    });
  };

  const handleReset = (resetType, employeeName = null) => {
    if (resetType === 'all') {
      // Effacer tous les clics
      setPlanning({});
      setFeedback('Tous les clics réinitialisés');
    } else if (resetType === 'employee' && employeeName) {
      // Effacer les clics d'un employé spécifique
      const newPlanning = { ...planning };
      // Supprimer toutes les entrées pour cet employé
      Object.keys(newPlanning).forEach(key => {
        if (key.startsWith(employeeName + '_')) {
          delete newPlanning[key];
        }
      });
      setPlanning(newPlanning);
      setFeedback(`Clics de ${employeeName} réinitialisés`);
    } else if (resetType === 'week') {
      setPlanning({});
      setLocalSelectedEmployees([]);
      setFeedback('Semaine réinitialisée');
    } else if (resetType === 'clicks') {
      setPlanning({});
      setFeedback('Clics réinitialisés');
    }
  };

  if (!currentShopData) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Aucune boutique sélectionnée</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Il semble qu'aucune boutique ne soit configurée ou sélectionnée.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button
            onClick={onBackToStartup}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retour à l'écran de démarrage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-display">
      {localFeedback && (
        <p style={{ 
          fontFamily: 'Roboto, sans-serif', 
          textAlign: 'center', 
          color: localFeedback.includes('Succès') ? '#4caf50' : '#e53935', 
          marginBottom: '10px' 
        }}>
          {localFeedback}
        </p>
      )}
      
      {/* Bouton d'urgence pour fermer toutes les modales */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: '#ff4444',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
      onClick={() => {
        setShowMonthlyRecapModal(false);
        setShowEmployeeMonthlyRecap(false);

        setShowEmployeeMonthlyWeeklyModal(false);
        setShowMonthlyDetailModal(false);
        setShowRecapModal(null);
        setShowGlobalDayViewModal(false);
        setShowResetModal(false);
        setSelectedEmployeeForMonthlyRecap('');
      }}>
        🚨 FORCER FERMETURE MODALES
      </div>
      


      <NavigationButtons
        shops={shops}
        currentShop={selectedShop}
        currentWeek={selectedWeek}
        changeShop={changeShop}
        changeWeek={changeWeek}
        changeMonth={changeMonth}
        onBack={onBackToEmployees}
        onBackToShop={onBackToShopSelection}
        onBackToWeek={onBackToWeekSelection}
        onBackToConfig={onBackToConfig}
        onExport={onExport}
        onReset={() => setShowResetModal(true)}
        onBackToStartup={onBackToStartup}
        setShowGlobalDayViewModal={setShowGlobalDayViewModal}
      />

      <div className="planning-content">
        <div className="planning-left">
          {/* Titre de la semaine */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '2px solid #e9ecef'
          }}>
            <h2 style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2c3e50',
              margin: '0',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {getWeekTitle()}
            </h2>
            <p style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '16px',
              color: '#6c757d',
              margin: '5px 0 0 0',
              fontStyle: 'italic'
            }}>
              {selectedShop}
            </p>
          </div>

          <DayButtons 
            days={days} 
            currentDay={currentDay} 
            setCurrentDay={setCurrentDay}
            planning={planning}
            config={config}
            selectedEmployees={localSelectedEmployees}
            selectedWeek={format(mondayOfWeek, 'yyyy-MM-dd')}
            selectedShop={selectedShop}
          />
          
          <RecapButtons
            selectedEmployees={localSelectedEmployees}
            currentWeek={selectedWeek}
            currentShop={selectedShop}
            config={config}
            shops={shops}
            currentDay={currentDay}
            showCalendarTotals={showCalendarTotals}
            setShowRecapModal={setShowRecapModal}
            setShowMonthlyRecapModal={setShowMonthlyRecapModal}
            setShowEmployeeMonthlyRecap={setShowEmployeeMonthlyRecap}
            setShowEmployeeWeeklyRecap={setShowEmployeeWeeklyRecap}
            setShowMonthlyDetailModal={setShowMonthlyDetailModal}
            setShowEmployeeMonthlyDetail={setShowEmployeeMonthlyDetail}
    
            setSelectedEmployeeForMonthlyRecap={setSelectedEmployeeForMonthlyRecap}
            setSelectedEmployeeForWeeklyRecap={setSelectedEmployeeForWeeklyRecap}
            setSelectedEmployeeForMonthlyDetail={setSelectedEmployeeForMonthlyDetail}
            currentShopEmployees={currentShopEmployees}
            planning={planning}
            planningData={planningData}
          />

          <CopyPasteToggle 
            showCopyPaste={showCopyPaste} 
            onToggle={setShowCopyPaste} 
          />

          {showCopyPaste && (
            <CopyPasteSection
              planning={planning}
              config={config}
              currentWeek={validWeek}
              currentShop={selectedShop}
              setPlanning={setPlanning}
              setFeedback={setLocalFeedback}
            />
          )}

          <WeekCopySection
            showWeekCopy={showWeekCopy}
            onToggle={setShowWeekCopy}
            currentWeek={validWeek}
            currentShop={selectedShop}
            planning={planning}
            setPlanning={setPlanning}
            setFeedback={setLocalFeedback}
          />
        </div>

        <div className="planning-right">
          <PlanningTable
            employees={currentShopEmployees}
            selectedEmployees={localSelectedEmployees}
            onEmployeeToggle={handleEmployeeToggle}
            planning={planning}
            onToggleSlot={toggleSlot}
            config={config}
            currentDay={currentDay}
            selectedWeek={format(mondayOfWeek, 'yyyy-MM-dd')}
            showCalendarTotals={showCalendarTotals}
            setShowCalendarTotals={setShowCalendarTotals}
            currentShopEmployees={currentShopEmployees}
          />
        </div>
      </div>

      {/* Modales */}
      <ResetModal
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        onReset={handleReset}
        currentShop={selectedShop}
        currentWeek={validWeek}
        employees={currentShopEmployees}
      />

      <RecapModal
        show={showRecapModal !== null}
        onClose={() => setShowRecapModal(null)}
        recapType={showRecapModal}
        employees={currentShopEmployees}
        planning={planning}
        config={config}
        currentWeek={validWeek}
        currentShop={selectedShop}
      />

      <GlobalDayViewModal
        show={showGlobalDayViewModal}
        onClose={() => setShowGlobalDayViewModal(false)}
        planning={planning}
        config={config}
        currentDay={currentDay}
        currentWeek={validWeek}
        employees={currentShopEmployees}
      />

      {showMonthlyRecapModal && (
        <MonthlyRecapModals
          showMonthlyRecapModal={showMonthlyRecapModal}
          setShowMonthlyRecapModal={setShowMonthlyRecapModal}
          config={config}
          selectedShop={selectedShop}
          selectedWeek={validWeek}
          selectedEmployees={localSelectedEmployees}
          shops={shops}
        />
      )}

      {/* Temporairement désactivé pour éviter les problèmes d'affichage */}
      {false && (
        <MonthlyDetailModal
          show={showMonthlyDetailModal}
          onClose={() => setShowMonthlyDetailModal(false)}
          planning={planning}
          config={config}
          currentWeek={validWeek}
          currentShop={selectedShop}
          employees={currentShopEmployees}
        />
      )}



      {/* Modales temporairement désactivées pour éviter l'ouverture automatique */}
      {showEmployeeMonthlyWeeklyModal && (
        <EmployeeMonthlyWeeklyModal
          show={showEmployeeMonthlyWeeklyModal}
          onClose={() => setShowEmployeeMonthlyWeeklyModal(false)}
          selectedEmployeeForMonthlyRecap={selectedEmployeeForMonthlyRecap}
          setSelectedEmployeeForMonthlyRecap={setSelectedEmployeeForMonthlyRecap}
          currentWeek={validWeek}
          currentShop={selectedShop}
          config={config}
        />
      )}

      {showEmployeeMonthlyRecap && (
        <EmployeeMonthlyRecapModal
          showEmployeeMonthlyRecap={showEmployeeMonthlyRecap}
          setShowEmployeeMonthlyRecap={setShowEmployeeMonthlyRecap}
          config={config}
          selectedShop={selectedShop}
          selectedWeek={validWeek}
          selectedEmployees={localSelectedEmployees}
          selectedEmployeeForMonthlyRecap={selectedEmployeeForMonthlyRecap}
          shops={shops}
          employees={currentShopEmployees}
          planningData={planningData}
        />
      )}

      {showEmployeeWeeklyRecap && (
        <EmployeeWeeklyRecapModal
          showEmployeeWeeklyRecap={showEmployeeWeeklyRecap}
          setShowEmployeeWeeklyRecap={setShowEmployeeWeeklyRecap}
          config={config}
          selectedShop={selectedShop}
          selectedWeek={validWeek}
          selectedEmployeeForWeeklyRecap={selectedEmployeeForWeeklyRecap}
          shops={shops}
          employees={currentShopEmployees}
          planningData={planningData}
        />
      )}

      {showEmployeeMonthlyDetail && (
        <EmployeeMonthlyDetailModal
          showEmployeeMonthlyDetail={showEmployeeMonthlyDetail}
          setShowEmployeeMonthlyDetail={setShowEmployeeMonthlyDetail}
          config={config}
          selectedShop={selectedShop}
          selectedWeek={validWeek}
          selectedEmployeeForMonthlyDetail={selectedEmployeeForMonthlyDetail}
          shops={shops}
          employees={currentShopEmployees}
          planningData={planningData}
        />
      )}
    </div>
  );
};

export default PlanningDisplay;