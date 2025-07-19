import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek, selectedShop }) => {
    const [month, setMonth] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM') : format(new Date(), 'yyyy-MM'));
    const [currentWeek, setCurrentWeek] = useState(selectedWeek || '');
    const [savedWeeks, setSavedWeeks] = useState([]);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        console.log('useEffect déclenché pour savedWeeks, selectedShop:', selectedShop, 'selectedWeek:', selectedWeek);
        console.log('localStorage content:', Object.keys(localStorage));
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Found storage keys:', storageKeys);

        const weeks = storageKeys
            .map(key => {
                const weekKey = key.replace(`planning_${selectedShop}_`, '');
                console.log('Processing key:', key, 'Extracted weekKey:', weekKey);
                try {
                    const weekDate = new Date(weekKey);
                    const weekPlanning = loadFromLocalStorage(key, {});
                    console.log(`Week data for ${weekKey}:`, weekPlanning);
                    if (!isNaN(weekDate.getTime())) {
                        return {
                            key: weekKey,
                            display: `Lundi ${format(weekDate, 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(weekDate, 6), 'd MMMM yyyy', { locale: fr })}`
                        };
                    }
                    console.log(`Skipping ${weekKey}: Invalid date`);
                    return null;
                } catch (e) {
                    console.error(`Error processing key ${key}:`, e);
                    return null;
                }
            })
            .filter(week => week !== null)
            .sort((a, b) => new Date(a.key) - new Date(b.key));
        console.log('Processed saved weeks:', weeks);
        setSavedWeeks(weeks);
        console.log('savedWeeks updated:', weeks);
    }, [selectedShop, selectedWeek]);

    const handleMonthChange = (e) => {
        console.log('handleMonthChange appelé:', e.target.value);
        setMonth(e.target.value);
        setCurrentWeek('');
    };

    const getWeeksInMonth = () => {
        const monthStart = startOfMonth(new Date(month));
        const monthEnd = endOfMonth(new Date(month));
        const weeks = [];
        let current = startOfWeek(monthStart, { weekStartsOn: 1 });
        while (current <= monthEnd) {
            weeks.push({
                key: format(current, 'yyyy-MM-dd'),
                display: `Lundi ${format(current, 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(current, 6), 'd MMMM yyyy', { locale: fr })}`
            });
            current = addDays(current, 7);
        }
        console.log('Weeks in month:', weeks);
        return weeks;
    };

    const handleWeekSelect = (weekKey) => {
        console.log('handleWeekSelect appelé:', { weekKey });
        setCurrentWeek(weekKey);
        setFeedback('');
        const existingPlanning = loadFromLocalStorage(`planning_${selectedShop}_${weekKey}`, {});
        if (Object.keys(existingPlanning).length === 0) {
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${weekKey}`, []);
            const timeSlotConfig = loadFromLocalStorage('timeSlotConfig', {});
            if (!timeSlotConfig?.timeSlots?.length) {
                setFeedback('Erreur: Configuration des tranches horaires non valide.');
                return;
            }
            const newPlanning = {};
            storedSelectedEmployees.forEach(employee => {
                newPlanning[employee] = {};
                for (let i = 0; i < 7; i++) {
                    const dayKey = format(addDays(new Date(weekKey), i), 'yyyy-MM-dd');
                    newPlanning[employee][dayKey] = Array(timeSlotConfig.timeSlots.length).fill(false);
                }
            });
            saveToLocalStorage(`planning_${selectedShop}_${weekKey}`, newPlanning);
            console.log('Initialized new planning for week:', { weekKey, newPlanning });
        }
    };

    const handleNext = () => {
        console.log('handleNext appelé, currentWeek:', currentWeek);
        if (!currentWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine.');
            return;
        }
        const timeSlotConfig = loadFromLocalStorage('timeSlotConfig', {});
        if (!timeSlotConfig?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            setCurrentStep('config');
            return;
        }
        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${currentWeek}`, []);
        if (!storedSelectedEmployees.length) {
            setFeedback('Erreur: Aucun employé sélectionné pour cette semaine.');
            return;
        }
        onNext(currentWeek);
    };

    const handleReset = () => {
        console.log('handleReset appelé');
        setCurrentWeek('');
        setMonth(format(new Date(), 'yyyy-MM'));
        setFeedback('Succès: Toutes les données ont été réinitialisées.');
        onReset({ feedback: 'Succès: Toutes les données ont été réinitialisées.' });
    };

    console.log('Rendering WeekSelection, savedWeeks:', savedWeeks);

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
                <Button className="button-base button-retour" onClick={() => {
                    console.log('Retour clicked in WeekSelection');
                    onBack();
                }}>
                    Retour
                </Button>
                <Button className="button-base button-primary" onClick={handleNext}>
                    Valider
                </Button>
                <Button className="button-base button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default WeekSelection;