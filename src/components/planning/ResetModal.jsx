import React, { useState } from 'react';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const ResetModal = ({ showResetModal, setShowResetModal, config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, setFeedback, setAvailableWeeks, resetSource }) => {
    const [resetOption, setResetOption] = useState('');

    const getOptions = () => {
        if (resetSource === 'shops') {
            return [
                { value: '', label: 'Choisir une option' },
                { value: 'shops', label: 'Toutes les boutiques' }
            ];
        } else if (resetSource === 'employees') {
            return [
                { value: '', label: 'Choisir une option' },
                { value: 'all', label: 'Tous les employés' },
                ...(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map(employee => ({
                    value: employee,
                    label: employee
                }))
            ];
        } else if (resetSource === 'planning') {
            return [
                { value: '', label: 'Choisir une option' },
                { value: 'planning', label: 'Planning actuel' }
            ];
        } else if (resetSource === 'week') {
            return [
                { value: '', label: 'Choisir une option' },
                { value: 'week', label: `Semaine du ${selectedWeek ? format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr }) : 'sélectionnée'}` },
                { value: 'all_weeks', label: 'Toutes les semaines de la boutique' }
            ];
        } else {
            return [
                { value: '', label: 'Choisir une option' },
                { value: 'shops', label: 'Toutes les boutiques' },
                { value: 'all', label: 'Tous les employés' },
                { value: 'planning', label: 'Planning actuel' },
                { value: 'week', label: 'Semaine sélectionnée' },
                { value: 'all_weeks', label: 'Toutes les semaines de la boutique' }
            ];
        }
    };

    const handleReset = () => {
        console.log('Confirm reset:', { resetOption, resetSource, selectedShop, selectedWeek });
        if (!resetOption) {
            setFeedback('Erreur: Veuillez sélectionner une option.');
            console.log('Reset failed: No option selected');
            return;
        }
        try {
            if (resetOption === 'shops') {
                saveToLocalStorage('shops', []);
                saveToLocalStorage('lastPlanning', {});
                setFeedback('Succès: Liste des boutiques réinitialisée.');
            } else if (resetOption === 'all') {
                if (!config?.timeSlots?.length) {
                    setFeedback('Erreur: Configuration des tranches horaires non valide.');
                    console.log('Reset failed: Invalid time slots configuration');
                    return;
                }
                if (!selectedEmployees || selectedEmployees.length === 0) {
                    setFeedback('Erreur: Aucun employé sélectionné.');
                    console.log('Reset failed: No employees selected');
                    return;
                }
                setPlanning(prev => {
                    const updatedPlanning = { ...prev };
                    const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
                    storedSelectedEmployees.forEach(employee => {
                        updatedPlanning[employee] = {};
                        for (let i = 0; i < 7; i++) {
                            const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                            updatedPlanning[employee][dayKey] = Array(config.timeSlots.length).fill(false);
                        }
                    });
                    console.log('Reset planning for all employees:', updatedPlanning);
                    saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                    setFeedback('Succès: Planning réinitialisé pour tous les employés.');
                    setAvailableWeeks(prev => {
                        const weeks = prev.slice();
                        const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');
                        if (isMonday(new Date(selectedWeek))) {
                            saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, updatedPlanning);
                            const weekExists = weeks.some(week => week.key === currentWeekKey);
                            if (!weekExists) {
                                weeks.push({
                                    key: currentWeekKey,
                                    date: new Date(selectedWeek),
                                    display: `Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}`
                                });
                            }
                        }
                        weeks.sort((a, b) => a.date - b.date);
                        console.log('Available weeks:', weeks);
                        return weeks;
                    });
                    return updatedPlanning;
                });
            } else if (resetOption === 'planning') {
                setPlanning({});
                setAvailableWeeks([]);
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
                setFeedback('Succès: Planning réinitialisé.');
            } else if (resetOption === 'week') {
                if (!selectedWeek) {
                    setFeedback('Erreur: Aucune semaine sélectionnée.');
                    console.log('Reset failed: No week selected');
                    return;
                }
                saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, {});
                saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []);
                setAvailableWeeks(prev => prev.filter(week => week.key !== selectedWeek));
                setFeedback(`Succès: Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })} réinitialisée.`);
            } else if (resetOption === 'all_weeks') {
                if (!selectedShop) {
                    setFeedback('Erreur: Aucune boutique sélectionnée.');
                    console.log('Reset failed: No shop selected');
                    return;
                }
                const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`) || key.startsWith(`selected_employees_${selectedShop}_`));
                storageKeys.forEach(key => localStorage.removeItem(key));
                setAvailableWeeks([]);
                setFeedback('Succès: Toutes les semaines de la boutique réinitialisées.');
            } else {
                if (!config?.timeSlots?.length) {
                    setFeedback('Erreur: Configuration des tranches horaires non valide.');
                    console.log('Reset failed: Invalid time slots configuration');
                    return;
                }
                setPlanning(prev => {
                    const updatedPlanning = { ...prev };
                    updatedPlanning[resetOption] = {};
                    for (let i = 0; i < 7; i++) {
                        const dayKey = format(addDays(new Date(selectedWeek), i), 'yyyy-MM-dd');
                        updatedPlanning[resetOption][dayKey] = Array(config.timeSlots.length).fill(false);
                    }
                    console.log('Reset planning for employee:', resetOption, updatedPlanning);
                    saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
                    setFeedback(`Succès: Planning réinitialisé pour ${resetOption}.`);
                    setAvailableWeeks(prev => {
                        const weeks = prev.slice();
                        const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');
                        if (isMonday(new Date(selectedWeek))) {
                            saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, updatedPlanning);
                            const weekExists = weeks.some(week => week.key === currentWeekKey);
                            if (!weekExists) {
                                weeks.push({
                                    key: currentWeekKey,
                                    date: new Date(selectedWeek),
                                    display: `Semaine du ${format(new Date(selectedWeek), 'd MMMM yyyy', { locale: fr })}`
                                });
                            }
                        }
                        weeks.sort((a, b) => a.date - b.date);
                        console.log('Available weeks:', weeks);
                        return weeks;
                    });
                    return updatedPlanning;
                });
            }
            console.log('Closing modal after reset');
            setShowResetModal(false);
            setResetOption('');
            console.log('Reset completed');
        } catch (error) {
            console.error('Error during reset:', error);
            setFeedback('Erreur lors de la réinitialisation: ' + error.message);
            setShowResetModal(false); // Ensure modal closes even on error
        }
    };

    const handleClose = () => {
        console.log('Closing ResetModal, showResetModal:', showResetModal);
        setShowResetModal(false);
        setResetOption('');
    };

    if (!showResetModal) return null;

    return (
        <div className="modal-overlay" style={{ pointerEvents: 'auto' }}>
            <div className="modal-content">
                <button className="modal-close" onClick={handleClose} style={{ color: '#dc3545', fontSize: '18px' }}>
                    ✕
                </button>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    Confirmer la réinitialisation
                </h3>
                <div className="form-group">
                    <label>Réinitialiser</label>
                    <select value={resetOption} onChange={(e) => {
                        console.log('Reset option changed:', e.target.value);
                        setResetOption(e.target.value);
                    }}>
                        {getOptions().map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="button-group">
                    <Button className="button-primary" onClick={handleReset}>
                        Confirmer
                    </Button>
                    <Button className="button-retour" onClick={handleClose}>
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResetModal;