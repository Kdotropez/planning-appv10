import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const CopyPasteSection = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, days, setAvailableWeeks, setFeedback }) => {
    const [sourceDay, setSourceDay] = useState('');
    const [targetDays, setTargetDays] = useState([]);
    const [sourceEmployee, setSourceEmployee] = useState('');
    const [targetEmployees, setTargetEmployees] = useState([]);

    const handleCopyPaste = () => {
        if (!sourceDay || targetDays.length === 0 || !sourceEmployee || targetEmployees.length === 0) {
            setFeedback('Erreur: Veuillez sélectionner un jour source, des jours cibles, un employé source et des employés cibles.');
            return;
        }

        if (!config?.timeSlots?.length) {
            setFeedback('Erreur: Configuration des tranches horaires non valide.');
            return;
        }

        const updatedPlanning = { ...planning };
        const sourceDayKey = sourceDay;
        targetDays.forEach(targetDay => {
            targetEmployees.forEach(targetEmployee => {
                if (!updatedPlanning[targetEmployee]) {
                    updatedPlanning[targetEmployee] = {};
                }
                updatedPlanning[targetEmployee][targetDay] = [...(planning[sourceEmployee]?.[sourceDayKey] || new Array(config.timeSlots.length).fill(false))];
            });
        });

        setPlanning(updatedPlanning);
        saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
        setFeedback('Succès: Planning copié avec succès.');
    };

    const toggleTargetDay = (day) => {
        setTargetDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleTargetEmployee = (employee) => {
        setTargetEmployees(prev =>
            prev.includes(employee) ? prev.filter(e => e !== employee) : [...prev, employee]
        );
    };

    const safeEmployees = Array.isArray(selectedEmployees) ? selectedEmployees : [];

    return (
        <div className="copy-paste-section">
            <h3>Copier-Coller le planning</h3>
            <div className="copy-paste-container">
                <div className="form-group">
                    <label>Jour source</label>
                    <select
                        value={sourceDay}
                        onChange={(e) => setSourceDay(e.target.value)}
                    >
                        <option value="">Sélectionner un jour</option>
                        {days && Array.isArray(days)
                            ? days.map((day, index) => (
                                  <option key={index} value={day.date}>
                                      {day.name}
                                  </option>
                              ))
                            : <option value="">Aucun jour disponible</option>}
                    </select>
                </div>
                <div className="form-group">
                    <label>Jours cibles</label>
                    <div className="target-days-grid">
                        {days && Array.isArray(days)
                            ? days.map((day, index) => (
                                  <div key={index} className="target-day-item">
                                      <input
                                          type="checkbox"
                                          checked={targetDays.includes(day.date)}
                                          onChange={() => toggleTargetDay(day.date)}
                                      />
                                      <span>{day.name}</span>
                                  </div>
                              ))
                            : <span>Aucun jour disponible</span>}
                    </div>
                </div>
                <div className="form-group">
                    <label>Employé source</label>
                    <select
                        value={sourceEmployee}
                        onChange={(e) => setSourceEmployee(e.target.value)}
                    >
                        <option value="">Sélectionner un employé</option>
                        {safeEmployees.length > 0
                            ? safeEmployees.map((employee, index) => (
                                  <option key={index} value={employee}>
                                      {employee}
                                  </option>
                              ))
                            : <option value="">Aucun employé disponible</option>}
                    </select>
                </div>
                <div className="form-group">
                    <label>Employés cibles</label>
                    <div className="target-days-grid">
                        {safeEmployees.length > 0
                            ? safeEmployees.map((employee, index) => (
                                  <div key={index} className="target-day-item">
                                      <input
                                          type="checkbox"
                                          checked={targetEmployees.includes(employee)}
                                          onChange={() => toggleTargetEmployee(employee)}
                                      />
                                      <span>{employee}</span>
                                  </div>
                              ))
                            : <span>Aucun employé disponible</span>}
                    </div>
                </div>
                <Button className="button-validate" onClick={handleCopyPaste}>
                    Copier-Coller
                </Button>
            </div>
        </div>
    );
};

export default CopyPasteSection;