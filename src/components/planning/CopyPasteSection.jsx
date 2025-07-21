import { useState } from 'react';
import { format, addDays, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '../../assets/styles.css';

const CopyPasteSection = ({ config, selectedShop, selectedWeek, selectedEmployees, planning, setPlanning, days, setAvailableWeeks, setFeedback }) => {
    const [copyEmployee, setCopyEmployee] = useState('');
    const [pasteEmployee, setPasteEmployee] = useState('');
    const [copyDay, setCopyDay] = useState('');
    const [copyWeek, setCopyWeek] = useState('');
    const [pasteWeek, setPasteWeek] = useState('');
    const [showConfirmDay, setShowConfirmDay] = useState(false);
    const [showConfirmWeek, setShowConfirmWeek] = useState(false);

    // Lister les semaines disponibles dans localStorage
    const availableWeeks = Object.keys(localStorage)
        .filter(key => key.startsWith(`planning_${selectedShop}_`))
        .map(key => key.replace(`planning_${selectedShop}_`, ''))
        .map(week => ({
            key: week,
            display: `Semaine du ${format(new Date(week), 'd MMMM yyyy', { locale: fr })}`
        }))
        .sort((a, b) => new Date(a.key) - new Date(b.key));

    // Ajouter la semaine suivante comme option pour pasteWeek
    const nextWeek = format(addWeeks(new Date(selectedWeek), 1), 'yyyy-MM-dd');
    const availablePasteWeeks = [
        ...availableWeeks,
        { key: nextWeek, display: `Semaine du ${format(new Date(nextWeek), 'd MMMM yyyy', { locale: fr })}` }
    ];

    const handleCopyEmployeeDay = () => {
        if (!copyEmployee || !pasteEmployee || !copyDay) {
            setFeedback('Erreur: Veuillez sélectionner un employé source, un employé cible et un jour.');
            console.error('Missing copy parameters:', { copyEmployee, pasteEmployee, copyDay });
            return;
        }
        setShowConfirmDay(true);
    };

    const confirmCopyEmployeeDay = () => {
        const dayKey = copyDay;
        const sourceData = planning[copyEmployee === 'all' ? selectedEmployees[0] : copyEmployee]?.[dayKey] || Array(config.timeSlots.length).fill(false);

        setPlanning(prev => {
            const updatedPlanning = { ...prev };
            if (pasteEmployee === 'all') {
                selectedEmployees.forEach(employee => {
                    updatedPlanning[employee] = {
                        ...updatedPlanning[employee],
                        [dayKey]: [...sourceData]
                    };
                });
            } else {
                updatedPlanning[pasteEmployee] = {
                    ...updatedPlanning[pasteEmployee],
                    [dayKey]: [...sourceData]
                };
            }
            saveToLocalStorage(`planning_${selectedShop}_${selectedWeek}`, updatedPlanning);
            return updatedPlanning;
        });

        setFeedback(`Succès: Planning de ${copyEmployee === 'all' ? 'tous les employés' : copyEmployee} copié sur ${pasteEmployee === 'all' ? 'tous les employés' : pasteEmployee} pour ${days.find(day => day.date === copyDay)?.name || 'le jour sélectionné'}.`);
        console.log('Employee day copied:', { copyEmployee, pasteEmployee, dayKey });
        setShowConfirmDay(false);
    };

    const handleCopyWeek = () => {
        if (!copyWeek || !pasteWeek) {
            setFeedback('Erreur: Veuillez sélectionner une semaine source et une semaine cible.');
            console.error('Missing week parameters:', { copyWeek, pasteWeek });
            return;
        }
        setShowConfirmWeek(true);
    };

    const confirmCopyWeek = () => {
        const sourcePlanning = loadFromLocalStorage(`planning_${selectedShop}_${copyWeek}`, {});
        if (!Object.keys(sourcePlanning).length) {
            setFeedback('Erreur: Aucune donnée trouvée pour la semaine source.');
            console.error('No data for source week:', copyWeek);
            return;
        }

        setPlanning(prev => {
            const updatedPlanning = { ...sourcePlanning };
            saveToLocalStorage(`planning_${selectedShop}_${pasteWeek}`, updatedPlanning);
            setAvailableWeeks(prevWeeks => {
                const newWeeks = prevWeeks.slice();
                if (!newWeeks.some(week => week.key === pasteWeek)) {
                    newWeeks.push({
                        key: pasteWeek,
                        display: `Semaine du ${format(new Date(pasteWeek), 'd MMMM yyyy', { locale: fr })}`
                    });
                    newWeeks.sort((a, b) => new Date(a.key) - new Date(b.key));
                }
                return newWeeks;
            });
            return selectedWeek === pasteWeek ? updatedPlanning : prev;
        });

        setFeedback(`Succès: Semaine du ${format(new Date(copyWeek), 'd MMMM yyyy', { locale: fr })} copiée sur ${format(new Date(pasteWeek), 'd MMMM yyyy', { locale: fr })}.`);
        console.log('Week copied:', { copyWeek, pasteWeek });
        setShowConfirmWeek(false);
    };

    return (
        <div className="copy-paste-section">
            <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '20px', color: '#333' }}>
                Copier/Coller le Planning
            </h3>
            <div className="copy-paste-container">
                <h4 style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '10px', fontSize: '16px', color: '#1e88e5' }}>
                    Copier un employé sur un autre (jour)
                </h4>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#333' }}>
                        Employé source
                    </label>
                    <select
                        value={copyEmployee}
                        onChange={(e) => setCopyEmployee(e.target.value)}
                        className="copy-paste-select"
                    >
                        <option value="">Sélectionner un employé</option>
                        <option value="all">Tous les employés</option>
                        {selectedEmployees.map(employee => (
                            <option key={employee} value={employee}>{employee}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#333' }}>
                        Employé cible
                    </label>
                    <select
                        value={pasteEmployee}
                        onChange={(e) => setPasteEmployee(e.target.value)}
                        className="copy-paste-select"
                    >
                        <option value="">Sélectionner un employé</option>
                        <option value="all">Tous les employés</option>
                        {selectedEmployees.map(employee => (
                            <option key={employee} value={employee}>{employee}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#333' }}>
                        Jour cible
                    </label>
                    <select
                        value={copyDay}
                        onChange={(e) => setCopyDay(e.target.value)}
                        className="copy-paste-select"
                    >
                        <option value="">Sélectionner un jour</option>
                        {days.map((day, index) => (
                            <option key={index} value={day.date}>{day.name} ({day.date})</option>
                        ))}
                    </select>
                </div>
                <Button
                    className="button-validate"
                    onClick={handleCopyEmployeeDay}
                    style={{ backgroundColor: '#4caf50', color: '#fff', padding: '10px 20px', fontSize: '14px', marginTop: '15px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                >
                    Copier le jour
                </Button>
            </div>
            <div className="copy-paste-container" style={{ marginTop: '20px' }}>
                <h4 style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '10px', fontSize: '16px', color: '#1e88e5' }}>
                    Copier une semaine complète
                </h4>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#333' }}>
                        Semaine source
                    </label>
                    <select
                        value={copyWeek}
                        onChange={(e) => setCopyWeek(e.target.value)}
                        className="copy-paste-select"
                    >
                        <option value="">Sélectionner une semaine</option>
                        {availableWeeks.map(week => (
                            <option key={week.key} value={week.key}>{week.display}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#333' }}>
                        Semaine cible
                    </label>
                    <select
                        value={pasteWeek}
                        onChange={(e) => setPasteWeek(e.target.value)}
                        className="copy-paste-select"
                    >
                        <option value="">Sélectionner une semaine</option>
                        {availablePasteWeeks.map(week => (
                            <option key={week.key} value={week.key}>{week.display}</option>
                        ))}
                    </select>
                </div>
                <Button
                    className="button-validate"
                    onClick={handleCopyWeek}
                    style={{ backgroundColor: '#4caf50', color: '#fff', padding: '10px 20px', fontSize: '14px', marginTop: '15px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                >
                    Copier la semaine
                </Button>
            </div>

            {/* Modal de confirmation pour copie de jour */}
            {showConfirmDay && (
                <div className="modal-overlay">
                    <div className="modal-content copy-paste-modal">
                        <button className="modal-close" onClick={() => setShowConfirmDay(false)}>✕</button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '18px', color: '#333' }}>
                            Confirmer la copie
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#333' }}>
                            Copier le planning de {copyEmployee === 'all' ? 'tous les employés' : copyEmployee} pour {days.find(day => day.date === copyDay)?.name || 'le jour sélectionné'} sur {pasteEmployee === 'all' ? 'tous les employés' : pasteEmployee} ?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <Button
                                className="button-validate"
                                onClick={confirmCopyEmployeeDay}
                                style={{ backgroundColor: '#4caf50', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                            >
                                Confirmer
                            </Button>
                            <Button
                                className="button-reinitialiser"
                                onClick={() => setShowConfirmDay(false)}
                                style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation pour copie de semaine */}
            {showConfirmWeek && (
                <div className="modal-overlay">
                    <div className="modal-content copy-paste-modal">
                        <button className="modal-close" onClick={() => setShowConfirmWeek(false)}>✕</button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '18px', color: '#333' }}>
                            Confirmer la copie
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#333' }}>
                            Copier la semaine du {format(new Date(copyWeek), 'd MMMM yyyy', { locale: fr })} sur la semaine du {format(new Date(pasteWeek), 'd MMMM yyyy', { locale: fr })} ?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <Button
                                className="button-validate"
                                onClick={confirmCopyWeek}
                                style={{ backgroundColor: '#4caf50', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                            >
                                Confirmer
                            </Button>
                            <Button
                                className="button-reinitialiser"
                                onClick={() => setShowConfirmWeek(false)}
                                style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopyPasteSection;