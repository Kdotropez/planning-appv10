import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import { getMonthlyRecapData } from '../../utils/planningUtils';

const MonthlyRecapModal = ({ selectedWeek, selectedShop, selectedEmployees, planning, config, showMonthlyRecapModal, setShowMonthlyRecapModal }) => {
    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const { monthlyTotals, weeklyRecaps } = getMonthlyRecapData(selectedEmployees, selectedWeek, selectedShop, planning, config);
    const shopTotalHours = Object.values(monthlyTotals).reduce((sum, hours) => sum + hours, 0).toFixed(1);

    return (
        showMonthlyRecapModal && (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="modal-content">
                    <button
                        className="modal-close"
                        onClick={() => setShowMonthlyRecapModal(false)}
                        style={{ color: '#dc3545', fontSize: '18px' }}
                    >
                        ✕
                    </button>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                        Récapitulatif mensuel ({shopTotalHours} h)
                    </h3>
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                        Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                    </p>
                    {Object.keys(monthlyTotals).length === 0 || weeklyRecaps.every(recap => recap.hours === '0.0') ? (
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                            Aucune donnée disponible pour ce mois.
                        </p>
                    ) : (
                        <table style={{ fontFamily: 'Inter, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Employé</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total mois (h)</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Semaine</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total semaine (h)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedEmployees || []).map((employee, empIndex) => (
                                    weeklyRecaps
                                        .filter(recap => recap.employee === employee)
                                        .map((recap, recapIndex) => (
                                            <tr key={`${employee}-${recapIndex}`} style={{ backgroundColor: pastelColors[empIndex % pastelColors.length] }}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.employee}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recapIndex === 0 ? (monthlyTotals[employee] ? monthlyTotals[employee].toFixed(1) : '0.0') : ''}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.week}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.hours}</td>
                                            </tr>
                                        ))
                                        .concat([
                                            <tr key={`${employee}-spacer`} style={{ height: '10px' }}><td colSpan="4"></td></tr>
                                        ])
                                ))}
                                <tr style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{shopTotalHours} h</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                        <Button
                            className="button-base button-retour"
                            onClick={() => setShowMonthlyRecapModal(false)}
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        )
    );
};

export default MonthlyRecapModal;
