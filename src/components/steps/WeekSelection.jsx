import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek, selectedShop }) => {
    const [month, setMonth] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM') : format(new Date(), 'yyyy-MM'));
    const [currentWeek, setCurrentWeek] = useState(selectedWeek || '');
    const [savedWeeks, setSavedWeeks] = useState([]);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
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
                    if (!isNaN(weekDate.getTime()) && isMonday(weekDate) && weekPlanning && Object.keys(weekPlanning).length > 0) {
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
            .filter(week => week !== null);

        // Supprimer les doublons en utilisant un Set
        const uniqueWeeks = Array.from(new Set(weeks.map(w => w.key)))
            .map(key => weeks.find(w => w.key === key))
            .sort((a, b) => new Date(a.key) - new Date(b.key));
        console.log('Processed saved weeks:', uniqueWeeks);
        setSavedWeeks(uniqueWeeks);
    }, [selectedShop]);

    const handleMonthChange = (e) => {
        setMonth(e.target.value);
        setCurrentWeek('');
        setFeedback('');
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

    const handleWeekSelect = (weekKey) => {
        setCurrentWeek(weekKey);
        setFeedback('');
    };

    const handleNext = () => {
        if (!currentWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine.');
            return;
        }
        if (typeof onNext !== 'function') {
            console.error('onNext is not a function:', onNext);
            setFeedback('Erreur: Action Valider non disponible.');
            return;
        }
        console.log('Calling onNext with week:', currentWeek);
        onNext(currentWeek);
    };

    const handleBack = () => {
        if (typeof onBack !== 'function') {
            console.error('onBack is not a function:', onBack);
            setFeedback('Erreur: Action Retour non disponible.');
            return;
        }
        console.log('Calling onBack');
        onBack();
    };

    const handleReset = () => {
        if (!currentWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine à réinitialiser.');
            return;
        }
        if (typeof onReset !== 'function') {
            console.error('onReset is not a function:', onReset);
            setFeedback('Erreur: Action Réinitialiser non disponible.');
            return;
        }
        console.log('Calling onReset for week reset');
        onReset({ source: 'week', selectedWeek: currentWeek });
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
            <div className="week-selector" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Semaines du mois</h3>
                {getWeeksInMonth().length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune semaine disponible pour ce mois.
                    </p>
                ) : (
                    <table style={{ fontFamily: 'Roboto, sans-serif', width: '100%', maxWidth: '600px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ccc', padding: '8px', fontWeight: '700' }}>Semaine</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getWeeksInMonth().map(week => (
                                <tr
                                    key={week.key}
                                    style={{
                                        backgroundColor: currentWeek === week.key ? '#f28c38' : '#f5f5f5',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleWeekSelect(week.key)}
                                >
                                    <td style={{
                                        border: '1px solid #ccc',
                                        padding: '8px',
                                        textAlign: 'center',
                                        color: currentWeek === week.key ? '#fff' : '#000'
                                    }}>
                                        {week.display}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="saved-weeks" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Semaines sauvegardées</h3>
                {savedWeeks.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune semaine sauvegardée pour cette boutique.
                    </p>
                ) : (
                    <table style={{ fontFamily: 'Roboto, sans-serif', width: '100%', maxWidth: '600px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ccc', padding: '8px', fontWeight: '700' }}>Semaine sauvegardée</th>
                            </tr>
                        </thead>
                        <tbody>
                            {savedWeeks.map(week => (
                                <tr
                                    key={week.key}
                                    style={{
                                        backgroundColor: currentWeek === week.key ? '#f28c38' : '#f5f5f5',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleWeekSelect(week.key)}
                                >
                                    <td style={{
                                        border: '1px solid #ccc',
                                        padding: '8px',
                                        textAlign: 'center',
                                        color: currentWeek === week.key ? '#fff' : '#000'
                                    }}>
                                        {week.display}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="navigation-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <Button className="button-base button-retour" onClick={handleBack}>
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