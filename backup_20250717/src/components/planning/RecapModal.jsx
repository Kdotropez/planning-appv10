import React, { useState } from 'react';
import { format, addMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapModal = ({ type, employee, shop, days, config, selectedWeek, planning, selectedEmployees, onClose, calculateEmployeeDailyHours, calculateEmployeeWeeklyHours, calculateShopWeeklyHours }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const calculateRecapData = () => {
        if (!config || !config.timeSlots || !Array.isArray(config.timeSlots) || config.timeSlots.length === 0) {
            setError('Configuration des tranches horaires invalide.');
            return [];
        }
        if (!planning || typeof planning !== 'object') {
            setError('Données de planning invalides.');
            return [];
        }
        if (type === 'employee' && !employee) {
            setError('Aucun employé sélectionné.');
            return [];
        }
        if (type === 'week' && (!selectedEmployees || !Array.isArray(selectedEmployees) || selectedEmployees.length === 0)) {
            setError('Aucun employé sélectionné pour le récapitulatif hebdomadaire.');
            return [];
        }

        if (type === 'employee') {
            return days.map((day, index) => {
                const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                const slots = planning[employee]?.[dayKey] || [];
                let arrival = null, pause1 = null, return1 = null, pause2 = null, return2 = null, exit = null;
                let hours = 0;
                let inBlock = false;
                let blockCount = 0;

                if (!Array.isArray(slots)) {
                    return {
                        day: day.name,
                        arrival: '-',
                        pause1: '-',
                        return1: '-',
                        pause2: '-',
                        return2: '-',
                        exit: '-',
                        hours: '0.0'
                    };
                }

                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i];
                    if (!slot || typeof slot !== 'string') continue;
                    const match = slot.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                    if (!match) continue;
                    const [_, start, end] = match;

                    if (!inBlock) {
                        if (!arrival) {
                            arrival = start;
                            inBlock = true;
                        } else if (blockCount === 1) {
                            return1 = start;
                            inBlock = true;
                        } else if (blockCount === 2) {
                            return2 = start;
                            inBlock = true;
                        }
                    } else if (i === slots.length - 1 || !slots[i + 1]) {
                        exit = end;
                        inBlock = false;
                        blockCount++;
                    }

                    const startTime = new Date(`1970-01-01T${start}:00`);
                    const endTime = new Date(`1970-01-01T${end}:00`);
                    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                    hours += (endTime - startTime) / (1000 * 60 * 60);
                }

                return {
                    day: day.name,
                    arrival: arrival || '-',
                    pause1: pause1 || '-',
                    return1: return1 || '-',
                    pause2: pause2 || '-',
                    return2: return2 || '-',
                    exit: exit || '-',
                    hours: hours.toFixed(1)
                };
            });
        } else {
            return days.map((day, index) => {
                const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                const employeesData = selectedEmployees.map(emp => {
                    const slots = planning[emp]?.[dayKey] || [];
                    let arrival = null, pause1 = null, return1 = null, pause2 = null, return2 = null, exit = null;
                    let hours = 0;
                    let inBlock = false;
                    let blockCount = 0;

                    if (!Array.isArray(slots)) {
                        return {
                            day: day.name,
                            employee: emp,
                            arrival: '-',
                            pause1: '-',
                            return1: '-',
                            pause2: '-',
                            return2: '-',
                            exit: '-',
                            hours: '0.0',
                            dayIndex: index
                        };
                    }

                    for (let i = 0; i < slots.length; i++) {
                        const slot = slots[i];
                        if (!slot || typeof slot !== 'string') continue;
                        const match = slot.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
                        if (!match) continue;
                        const [_, start, end] = match;

                        if (!inBlock) {
                            if (!arrival) {
                                arrival = start;
                                inBlock = true;
                            } else if (blockCount === 1) {
                                return1 = start;
                                inBlock = true;
                            } else if (blockCount === 2) {
                                return2 = start;
                                inBlock = true;
                            }
                        } else if (i === slots.length - 1 || !slots[i + 1]) {
                            exit = end;
                            inBlock = false;
                            blockCount++;
                        }

                        const startTime = new Date(`1970-01-01T${start}:00`);
                        const endTime = new Date(`1970-01-01T${end}:00`);
                        if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                        hours += (endTime - startTime) / (1000 * 60 * 60);
                    }

                    return {
                        day: day.name,
                        employee: emp,
                        arrival: arrival || '-',
                        pause1: pause1 || '-',
                        return1: return1 || '-',
                        pause2: pause2 || '-',
                        return2: return2 || '-',
                        exit: exit || '-',
                        hours: hours.toFixed(1),
                        dayIndex: index
                    };
                });
                return { day: day.name, employees: employeesData };
            });
        }
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const exportToPDF = () => {
        const data = calculateRecapData();
        if (!data || data.length === 0) {
            setError('Aucune donnée valide à exporter.');
            return;
        }

        setIsExporting(true);
        const doc = new jsPDF();
        doc.setFont('times');
        doc.setFontSize(12);

        if (type === 'employee') {
            const employeeWeeklyHours = Number(calculateEmployeeWeeklyHours(employee, selectedWeek, planning)) || 0;
            doc.text(`Récapitulatif individuel pour ${employee} (${employeeWeeklyHours.toFixed(1)} h) - ${shop}`, 14, 20);
            doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);
            doc.autoTable({
                head: [['Jour', 'Arrivée', 'Pause 1', 'Retour 1', 'Pause 2', 'Retour 2', 'Sortie', 'Heures effectives']],
                body: data.map(row => [row.day, row.arrival, row.pause1, row.return1, row.pause2, row.return2, row.exit, row.hours])
                    .concat([['Total général', '', '', '', '', '', '', employeeWeeklyHours.toFixed(1)]]),
                startY: 40,
                theme: 'grid',
                styles: { font: 'times', fontSize: 10 },
                headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
            });
        } else {
            const shopWeeklyHours = Number(calculateShopWeeklyHours()) || 0;
            doc.text(`Récapitulatif hebdomadaire - ${shop} (${shopWeeklyHours.toFixed(1)} h)`, 14, 20);
            doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);
            let startY = 40;
            data.forEach((dayData, index) => {
                doc.text(dayData.day, 14, startY);
                const dailyTotalHours = dayData.employees.reduce((sum, emp) => sum + parseFloat(emp.hours || 0), 0).toFixed(1);
                doc.autoTable({
                    head: [['Employé', 'Arrivée', 'Pause 1', 'Retour 1', 'Pause 2', 'Retour 2', 'Sortie', 'Heures effectives']],
                    body: data.map(row => [row.employee, row.arrival, row.pause1, row.return1, row.pause2, row.return2, row.exit, row.hours])
                        .concat([['Total jour', '', '', '', '', '', '', dailyTotalHours]]),
                    startY: startY + 5,
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 10, fillColor: pastelColors[index % pastelColors.length] },
                    headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                });
                startY = doc.lastAutoTable.finalY + 10;
            });
            doc.autoTable({
                body: [['Total semaine', '', '', '', '', '', '', shopWeeklyHours.toFixed(1)]],
                startY: startY,
                theme: 'grid',
                styles: { font: 'times', fontSize: 10, fontStyle: 'bold' },
            });
        }

        doc.save(`recap_${type}_${employee || 'week'}_${shop}.pdf`);
        setIsExporting(false);
    };

    const recapData = calculateRecapData();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose} disabled={isExporting}>
                    ✕
                </button>
                <h3 style={{ fontFamily: 'Roboto', textAlign: 'center' }}>
                    {(type === 'employee'
                        ? `Récapitulatif pour ${employee} (${(Number(calculateEmployeeWeeklyHours(employee, selectedWeek, planning)) || 0).toFixed(1)} h)`
                        : `Récapitulatif semaine - ${shop} (${(Number(calculateShopWeeklyHours()) || 0).toFixed(1)} h)`)}
                </h3>
                <p style={{ fontFamily: 'Roboto', textAlign: 'center', marginBottom: '10px' }}>
                    Semaine du Lundi {format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche {format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}
                </p>
                {error ? (
                    <p style={{ fontFamily: 'Roboto', textAlign: 'center', color: '#e53935' }}>
                        {error}
                    </p>
                ) : (
                    <table className="recap-table" style={{ fontFamily: 'Roboto', width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Jour</th>
                                {type === 'week' ? <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Employé</th> : null}
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Arrivée</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Pause 1</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Retour 1</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Pause 2</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Retour 2</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Sortie</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Heures effectives</th>
                            </tr>
                        </thead>
                        <tbody>
                            {type === 'employee' ? (
                                recapData.map((row, index) => (
                                    <tr key={index} style={{ backgroundColor: pastelColors[index % pastelColors.length] }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.day}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.arrival}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.pause1}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.return1}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.pause2}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.return2}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.exit}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.hours} h</td>
                                    </tr>
                                )).concat([
                                    <tr key="total" style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(Number(calculateEmployeeWeeklyHours(employee, selectedWeek, planning)) || 0).toFixed(1)} h</td>
                                    </tr>
                                ])
                            ) : (
                                recapData.map((dayData, dayIndex) => (
                                    <React.Fragment key={dayIndex}>
                                        {dayData.employees.map((row, empIndex) => (
                                            <tr key={`${dayIndex}-${empIndex}`} style={{ backgroundColor: pastelColors[empIndex % pastelColors.length] }}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{empIndex === 0 ? row.day : ''}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.employee}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.arrival}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.pause1}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.return1}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.pause2}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.return2}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.exit}</td>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.hours} h</td>
                                            </tr>
                                        ))}
                                        <tr key={`${dayIndex}-total`} style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{dayData.day}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total jour</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{dayData.employees.reduce((sum, emp) => sum + parseFloat(emp.hours || 0), 0).toFixed(1)} h</td>
                                        </tr>
                                        {dayIndex < recapData.length - 1 && (
                                            <tr style={{ height: '10px', backgroundColor: 'transparent' }}></tr>
                                        )}
                                    </React.Fragment>
                                )).concat([
                                    <tr key="total-week" style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total semaine</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(Number(calculateShopWeeklyHours()) || 0).toFixed(1)} h</td>
                                    </tr>
                                ])
                            )}
                        </tbody>
                    </table>
                )}
                <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                    <Button
                        className="button-base button-primary"
                        onClick={exportToPDF}
                        disabled={isExporting || !!error}
                    >
                        Exporter en PDF
                    </Button>
                    <Button className="button-base button-retour" onClick={onClose} disabled={isExporting}>
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;