import React from 'react';
import { format, addDays, addMinutes, parse } from 'date-fns';
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
    if (!showRecapModal) {
        console.log('RecapModal: No modal to show, showRecapModal is null');
        return null;
    }

    const isWeekRecap = showRecapModal === 'week';
    const isEmployeeWeekRecap = showRecapModal.includes('_week');
    const employee = isEmployeeWeekRecap ? showRecapModal.replace('_week', '') : showRecapModal;

    console.log('RecapModal: Rendering modal', { showRecapModal, isWeekRecap, isEmployeeWeekRecap, employee, selectedWeek });

    const pastelColors = [
        [230, 240, 250], // #e6f0fa (Lundi)
        [230, 255, 237], // #e6ffed (Mardi)
        [255, 230, 230], // #ffe6e6 (Mercredi)
        [208, 240, 250], // #d0f0fa (Jeudi)
        [240, 230, 250], // #f0e6fa (Vendredi)
        [255, 253, 230], // #fffde6 (Samedi)
        [214, 230, 255]  // #d6e6ff (Dimanche)
    ];

    const getDayColorClass = (dayIndex) => {
        const colors = ['day-0', 'day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6'];
        return colors[dayIndex % colors.length];
    };

    const getDayBackgroundColor = (dayIndex) => {
        return pastelColors[dayIndex % pastelColors.length];
    };

    const formatTimeRange = (employee, dayKey, timeSlots) => {
        console.log(`RecapModal: Formatting time range for ${employee} on ${dayKey}`, { timeSlots, planning: planning[employee]?.[dayKey] });
        if (!planning[employee]?.[dayKey] || planning[employee][dayKey].every(slot => !slot)) {
            return { start: 'Congé ☀️', pause: '', resume: '', end: '', hours: '0.0 h' };
        }

        let start = null, pause = null, resume = null, end = null;
        let inShift = false;

        for (let index = 0; index < timeSlots.length; index++) {
            const isChecked = planning[employee][dayKey][index];
            const slot = timeSlots[index];
            console.log(`RecapModal: Processing slot ${slot} at index ${index}, isChecked: ${isChecked}, inShift: ${inShift}, start: ${start}, pause: ${pause}, resume: ${resume}, end: ${end}`);
            
            if (isChecked && !inShift && !start) {
                start = slot;
                inShift = true;
            } else if (!isChecked && inShift && !pause) {
                pause = slot;
                inShift = false;
            } else if (isChecked && !inShift && pause && !resume) {
                resume = slot;
                inShift = true;
            } else if (!isChecked && inShift && resume) {
                end = slot;
                inShift = false;
            } else if (isChecked && index === timeSlots.length - 1) {
                end = format(addMinutes(parse(slot, 'HH:mm', new Date()), 30), 'HH:mm');
            }
        }

        if (inShift && !end) {
            end = format(addMinutes(parse(timeSlots[timeSlots.length - 1], 'HH:mm', new Date()), 30), 'HH:mm');
        }

        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
        console.log(`RecapModal: Time range for ${employee} on ${dayKey}:`, { start, pause, resume: resume || '-', end, hours });
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
        console.log('RecapModal: Generating data for week recap');
        days.forEach((day, index) => {
            const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
            const dayData = {
                day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
                employees: [],
                totalHours: 0,
                dayIndex: index
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
        console.log('RecapModal: Generating data for employee week recap');
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
                dayIndex: index
            });
            totalWeekHours += parseFloat(hours);
        });
    } else {
        console.log('RecapModal: Generating data for employee day recap');
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
            dayIndex: currentDay
        });
    }

    console.log('RecapModal: Generated recap data:', recapData);

    const exportToPDF = () => {
        console.log('RecapModal: Exporting to PDF for', { showRecapModal, employee });
        const doc = new jsPDF();
        doc.setFont('Roboto', 'normal');
        const title = isWeekRecap
            ? `Récapitulatif hebdomadaire - ${selectedShop} (${calculateShopWeeklyHours()} h)`
            : isEmployeeWeekRecap
            ? `Récapitulatif de ${employee} ${totalWeekHours.toFixed(1)} h`
            : `Récapitulatif de ${employee}`;
        doc.text(title, 10, 10);
        const weekStart = format(new Date(selectedWeek), 'dd/MM', { locale: fr });
        const weekEnd = format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr });
        doc.text(`Semaine du Lundi ${weekStart} au Dimanche ${weekEnd}`, 10, (isWeekRecap || isEmployeeWeekRecap) ? 20 : 20);
        const body = [];
        recapData.forEach(dayData => {
            if (dayData.employees.length > 0) {
                dayData.employees.forEach(emp => {
                    body.push({
                        row: [dayData.day, emp.employee, emp.start, emp.pause, emp.resume, emp.end, emp.hours],
                        backgroundColor: getDayBackgroundColor(dayData.dayIndex)
                    });
                    dayData.day = ''; // Effacer le jour pour les lignes suivantes du même jour
                });
            }
        });
        if (isWeekRecap || isEmployeeWeekRecap) {
            body.push({
                row: ['Total semaine', '', '', '', '', '', `${totalWeekHours.toFixed(1)} h`],
                backgroundColor: [245, 245, 245]
            });
        }
        doc.autoTable({
            head: [['Jour', 'Employé', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures effectives']],
            body: body.map(item => item.row),
            startY: (isWeekRecap || isEmployeeWeekRecap) ? 30 : 20,
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
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    data.cell.styles.fillColor = body[rowIndex].backgroundColor;
                    if (data.column.index === 0 && data.cell.text[0]) {
                        data.cell.styles.lineWidth = 0.5;
                        data.cell.styles.lineColor = [200, 200, 200];
                    }
                }
            }
        });
        doc.save(`recap_${isWeekRecap ? 'weekly' : isEmployeeWeekRecap ? `employee_week_${employee}` : `employee_day_${employee}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        console.log('RecapModal: PDF exported successfully');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    {isWeekRecap
                        ? `Récapitulatif hebdomadaire - ${selectedShop} (${calculateShopWeeklyHours()} h)`
                        : isEmployeeWeekRecap
                        ? `Récapitulatif de ${employee} ${totalWeekHours.toFixed(1)} h`
                        : `Récapitulatif de ${employee}`}
                </h2>
                {(isWeekRecap || isEmployeeWeekRecap) && (
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                        Semaine du Lundi {format(new Date(selectedWeek), 'dd/MM', { locale: fr })} au Dimanche {format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr })}
                    </p>
                )}
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
                                    <tr
                                        key={`${index}-${empIndex}`}
                                        className={getDayColorClass(dayData.dayIndex)}
                                    >
                                        <td>{empIndex === 0 ? dayData.day : ''}</td>
                                        <td>{emp.employee}</td>
                                        <td>{emp.start}</td>
                                        <td>{emp.pause}</td>
                                        <td>{emp.resume}</td>
                                        <td>{emp.end}</td>
                                        <td>{emp.hours}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        {(isWeekRecap || isEmployeeWeekRecap) && (
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