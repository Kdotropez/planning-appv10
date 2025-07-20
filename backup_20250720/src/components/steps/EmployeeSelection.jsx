import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '@/assets/styles.css';

const EmployeeSelection = ({ selectedEmployees, setSelectedEmployees, selectedShop, selectedWeek, setStep, setFeedback }) => {
    const [newEmployee, setNewEmployee] = useState('');
    const [employees, setEmployees] = useState(loadFromLocalStorage(`employees_${selectedShop}`, []) || []);

    useEffect(() => {
        const shopEmployees = loadFromLocalStorage(`employees_${selectedShop}`, []);
        setEmployees(shopEmployees);
        console.log(`Loaded employees for shop ${selectedShop}:`, shopEmployees);
        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, shopEmployees);
        setSelectedEmployees(storedSelectedEmployees);
        console.log(`Loaded selected employees for ${selectedShop}_${selectedWeek}:`, storedSelectedEmployees);
    }, [selectedShop, selectedWeek, setSelectedEmployees]);

    const handleAddEmployee = () => {
        if (!newEmployee.trim()) {
            setFeedback('Erreur: Le nom de l\'employé ne peut pas être vide.');
            return;
        }
        const upperCaseEmployee = newEmployee.trim().toUpperCase();
        if (employees.includes(upperCaseEmployee)) {
            setFeedback('Erreur: Cet employé existe déjà.');
            return;
        }
        const updatedEmployees = [...employees, upperCaseEmployee];
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        setEmployees(updatedEmployees);
        setNewEmployee('');
        setFeedback('Succès: Employé ajouté.');
    };

    const handleRemoveEmployee = (employee) => {
        const updatedEmployees = employees.filter(e => e !== employee);
        saveToLocalStorage(`employees_${selectedShop}`, updatedEmployees);
        setEmployees(updatedEmployees);
        const newSelectedEmployees = selectedEmployees.filter(e => e !== employee);
        setSelectedEmployees(newSelectedEmployees);
        saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, newSelectedEmployees);
        setFeedback('Succès: Employé supprimé.');
    };

    const handleSelectEmployee = (employee) => {
        const newSelectedEmployees = selectedEmployees.includes(employee)
            ? selectedEmployees.filter(e => e !== employee)
            : [...selectedEmployees, employee];
        setSelectedEmployees(newSelectedEmployees);
        saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, newSelectedEmployees);
        console.log('Updated selected employees:', newSelectedEmployees);
    };

    const handleNext = () => {
        if (selectedEmployees.length === 0) {
            setFeedback('Erreur: Veuillez sélectionner au moins un employé.');
            return;
        }
        saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees);
        setStep(5);
    };

    const handleReset = () => {
        setNewEmployee('');
        setSelectedEmployees([]);
        saveToLocalStorage(`employees_${selectedShop}`, []);
        saveToLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, []);
        setEmployees([]);
        setFeedback('Succès: Liste des employés réinitialisée.');
    };

    console.log('Rendering EmployeeSelection with employees:', employees, 'selectedEmployees:', selectedEmployees);

    return (
        <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '465px' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection des employés
            </h2>
            <div className="employee-input" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Ajouter un employé
                </label>
                <input
                    type="text"
                    value={newEmployee}
                    onChange={(e) => setNewEmployee(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmployee(); }}
                    placeholder="Nom de l'employé"
                    className="employee-input-field"
                />
                <Button
                    text="Ajouter"
                    onClick={handleAddEmployee}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px', marginTop: '10px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                />
            </div>
            <div className="employee-list" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px', maxHeight: '200px', overflowY: 'auto' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Employés disponibles
                </label>
                {employees.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucun employé disponible.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {employees.map(employee => (
                            <li key={employee} className="employee-item">
                                <Button
                                    text={employee.toUpperCase()}
                                    onClick={() => handleSelectEmployee(employee)}
                                    style={{
                                        backgroundColor: selectedEmployees.includes(employee) ? '#f28c38' : '#f0f0f0',
                                        color: selectedEmployees.includes(employee) ? '#fff' : '#333',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = selectedEmployees.includes(employee) ? '#d9742f' : '#e0e0e0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedEmployees.includes(employee) ? '#f28c38' : '#f0f0f0'}
                                >
                                    {employee.toUpperCase()}
                                    <span className="delete-icon" onClick={() => handleRemoveEmployee(employee)}>🗑️</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="button-group" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: 'auto', width: '100%', maxWidth: '400px' }}>
                <Button
                    text="Retour"
                    onClick={() => setStep(3)}
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

export default EmployeeSelection;