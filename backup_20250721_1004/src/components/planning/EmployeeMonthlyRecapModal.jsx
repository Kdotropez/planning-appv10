import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getEmployeeMonthlyRecapData } from '../../utils/planningUtils';
import Button from '../common/Button';
import '../../assets/styles.css';

const EmployeeMonthlyRecapModal = ({ selectedEmployee, selectedWeek, selectedShop, config, showEmployeeMonthlyRecap, setShowEmployeeMonthlyRecap, setSelectedEmployee }) => {
    if (!showEmployeeMonthlyRecap || !selectedEmployee) return null;

    const { monthlyTotal, weeklyRecaps } = getEmployeeMonthlyRecapData(selectedEmployee, selectedWeek, selectedShop, config);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={() => { setShowEmployeeMonthlyRecap(false); setSelectedEmployee(''); }}>
                    X
                </button>
                <h2>Récapitulatif Mensuel - {selectedEmployee}</h2>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Semaine</th>
                            <th>Heures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeklyRecaps.map((recap, index) => (
                            <tr key={index}>
                                <td>{recap.week}</td>
                                <td>{recap.hours} h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p>Total Mensuel: {monthlyTotal.toFixed(1)} h</p>
                <Button
                    className="button-base button-retour"
                    onClick={() => { setShowEmployeeMonthlyRecap(false); setSelectedEmployee(''); }}
                    text="Fermer"
                />
            </div>
        </div>
    );
};

export default EmployeeMonthlyRecapModal;