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
            selectedEmployees.forEach(employee => {
                const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
                recapData.push({
                    employee,
                    day: `${day.name} ${day.date}`,
                    start,
                    pause,
                    resume,
                    end,
                    hours
                });
            });
            const dailyHours = selectedEmployees.reduce((sum, employee) => sum + calculateEmployeeDailyHours(employee, dayKey, planning), 0);
            recapData.push({
                employee: 'Total jour',
                day: '',
                start: '',
                pause: '',
                resume: '',
                end: '',
                hours: `${dailyHours.toFixed(1)} h`
            });
            totalWeekHours += dailyHours;
        });
        recapData.push({
            employee: 'Total semaine',
            day: '',
            start: '',
            pause: '',
            resume: '',
            end: '',
            hours: `${totalWeekHours.toFixed(1)} h`
        });
    } else if (isEmployeeWeekRecap) {
        days.forEach((day, index) => {
            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
            const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
            recapData.push({
                employee,
                day: `${day.name} ${day.date}`,
                start,
                pause,
                resume,
                end,
                hours
            });
        });
        const weeklyHours = calculateEmployeeWeeklyHours(employee, selectedWeek, planning);
        recapData.push({
            employee: 'Total semaine',
            day: '',
            start: '',
            pause: '',
            resume: '',
            end: '',
            hours: `${weeklyHours.toFixed(1)} h`
        });
    } else {
        const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
        const { start, pause, resume, end, hours } = formatTimeRange(employee, dayKey, config.timeSlots);
        recapData.push({
            employee,
            day: `${days[currentDay].name} ${days[currentDay].date}`,
            start,
            pause,
            resume,
            end,
            hours
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
        doc.autoTable({
            head: [['Employé', 'Jour', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures effectives']],
            body: recapData.map(row => [row.employee, row.day, row.start, row.pause, row.resume, row.end, row.hours]),
            startY: 20,
            styles: { font: 'Roboto', fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [51, 51, 51] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 40 },
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
                            <th>Employé</th>
                            <th>Jour</th>
                            <th>ENTRÉE</th>
                            <th>PAUSE</th>
                            <th>RETOUR</th>
                            <th>SORTIE</th>
                            <th>Heures effectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((row, index) => (
                            <tr key={index} className={row.employee.includes('Total') ? 'total-row' : getEmployeeColorClass(row.employee)}>
                                <td>{row.employee}</td>
                                <td>{row.day}</td>
                                <td>{row.start}</td>
                                <td>{row.pause}</td>
                                <td>{row.resume}</td>
                                <td>{row.end}</td>
                                <td>{row.hours}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="button-group" style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Button className="button-primary" onClick={exportToPDF}>
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