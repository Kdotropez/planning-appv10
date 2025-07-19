import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

function WeekSelection({ onNext, onBack, onReset, selectedWeek, selectedShop, onSelectWeek }) {
  const [month, setMonth] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM') : format(new Date(), 'yyyy-MM'));
  const [currentWeek, setCurrentWeek] = useState(selectedWeek || '');
  const [savedWeeks, setSavedWeeks] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [newWeek, setNewWeek] = useState('');

  useEffect(() => {
    if (!selectedShop) {
      console.warn('selectedShop est undefined, saut de la récupération des semaines');
      setSavedWeeks([]);
      setFeedback('Erreur: Aucune boutique sélectionnée.');
      return;
    }
    console.log('Fetching saved weeks for shop:', selectedShop);
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
    console.log('Found storage keys:', storageKeys);

    const weeks = storageKeys
      .map(key => {
        const weekKey = key.replace(`planning_${selectedShop}_`, '');
        console.log('Processing key:', key, 'Extracted weekKey:', weekKey);
        try {
          const weekDate = new Date(weekKey);
          const weekPlanning = loadFromLocalStorage(key);
          console.log(`Week data for ${weekKey}:`, weekPlanning);
          if (!isNaN(weekDate.getTime()) && weekPlanning && Object.keys(weekPlanning).length > 0) {
            return {
              key: weekKey,
              display: `Lundi ${format(weekDate, 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(weekDate, 6), 'd MMMM yyyy', { locale: fr })}`
            };
          }
          console.log(`Skipping ${weekKey}: Invalid date or empty planning`);
          return null;
        } catch (e) {
          console.error(`Invalid date format for key ${key}:`, e);
          return null;
        }
      })
      .filter(week => week !== null)
      .sort((a, b) => new Date(a.key) - new Date(b.key));
    console.log('Processed saved weeks:', weeks);
    setSavedWeeks(weeks);
  }, [selectedShop]);

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setCurrentWeek('');
    setFeedback('');
  };

  const handleWeekSelect = (weekKey) => {
    console.log('Semaine sélectionnée:', weekKey);
    setCurrentWeek(weekKey);
    setFeedback('');
  };

  const handleNewWeekChange = (e) => {
    if (!selectedShop) {
      setFeedback('Erreur: Aucune boutique sélectionnée.');
      return;
    }
    const date = new Date(e.target.value);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const formattedWeek = format(weekStart, 'yyyy-MM-dd');
    console.log('Nouvelle semaine sélectionnée:', formattedWeek);
    setNewWeek(formattedWeek);
    setCurrentWeek(formattedWeek);
    setFeedback('');
    saveToLocalStorage('selectedWeek', formattedWeek);
    saveToLocalStorage(`planning_${selectedShop}_${formattedWeek}`, {});
    console.log(`Saved planning_${selectedShop}_${formattedWeek} to localStorage`);
  };

  const handleNext = () => {
    if (!selectedShop) {
      setFeedback('Erreur: Veuillez sélectionner une boutique.');
      return;
    }
    if (!currentWeek) {
      setFeedback('Erreur: Veuillez sélectionner une semaine.');
      return;
    }
    console.log('Validation de la semaine:', currentWeek);
    saveToLocalStorage('selectedWeek', currentWeek);
    onSelectWeek(currentWeek);
    onNext(currentWeek);
  };

  const getWeeksInMonth = () => {
    const monthStart = startOfMonth(new Date(month));
    const monthEnd = endOfMonth(new Date(month));
    const weeks = [];
    let current = startOfWeek(monthStart, { weekStartsOn: 1 });
    while (current <= monthEnd) {
      if (isMonday(current)) {
        weeks.push({
          key: format(current, 'yyyy-MM-dd'),
          display: `Lundi ${format(current, 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(current, 6), 'd MMMM yyyy', { locale: fr })}`
        });
      }
      current = addDays(current, 7);
    }
    return weeks;
  };

  return (
    <div className="week-selection-container">
      <div style={{
        fontFamily: 'Roboto, sans-serif',
        fontSize: '24px',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: 'fit-content',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {selectedShop || 'Aucune boutique sélectionnée'}
      </div>
      <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
        Sélection de la semaine
      </h2>
      {feedback && (
        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: feedback.includes('Succès') ? '#4caf50' : '#e53935', marginBottom: '10px' }}>
          {feedback}
        </p>
      )}
      <div className="month-selector" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Mois</h3>
        <input
          type="month"
          value={month}
          onChange={handleMonthChange}
          style={{ padding: '8px', fontSize: '14px', width: '200px' }}
        />
      </div>
      <div className="new-week-selector" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Créer une nouvelle semaine</h3>
        <input
          type="date"
          value={newWeek}
          onChange={handleNewWeekChange}
          style={{ padding: '8px', fontSize: '14px', width: '200px' }}
        />
      </div>
      <div className="week-selector" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Semaine</h3>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {getWeeksInMonth().map(week => (
            <li key={week.key} style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '250px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  backgroundColor: currentWeek === week.key ? '#f28c38' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => handleWeekSelect(week.key)}
              >
                <span style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: currentWeek === week.key ? '#fff' : '#000'
                }}>
                  {week.display}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="saved-weeks" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Semaines sauvegardées</h3>
        {savedWeeks.length === 0 ? (
          <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
            Aucune semaine sauvegardée pour cette boutique.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {savedWeeks.map(week => (
              <li key={week.key} style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '250px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: currentWeek === week.key ? '#f28c38' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleWeekSelect(week.key)}
                >
                  <span style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: currentWeek === week.key ? '#fff' : '#000'
                  }}>
                    {week.display}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
        <Button className="button-base button-retour" onClick={onBack}>
          Retour
        </Button>
        <Button className="button-base button-primary" onClick={handleNext}>
          Valider
        </Button>
        <Button className="button-base button-reinitialiser" onClick={() => onReset({ feedback: 'Succès: Toutes les données ont été réinitialisées.' })}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}

export default WeekSelection;
