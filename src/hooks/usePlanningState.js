import { useState, useEffect } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

export const usePlanningState = ({ config, selectedShop, selectedWeek, selectedEmployees, initialPlanning, setGlobalPlanning }) => {
  const [planning, setPlanning] = useState(initialPlanning || {});
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [error, setError] = useState(null);
  const [currentShop, setCurrentShop] = useState(selectedShop);
  const [currentWeek, setCurrentWeek] = useState(selectedWeek);
  const [localFeedback, setLocalFeedback] = useState('');

  useEffect(() => {
    if (!selectedShop || !selectedWeek) return;

    const loadWeeks = () => {
      const weeks = [];
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
      console.log('Fetching saved weeks for shop:', selectedShop, storageKeys);

      storageKeys.forEach(key => {
        const weekKey = key.replace(`planning_${selectedShop}_`, '');
        try {
          const weekDate = new Date(weekKey);
          if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
            const weekPlanning = loadFromLocalStorage(key, {});
            if (Object.keys(weekPlanning).length > 0) {
              weeks.push({
                key: weekKey,
                date: weekDate,
                display: `Semaine du ${format(weekDate, 'd MMMM yyyy', { locale: fr })}`
              });
              console.log(`Week data for ${weekKey}:`, weekPlanning);
            }
          }
        } catch (e) {
          console.error(`Invalid date format for key ${key}:`, e);
        }
      });

      weeks.sort((a, b) => a.date - b.date);
      console.log('Processed saved weeks:', weeks);
      setAvailableWeeks(weeks);
    };

    loadWeeks();
    const weekPlanning = loadFromLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
    setPlanning(weekPlanning);
    console.log('usePlanningState: Loaded planning for', selectedShop, selectedWeek, weekPlanning);
  }, [selectedShop, selectedWeek]);

  useEffect(() => {
    if (Object.keys(planning).length > 0 && currentShop && currentWeek) {
      console.log('Saving planning to localStorage:', { currentShop, currentWeek, planning });
      saveToLocalStorage(`planning_${currentShop}_${currentWeek}`, planning);
      setGlobalPlanning(prev => ({
        ...prev,
        [currentShop]: {
          ...(prev[currentShop] || {}),
          [currentWeek]: planning
        }
      }));

      if (isMonday(new Date(currentWeek))) {
        setAvailableWeeks(prev => {
          const weeks = [...prev];
          const weekExists = weeks.some(week => week.key === currentWeek);
          if (!weekExists) {
            weeks.push({
              key: currentWeek,
              date: new Date(currentWeek),
              display: `Semaine du ${format(new Date(currentWeek), 'd MMMM yyyy', { locale: fr })}`
            });
          }
          weeks.sort((a, b) => a.date - b.date);
          console.log('Available weeks:', weeks);
          return weeks;
        });
      }
    }
  }, [planning, currentShop, currentWeek, setGlobalPlanning]);

  return {
    planning,
    setPlanning,
    availableWeeks,
    setAvailableWeeks,
    error,
    setError,
    currentShop,
    setCurrentShop,
    currentWeek,
    setCurrentWeek,
    localFeedback,
    setLocalFeedback
  };
};