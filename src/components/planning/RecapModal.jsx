import React, { useState } from 'react';
import { format, addMinutes, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '@/assets/styles.css';

const RecapModal = ({ showRecapModal, setShowRecapModal, config, selectedShop, selectedWeek, selectedEmployees, planning, currentDay, days, calculateEmployeeDailyHours, calculateEmployeeWeeklyHours, calculateShopWeeklyHours }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');

    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const getTimeSlotsWithBreaks = (employee, dayKey) => {
        const slots = planning[employee]?.[dayKey] || [];
        const timeSlots = config?.timeSlots || [];
        const ranges = [];
        let currentRange = null;
        let breaks = [];

        if (!slots.some(slot => slot)) {
            return { status: 'Congé', ranges: [], breaks: [], hours: 0, columns: ['ENTRÉE'], values: ['Congé'] };
        }

        for (let i = 0; i < slots.length && i < timeSlots.length; i++) {
            if (!timeSlots[i]) {
                console.warn(`timeSlots[${i}] is undefined for employee ${employee} on ${dayKey}`);
                continue;
            }
            if (slots[i]) {
                if (!currentRange) {
                    currentRange = { 
                        start: timeSlots[i].split('-')[0] || '00:00', 
                        end: timeSlots[i].split('-')[1] || getEndTime(timeSlots[i].split('-')[0], config?.interval || 30) 
                    };
                } else {
                    currentRange.end = timeSlots[i].split('-')[1] || getEndTime(timeSlots[i].split('-')[0], config?.interval || 30);
                }
            } else if (currentRange) {
                ranges.push(currentRange);
                if (i < slots.length) {
                    breaks.push({ 
                        start: currentRange.end, 
                        end: timeSlots[i]?.split('-')[0] || '-' 
                    });
                }
                currentRange = null;
            }
        }
        if (currentRange) {
            ranges.push(currentRange);
        }

        const interruptionCount = breaks.length;
        const columns = interruptionCount === 0 ? ['ENTRÉE', 'SORTIE'] : interruptionCount === 1 ? ['ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE'] : ['ENTRÉE', 'PAUSE', 'RETOUR', 'PAUSE', 'RETOUR', 'SORTIE'];
        const values = [];

        if (interruptionCount === 0 && ranges[0]) {
            values.push(ranges[0].start, ranges[0].end);
        } else if (ranges[0] && breaks[0]) {
            values.push(ranges[0].start, breaks[0].start, ranges[1]?.start || '-');
            if (interruptionCount > 1 && ranges[2]) {
                values.push(breaks[1].start, ranges[2].start);
            }
            values.push(ranges[ranges.length - 1]?.end || '-');
        }

        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
        return { status: null, ranges, breaks, hours, columns, values };
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime || startTime === '-') return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const exportToPDF = async () => {
        if (!config?.timeSlots?.length) {
            setError('Erreur: Aucune configuration de tranches horaires disponible.');
            setIsExporting(false);
            return;
        }
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            doc.setFont('Roboto', 'normal');
            doc.setFontSize(12);

            const type = showRecapModal === 'week' ? 'week' : showRecapModal.includes('_week') ? 'employee' : 'employee';
            const employee = showRecapModal.includes('_week') ? showRecapModal.replace('_week', '') : showRecapModal;

            if (type === 'employee') {
                const isWeekly = showRecapModal.includes('_week');
                const employeeName = isWeekly ? employee : showRecapModal;
                const employeeWeeklyHours = calculateEmployeeWeeklyHours(employeeName, selectedWeek, planning).toFixed(1);
                doc.text(`Récapitulatif pour ${employeeName} (${employeeWeeklyHours} h) - ${selectedShop}`, 14, 20);
                doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);

                if (isWeekly) {
                    const firstDayKey = format(addDays(new Date(selectedWeek), 0), 'yyyy-MM-dd');
                    const { columns } = getTimeSlotsWithBreaks(employeeName, firstDayKey);
                    doc.autoTable({
                        head: [['Jour', ...columns, 'Heures effectives']],
                        body: days.map((day, index) => {
                            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                            const { status, hours, values } = getTimeSlotsWithBreaks(employeeName, dayKey);
                            return [
                                `${day.name} ${day.date}`,
                                ...(status ? [status, ...Array(columns.length - 1).fill('')] : values.concat(Array(columns.length - values.length).fill(''))),
                                hours.toFixed(1)
                            ];
                        }).concat([['Total général', ...Array(columns.length).fill(''), employeeWeeklyHours]]),
                        startY: 40,
                        theme: 'grid',
                        styles: { font: 'Roboto', fontSize: 10 },
                        headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    });
                } else {
                    const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                    const { status, hours, columns, values } = getTimeSlotsWithBreaks(employeeName, dayKey);
                    doc.autoTable({
                        head: [['Jour', ...columns, 'Heures effectives']],
                        body: [[
                            `${days[currentDay].name} ${days[currentDay].date}`,
                            ...(status ? [status, ...Array(columns.length - 1).fill('')] : values.concat(Array(columns.length - values.length).fill(''))),
                            hours.toFixed(1)
                        ]],
                        startY: 40,
                        theme: 'grid',
                        styles: { font: 'Roboto', fontSize: 10 },
                        headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    });
                }
            } else {
                const shopWeeklyHours = calculateShopWeeklyHours();
                doc.text(`Récapitulatif hebdomadaire - ${selectedShop} (${shopWeeklyHours} h)`, 14, 20);
                doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`, 14, 30);
                let startY = 40;
                days.forEach((day, index) => {
                    const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                    const { columns } = getTimeSlotsWithBreaks(selectedEmployees[0] || '', dayKey);
                    const employeesData = selectedEmployees.map((emp, empIndex) => {
                        const { status, hours, values } = getTimeSlotsWithBreaks(emp, dayKey);
                        return [
                            emp,
                            `${day.name} ${day.date}`,
                            ...(status ? [status, ...Array(columns.length - 1).fill('')] : values.concat(Array(columns.length - values.length).fill(''))),
                            hours.toFixed(1)
                        ];
                    });
                    doc.text(day.name, 14, startY);
                    doc.autoTable({
                        head: [['Employé', 'Jour', ...columns, 'Heures effectives']],
                        body: employeesData.concat([['Total jour', '', ...Array(columns.length).fill(''), employeesData.reduce((sum, emp) => sum + parseFloat(emp[columns.length + 2]), 0).toFixed(1)]]),
                        startY: startY + 5,
                        theme: 'grid',
                        styles: { font: 'Roboto', fontSize: 10, fillColor: pastelColors[index % pastelColors.length] },
                        headStyles: { fillColor: '#f0f0f0', textColor: '#333' },
                    });
                    startY = doc.lastAutoTable.finalY + 10;
                });
                doc.autoTable({
                    body: [['Total semaine', '', ...Array(4).fill(''), shopWeeklyHours]],
                    startY: startY,
                    theme: 'grid',
                    styles: { font: 'Roboto', fontSize: 10, fontStyle: 'bold' },
                });
            }

            doc.save(`recap_${type}_${employee || 'week'}_${selectedShop}.pdf`);
            setIsExporting(false);
            console.log('PDF exported successfully');
        } catch (error) {
            setError('Erreur lors de l’exportation du PDF.');
            setIsExporting(false);
            console.error('PDF export error:', error);
        }
    };

    const handleClose = () => {
        console.log('Attempting to close RecapModal, showRecapModal:', showRecapModal, 'isExporting:', isExporting);
        setShowRecapModal(null);
        setError('');
        setIsExporting(false);
    };

    if (!config?.timeSlots?.length) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close" onClick={handleClose} disabled={isExporting}>✕</button>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                        Erreur
                    </h3>
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                        Aucune configuration de tranches horaires disponible.
                    </p>
                    <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                        <Button className="button-base button-retour" onClick={handleClose} disabled={isExporting}>
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const type = showRecapModal === 'week' ? 'week' : showRecapModal.includes('_week') ? 'employee' : 'employee';
    const employee = showRecapModal.includes('_week') ? showRecapModal.replace('_week', '') : showRecapModal;

    return (
        <div className="modal-overlay" style={{ pointerEvents: 'auto' }}>
            <div className="modal-content">
                <button className="modal-close" onClick={handleClose} disabled={isExporting}>✕</button>
                <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                    {type === 'employee' && showRecapModal.includes('_week')
                        ? `Récapitulatif hebdomadaire - ${employee} (${calculateEmployeeWeeklyHours(employee, selectedWeek, planning).toFixed(1)} h)`
                        : type === 'employee'
                        ? `Récapitulatif journalier - ${employee} (${calculateEmployeeDailyHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'), planning).toFixed(1)} h)`
                        : `Récapitulatif hebdomadaire - ${selectedShop} (${calculateShopWeeklyHours()} h)`}
                </h3>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                    {type === 'employee' && !showRecapModal.includes('_week')
                        ? `${days[currentDay].name} ${days[currentDay].date}`
                        : `Semaine du Lundi ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'd MMMM', { locale: fr })}`}
                </p>
                {error ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>{error}</p>
                ) : (
                    <table className="recap-table" style={{ fontFamily: 'Roboto, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                {type === 'week' && <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Employé</th>}
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Jour</th>
                                {type === 'employee' && !showRecapModal.includes('_week')
                                    ? getTimeSlotsWithBreaks(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd')).columns.map((col, index) => (
                                        <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>{col}</th>
                                    ))
                                    : getTimeSlotsWithBreaks(selectedEmployees[0] || employee, format(addDays(new Date(selectedWeek), 0), 'yyyy-MM-dd')).columns.map((col, index) => (
                                        <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>{col}</th>
                                    ))}
                                <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Heures effectives</th>
                            </tr>
                        </thead>
                        <tbody>
                            {type === 'employee' ? (
                                showRecapModal.includes('_week') ? (
                                    days.map((day, index) => {
                                        const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                                        const { status, hours, values, columns } = getTimeSlotsWithBreaks(employee, dayKey);
                                        return (
                                            <tr key={index} style={{ backgroundColor: pastelColors[index % pastelColors.length] }}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{day.name} {day.date}</td>
                                                {status ? (
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan={columns.length}>{status}</td>
                                                ) : (
                                                    values.map((value, idx) => (
                                                        <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                                                    ))
                                                )}
                                                {(status ? [] : Array(columns.length - values.length).fill('')).map((_, idx) => (
                                                    <td key={`empty-${idx}`} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                                ))}
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hours.toFixed(1)} h</td>
                                            </tr>
                                        );
                                    }).concat([
                                        <tr key="total" style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                            {Array(getTimeSlotsWithBreaks(employee, format(addDays(new Date(selectedWeek), 0), 'yyyy-MM-dd')).columns.length).fill('').map((_, idx) => (
                                                <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            ))}
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateEmployeeWeeklyHours(employee, selectedWeek, planning).toFixed(1)} h</td>
                                        </tr>
                                    ])
                                ) : (
                                    (() => {
                                        const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                                        const { status, hours, values, columns } = getTimeSlotsWithBreaks(employee, dayKey);
                                        return [
                                            <tr key="single-day" style={{ backgroundColor: pastelColors[0] }}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{days[currentDay].name} {days[currentDay].date}</td>
                                                {status ? (
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan={columns.length}>{status}</td>
                                                ) : (
                                                    values.map((value, idx) => (
                                                        <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                                                    ))
                                                )}
                                                {(status ? [] : Array(columns.length - values.length).fill('')).map((_, idx) => (
                                                    <td key={`empty-${idx}`} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                                ))}
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hours.toFixed(1)} h</td>
                                            </tr>
                                        ];
                                    })()
                                )
                            ) : (
                                days.map((day, index) => (
                                    <React.Fragment key={index}>
                                        {selectedEmployees.map((emp, empIndex) => {
                                            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
                                            const { status, hours, values, columns } = getTimeSlotsWithBreaks(emp, dayKey);
                                            return (
                                                <tr key={`${emp}-${index}`} style={{ backgroundColor: pastelColors[empIndex % pastelColors.length] }}>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp}</td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{day.name} {day.date}</td>
                                                    {status ? (
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan={columns.length}>{status}</td>
                                                    ) : (
                                                        values.map((value, idx) => (
                                                            <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                                                        ))
                                                    )}
                                                    {(status ? [] : Array(columns.length - values.length).fill('')).map((_, idx) => (
                                                        <td key={`empty-${idx}`} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                                    ))}
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{hours.toFixed(1)} h</td>
                                                </tr>
                                            );
                                        })}
                                        <tr key={`${index}-total`} style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total jour</td>
                                            {Array(getTimeSlotsWithBreaks(selectedEmployees[0] || '', format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd')).columns.length).fill('').map((_, idx) => (
                                                <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            ))}
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{selectedEmployees.reduce((sum, emp) => sum + calculateEmployeeDailyHours(emp, format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd'), planning), 0).toFixed(1)} h</td>
                                        </tr>
                                        {index < days.length - 1 && (
                                            <tr style={{ height: '10px', backgroundColor: 'transparent' }}></tr>
                                        )}
                                    </React.Fragment>
                                )).concat([
                                    <tr key="total-week" style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total semaine</td>
                                        {Array(getTimeSlotsWithBreaks(selectedEmployees[0] || '', format(addDays(new Date(selectedWeek), 0), 'yyyy-MM-dd')).columns.length).fill('').map((_, idx) => (
                                            <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        ))}
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{calculateShopWeeklyHours()} h</td>
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
                    <Button className="button-base button-retour" onClick={handleClose} disabled={isExporting}>
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;