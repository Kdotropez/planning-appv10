import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isMonday, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const WeekSelection = ({ onNext, onBack, onReset, selectedWeek, selectedShop, planningData }) => {
    const [month, setMonth] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM') : format(new Date(), 'yyyy-MM'));
    const [savedWeeksMonth, setSavedWeeksMonth] = useState(selectedWeek ? format(new Date(selectedWeek), 'yyyy-MM') : format(new Date(), 'yyyy-MM'));
    const [currentWeek, setCurrentWeek] = useState(selectedWeek || '');
    const [savedWeeks, setSavedWeeks] = useState([]);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        console.log('Fetching saved weeks for shop:', selectedShop);
        
        if (!planningData || !selectedShop) {
            setSavedWeeks([]);
            return;
        }

        // Trouver la boutique dans planningData
        const shop = planningData.shops.find(s => s.id === selectedShop);
        if (!shop || !shop.weeks) {
            setSavedWeeks([]);
            return;
        }

        // Récupérer toutes les semaines avec des données
        const weeks = Object.keys(shop.weeks)
            .map(weekKey => {
                console.log('Processing weekKey:', weekKey);
                try {
                    const weekDate = new Date(weekKey);
                    const weekData = shop.weeks[weekKey];
                    console.log(`Week data for ${weekKey}:`, weekData);
                    
                    // Vérifier si la semaine a des données de planning
                    if (!isNaN(weekDate.getTime()) && isMonday(weekDate) && weekData && weekData.planning && Object.keys(weekData.planning).length > 0) {
                        // Vérifier si au moins un employé a des créneaux cochés
                        const hasPlanningData = Object.values(weekData.planning).some(employeeData => {
                            return Object.values(employeeData).some(daySlots => 
                                Array.isArray(daySlots) && daySlots.some(slot => slot === true)
                            );
                        });
                        
                        if (hasPlanningData) {
                            return {
                                key: weekKey,
                                date: weekDate,
                                display: `Lundi ${format(weekDate, 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(weekDate, 6), 'd MMMM yyyy', { locale: fr })}`
                            };
                        }
                    }
                    console.log(`Skipping ${weekKey}: Invalid date or no planning data`);
                    return null;
                } catch (e) {
                    console.error(`Invalid date format for weekKey ${weekKey}:`, e);
                    return null;
                }
            })
            .filter(week => week !== null);

        // Filtrer par mois et supprimer les doublons
        const monthStart = startOfMonth(new Date(savedWeeksMonth));
        const monthEnd = endOfMonth(new Date(savedWeeksMonth));
        const uniqueWeeks = Array.from(new Set(weeks.map(w => w.key)))
            .map(key => weeks.find(w => w.key === key))
            .filter(week => {
                // Utiliser la même logique que getWeeksInMonth : inclure les semaines qui se terminent dans le mois
                const weekEnd = addDays(week.date, 6);
                return isWithinInterval(weekEnd, { start: monthStart, end: monthEnd });
            })
            .sort((a, b) => b.date - a.date) // Tri décroissant pour les plus récentes en premier
            .slice(0, 10); // Limiter à 10 semaines maximum
        console.log('Processed saved weeks:', uniqueWeeks);
        setSavedWeeks(uniqueWeeks);
    }, [selectedShop, savedWeeksMonth, planningData]);

    // Mettre à jour le mois des semaines sauvegardées quand selectedWeek change
    useEffect(() => {
        if (selectedWeek) {
            const weekMonth = format(new Date(selectedWeek), 'yyyy-MM');
            setSavedWeeksMonth(weekMonth);
            console.log('Mise à jour du mois des semaines sauvegardées vers:', weekMonth);
        }
    }, [selectedWeek]);

    const handleMonthChange = (e) => {
        setMonth(e.target.value);
        setCurrentWeek('');
        setFeedback('');
    };

    const handleSavedWeeksMonthChange = (e) => {
        setSavedWeeksMonth(e.target.value);
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
                <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>Mois pour semaines du mois</h3>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', marginBottom: '5px' }}>Mois pour semaines sauvegardées</h4>
                    <input
                        type="month"
                        value={savedWeeksMonth}
                        onChange={handleSavedWeeksMonthChange}
                        style={{ padding: '8px', fontSize: '14px', width: '200px' }}
                    />
                </div>
                {savedWeeks.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune semaine sauvegardée pour ce mois.
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