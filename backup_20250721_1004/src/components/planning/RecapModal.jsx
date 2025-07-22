import React from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '@/assets/styles.css';

const RecapModal = ({
    showRecapModal,
    setShowRecapModal,
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning,
    currentDay,
    days,
    calculateEmployeeDailyHours,
    calculateEmployeeWeeklyHours,
    calculateShopWeeklyHours
}) => {
    if (!showRecapModal) return null;

    const isWeekRecap = showRecapModal === 'week';
    const isEmployeeWeekRecap = showRecapModal.includes('_week');
    const employee = isEmployeeWeekRecap ? showRecapModal.replace('_week', '') : showRecapModal;

    const getEmployeeColorClass = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return index >= 0 ? colors[index % colors.length] : '';
    };

    const formatTimeRange = (employee, dayKey, timeSlots) => {
        console.log(`RecapModal: Formatting time range for ${employee} on ${dayKey}`);
        if (!planning[employee]?.[dayKey] || planning[employee][dayKey].every(slot => !slot)) {
            return { start: 'Congé', pause: '', resume: '', end: '', hours: '0.0 h' };
        }

        let start = null, pause = null, resume = null, end = null;
        let inShift = false;

        timeSlots.forEach((slot, index) => {
            const isChecked = planning[employee][dayKey][index];
            if (isChecked && !inShift) {
                start = slot;
                inShift = true;
            } else if (!isChecked && inShift && !pause) {
                pause = slot;
                inShift = false;
            } else if (isChecked && !inShift && pause) {
                resume = slot;
                inShift = true;
            } else if (!isChecked && inShift && resume) {
                end = slot;
                inShift = false;
            } else if (isChecked && index === timeSlots.length - 1) {
                end = timeSlots[index];
            }
        });

        if (inShift && !end) {
            end = timeSlots[timeSlots.length - 1];
        }

        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
        console.log(`RecapModal: Time range for ${employee} on ${dayKey}:`, { start, pause, resume, end, hours });
        return {
            start: start || '-',
            pause: pause || '-',
            resume: resume || '-',
            end: end || '-',
            hours: `${hours.toFixed(1)} h`
        };
    };

    const recapData = [];
    let totalWeekHours = 0;

    if (isWeekRecap) {
        days.forEach((day, index) => {
            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
            const dayData = {
                day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
                employees: [],
                totalHours: 0
            };
            selectedEmployees.forEach(employee => {
                const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
                dayData.employees.push({
                    employee,
                    start,
                    pause,
                    resume,
                    end,
                    hours
                });
                dayData.totalHours += parseFloat(hours);
            });
            recapData.push(dayData);
            totalWeekHours += dayData.totalHours;
        });
        recapData.push({
            day: 'Total semaine',
            employees: [],
            totalHours: totalWeekHours
        });
    } else if (isEmployeeWeekRecap) {
        days.forEach((day, index) => {
            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
            const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
            recapData.push({
                day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
                employees: [{
                    employee,
                    start,
                    pause,
                    resume,
                    end,
                    hours
                }],
                totalHours: parseFloat(hours)
            });
            totalWeekHours += parseFloat(hours);
        });
        recapData.push({
            day: 'Total semaine',
            employees: [],
            totalHours: totalWeekHours
        });
    } else {
        const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
        const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
        recapData.push({
            day: `${days[currentDay].name} ${format(addDays(new Date(selectedWeek), currentDay), 'dd/MM', { locale: fr })}`,
            employees: [{
                employee,
                start,
                pause,
                resume,
                end,
                hours
            }],
            totalHours: parseFloat(hours)
        });
    }

    console.log('RecapModal: Generated recap data:', recapData);

    const exportToPDF = () => {
        console.log('RecapModal: Exporting to PDF');
        const doc = new jsPDF();
        doc.setFont('Roboto', 'normal');
        doc.text(
            `Récapitulatif ${isWeekRecap ? 'hebdomadaire' : isEmployeeWeekRecap ? `semaine de ${employee}` : `de ${employee}`}${isWeekRecap ? ` - ${selectedShop}` : ''}`,
            10,
            10
        );
        const body = [];
        recapData.forEach(dayData => {
            dayData.employees.forEach(emp => {
                body.push([dayData.day, emp.employee, emp.start, emp.pause, emp.resume, emp.end, emp.hours]);
                dayData.day = ''; // Effacer le jour pour les lignes suivantes du même jour
            });
            if (dayData.employees.length > 0) {
                body.push(['Total ' + dayData.day.toLowerCase(), '', '', '', '', '', `${dayData.totalHours.toFixed(1)} h`]);
            }
        });
        if (isWeekRecap) {
            body.push(['Total semaine', '', '', '', '', '', `${totalWeekHours.toFixed(1)} h`]);
        }
        doc.autoTable({
            head: [['Jour', 'Employé', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures effectives']],
            body,
            startY: 20,
            styles: { font: 'Roboto', fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [51, 51, 51] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 }
            }
        });
        doc.save(`recap_${isWeekRecap ? 'weekly' : isEmployeeWeekRecap ? `employee_week_${employee}` : `employee_day_${employee}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        console.log('RecapModal: PDF exported successfully');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Récapitulatif {isWeekRecap ? 'hebdomadaire' : isEmployeeWeekRecap ? `semaine de ${employee}` : `de ${employee}`}
                    {isWeekRecap && ` - ${selectedShop} (${calculateShopWeeklyHours()} h)`}
                </h2>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Jour</th>
                            <th>Employé</th>
                            <th>ENTRÉE</th>
                            <th>PAUSE</th>
                            <th>RETOUR</th>
                            <th>SORTIE</th>
                            <th>Heures effectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((dayData, index) => (
                            <React.Fragment key={index}>
                                {dayData.employees.map((emp, empIndex) => (
                                    <tr key={`${index}-${empIndex}`} className={getEmployeeColorClass(emp.employee)}>
                                        <td>{empIndex === 0 ? dayData.day : ''}</td>
                                        <td>{emp.employee}</td>
                                        <td>{emp.start}</td>
                                        <td>{emp.pause}</td>
                                        <td>{emp.resume}</td>
                                        <td>{emp.end}</td>
                                        <td>{emp.hours}</td>
                                    </tr>
                                ))}
                                {dayData.employees.length > 0 && (
                                    <tr className="total-row">
                                        <td>Total {dayData.day.charAt(0).toUpperCase() + dayData.day.slice(1).toLowerCase()}</td>
                                        <td colSpan="5"></td>
                                        <td>{`${dayData.totalHours.toFixed(1)} h`}</td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {isWeekRecap && (
                            <tr className="total-row">
                                <td>Total semaine</td>
                                <td colSpan="5"></td>
                                <td>{`${totalWeekHours.toFixed(1)} h`}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="button-group" style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Button className="button-pdf" onClick={exportToPDF}>
                        Exporter en PDF
                    </Button>
                    <Button
                        className="modal-close"
                        onClick={() => {
                            console.log('RecapModal: Closing modal');
                            setShowRecapModal(null);
                        }}
                    >
                        ✕
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;