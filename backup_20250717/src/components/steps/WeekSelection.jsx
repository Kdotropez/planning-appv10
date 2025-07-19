import React, { useState } from 'react';
import { format, parseISO, startOfWeek, addWeeks, addDays, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../common/Button';
import { loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const WeekSelection = ({ selectedWeek, setSelectedWeek, selectedShop, setStep, setFeedback }) => {
    const [month, setMonth] = useState(null);
    const [week, setWeek] = useState('');
    const savedWeeks = loadFromLocalStorage(`saved_weeks_${selectedShop}`, []) || [];

    const generateWeekOptions = () => {
        if (!month) return [];
        const weeks = [];
        const startDate = new Date(2025, 0, 1);
        for (let i = 0; i < 52; i++) {
            const weekStart = startOfWeek(addWeeks(startDate, i), { weekStartsOn: 1 });
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            if (isWithinInterval(weekStart, { start: monthStart, end: monthEnd }) ||
                isWithinInterval(weekEnd, { start: monthStart, end: monthEnd })) {
                weeks.push(format(weekStart, 'yyyy-MM-dd'));
            }
        }
        return weeks;
    };

    const isWeekRegistered = (week) => {
        const planning = loadFromLocalStorage(`planning_${selectedShop}_${week}`, {});
        return Object.keys(planning).length > 0;
    };

    const handleSelectWeek = (week) => {
        setSelectedWeek(week);
        setWeek(week);
    };

    const handleNext = () => {
        if (!selectedWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine.');
            return;
        }
        setStep(4);
        setFeedback('Succès: Semaine validée.');
    };

    const handleReset = () => {
        setMonth(null);
        setWeek('');
        setSelectedWeek('');
        setFeedback('Succès: Liste des semaines réinitialisée.');
    };

    console.log('Rendering WeekSelection with savedWeeks:', savedWeeks, 'selectedWeek:', selectedWeek);

    return (
        <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la semaine
            </h2>
            <div className="week-selection" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Mois
                </label>
                <DatePicker
                    selected={month}
                    onChange={(date) => setMonth(date)}
                    showMonthYearPicker
                    dateFormat="MMMM yyyy"
                    locale={fr}
                    placeholderText="Choisir un mois"
                    className="month-button"
                    style={{ width: '100%' }}
                />
                {month && (
                    <>
                        <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', marginTop: '15px', display: 'block', textAlign: 'center' }}>
                            Semaine
                        </label>
                        {generateWeekOptions().map(w => (
                            <Button
                                key={w}
                                text={`du Lundi ${format(parseISO(w), 'dd MMMM', { locale: fr })} au Dimanche ${format(addDays(parseISO(w), 6), 'dd MMMM', { locale: fr })}`}
                                onClick={() => handleSelectWeek(w)}
                                style={{
                                    backgroundColor: selectedWeek === w ? '#f28c38' : '#f0f0f0',
                                    color: selectedWeek === w ? '#fff' : '#333',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    width: '100%',
                                    marginBottom: '5px',
                                    borderRadius: '4px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = selectedWeek === w ? '#d9742f' : '#e0e0e0'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedWeek === w ? '#f28c38' : '#f0f0f0'}
                                className="week-button"
                            />
                        ))}
                    </>
                )}
            </div>
            <div className="saved-weeks" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Semaines sauvegardées
                </label>
                {savedWeeks.filter(isWeekRegistered).length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune semaine sauvegardée pour cette boutique.
                    </p>
                ) : (
                    <select
                        value={selectedWeek}
                        onChange={(e) => handleSelectWeek(e.target.value)}
                        className="saved-weeks-select"
                        style={{ width: '100%' }}
                    >
                        <option value="">Choisir une semaine sauvegardée</option>
                        {savedWeeks.filter(isWeekRegistered).map(week => (
                            <option key={week} value={week} style={{ color: selectedWeek === week ? '#f28c38' : '#333' }}>
                                Semaine du {format(parseISO(week), 'dd/MM/yyyy', { locale: fr })}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="button-group" style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px', width: '100%', maxWidth: '400px' }}>
                <Button
                    text="Retour"
                    onClick={() => setStep(2)}
                    style={{ backgroundColor: '#000000', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                />
                <Button
                    text="Valider"
                    onClick={handleNext}
                    style={{ backgroundColor: '#4caf50', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                />
                <Button
                    text="Réinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                />
            </div>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default WeekSelection;