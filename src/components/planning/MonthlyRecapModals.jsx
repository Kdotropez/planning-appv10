import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, isMonday, isWithinInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage } from '../../utils/localStorage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import Button from '../common/Button';
import '@/assets/styles.css';

const MonthlyRecapModals = ({
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning,
    showMonthlyRecapModal,
    setShowMonthlyRecapModal,
    showEmployeeMonthlyRecap,
    setShowEmployeeMonthlyRecap,
    selectedEmployeeForMonthlyRecap,
    setSelectedEmployeeForMonthlyRecap,
    calculateEmployeeWeeklyHours,
    calculateEmployeeDailyHours
}) => {
    if (!showMonthlyRecapModal && !showEmployeeMonthlyRecap) {
        console.log('MonthlyRecapModals: No modal to show');
        return null;
    }

    // Sélecteur de mois
    const [selectedMonth, setSelectedMonth] = useState(new Date(selectedWeek));
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
        .filter(week => isMonday(week))
        .map(week => ({
            key: format(week, 'yyyy-MM-dd'),
            label: `Semaine du ${format(week, 'd MMMM yyyy', { locale: fr })}`
        }));

    // Liste des mois pour le sélecteur
    const months = Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(selectedMonth.getFullYear(), i, 1);
        return {
            value: format(monthDate, 'yyyy-MM'),
            label: format(monthDate, 'MMMM yyyy', { locale: fr })
        };
    });

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedMonth(new Date(year, month - 1, 1));
    };

    const getEmployeeColorClass = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return index >= 0 ? colors[index % colors.length] : '';
    };

    const getEmployeeBackgroundColor = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const backgroundColors = [
            [230, 240, 250], // #e6f0fa
            [230, 255, 237], // #e6ffed
            [255, 230, 230], // #ffe6e6
            [208, 240, 250], // #d0f0fa
            [240, 230, 250], // #f0e6fa
            [255, 253, 230], // #fffde6
            [214, 230, 255]  // #d6e6ff
        ];
        return index >= 0 ? backgroundColors[index % backgroundColors.length] : [200, 200, 200];
    };

    const calculateEmployeeWeeklyHoursInMonth = (employee, week, weekPlanning) => {
        let totalHours = 0;
        for (let i = 0; i < 7; i++) {
            const dayKey = format(addDays(new Date(week), i), 'yyyy-MM-dd');
            if (isWithinInterval(new Date(dayKey), { start: monthStart, end: monthEnd })) {
                totalHours += calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
            }
        }
        console.log('Weekly hours for', employee, week, totalHours.toFixed(1));
        return totalHours;
    };

    const recapData = [];
    const employees = showMonthlyRecapModal ? selectedEmployees : [selectedEmployeeForMonthlyRecap];
    let totalMonthHours = 0;

    employees.forEach(employee => {
        const employeeData = {
            employee,
            weeks: [],
            totalHours: 0,
            colorClass: getEmployeeColorClass(employee),
            backgroundColor: getEmployeeBackgroundColor(employee)
        };

        weeks.forEach(week => {
            const weeklyHours = calculateEmployeeWeeklyHoursInMonth(employee, week.key, loadFromLocalStorage(`planning_${selectedShop}_${week.key}`, planning));
            employeeData.weeks.push({
                week: week.label,
                hours: weeklyHours.toFixed(1)
            });
            employeeData.totalHours += weeklyHours;
        });

        employeeData.totalHours = employeeData.totalHours.toFixed(1);
        totalMonthHours += parseFloat(employeeData.totalHours);
        recapData.push(employeeData);
    });

    console.log('MonthlyRecapModals: Generated recap data:', recapData);
    console.log('MonthlyRecapModals: Total month hours:', totalMonthHours.toFixed(1));

    const exportToPDF = () => {
        console.log('MonthlyRecapModals: Exporting to PDF');
        try {
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFont('Helvetica', 'normal');
            doc.text(
                `Récapitulatif mensuel ${showMonthlyRecapModal ? `- ${selectedShop}` : `de ${selectedEmployeeForMonthlyRecap}`}`,
                10,
                10
            );
            doc.text(`Mois de ${format(monthStart, 'MMMM yyyy', { locale: fr })}`, 10, 20);
            doc.text(`Total heures du mois : ${totalMonthHours.toFixed(1)} h`, 10, 30);

            const body = [];
            recapData.forEach((employeeData, empIndex) => {
                employeeData.weeks.forEach((weekData, weekIndex) => {
                    body.push({
                        row: [
                            weekIndex === 0 ? employeeData.employee : '',
                            weekData.week,
                            `${weekData.hours} h`
                        ],
                        backgroundColor: employeeData.backgroundColor
                    });
                });
                body.push({
                    row: ['', `Total mois pour ${employeeData.employee}`, `${employeeData.totalHours} h`],
                    backgroundColor: employeeData.backgroundColor
                });
                if (empIndex < recapData.length - 1 || !showMonthlyRecapModal) {
                    body.push({
                        row: ['', '', ''],
                        backgroundColor: [255, 255, 255]
                    });
                }
            });

            doc.autoTable({
                head: [['Employé', 'Semaine', 'Heures']],
                body: body.map(item => item.row),
                startY: 40,
                styles: { font: 'Helvetica', fontSize: 10, cellPadding: 2, lineHeight: 1 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
                bodyStyles: { textColor: [51, 51, 51], fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 40, halign: 'left' },
                    1: { cellWidth: 80, halign: 'left' },
                    2: { cellWidth: 30 }
                },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        const rowIndex = data.row.index;
                        data.cell.styles.fillColor = body[rowIndex].backgroundColor;
                    }
                }
            });

            doc.save(`monthly_recap_${showMonthlyRecapModal ? 'shop' : `employee_${selectedEmployeeForMonthlyRecap}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            console.log('MonthlyRecapModals: PDF exported successfully');
        } catch (error) {
            console.error('MonthlyRecapModals: PDF export failed', error);
            alert(`Erreur lors de l'exportation PDF : ${error.message || 'Erreur inconnue'}`);
        }
    };

    const exportAsImagePdf = async () => {
        console.log('MonthlyRecapModals: Starting PDF export as image');
        try {
            const modalElement = document.querySelector('.modal-content');
            if (!modalElement) throw new Error('Contenu de la modale introuvable');

            const canvas = await html2canvas(modalElement, {
                scale: 3,
                useCORS: true,
                scrollX: 0,
                scrollY: -window.scrollY,
                backgroundColor: '#ffffff',
                windowWidth: modalElement.scrollWidth,
                windowHeight: modalElement.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;

            const imgWidth = canvas.width * 0.264583;
            const imgHeight = canvas.height * 0.264583;
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = pageHeight - 2 * margin;

            const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;

            if (scaledWidth > maxWidth || scaledHeight > maxHeight) {
                const totalWidth = imgWidth;
                let currentX = 0;
                let pageCount = 0;
                while (currentX < totalWidth) {
                    if (pageCount > 0) {
                        pdf.addPage();
                    }
                    const sliceWidth = maxWidth / ratio;
                    pdf.addImage(imgData, 'PNG', margin, margin, maxWidth, Math.min(scaledHeight, maxHeight), null, 'FAST', 0, currentX);
                    currentX += sliceWidth;
                    pageCount++;
                }
            } else {
                pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
            }

            pdf.save(`monthly_recap_${showMonthlyRecapModal ? 'shop' : `employee_${selectedEmployeeForMonthlyRecap}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            console.log('MonthlyRecapModals: PDF exported successfully as image');
        } catch (error) {
            console.error('MonthlyRecapModals: PDF export failed', error);
            alert(`Erreur lors de l'exportation PDF : ${error.message || 'Erreur inconnue'}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Récapitulatif mensuel {showMonthlyRecapModal ? `- ${selectedShop}` : `de ${selectedEmployeeForMonthlyRecap}`}
                </h2>
                <div className="form-group" style={{ marginBottom: '15px', textAlign: 'center' }}>
                    <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block' }}>
                        Sélectionner le mois
                    </label>
                    <select
                        value={format(selectedMonth, 'yyyy-MM')}
                        onChange={handleMonthChange}
                        style={{ width: '200px', padding: '8px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        {months.map(month => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    Mois de {format(monthStart, 'MMMM yyyy', { locale: fr })}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    Total heures du mois : {totalMonthHours.toFixed(1)} h
                </p>
                <table className="monthly-recap-table">
                    <thead>
                        <tr>
                            <th className="align-left">Employé</th>
                            <th className="align-left">Semaine</th>
                            <th>Heures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((employeeData, empIndex) => (
                            <React.Fragment key={empIndex}>
                                {employeeData.weeks.map((weekData, weekIndex) => (
                                    <tr key={`${empIndex}-${weekIndex}`} className={employeeData.colorClass}>
                                        <td className="align-left">{weekIndex === 0 ? employeeData.employee : ''}</td>
                                        <td className="align-left">{weekData.week}</td>
                                        <td>{`${weekData.hours} h`}</td>
                                    </tr>
                                ))}
                                <tr className={employeeData.colorClass}>
                                    <td className="align-left"></td>
                                    <td className="align-left">Total mois pour {employeeData.employee}</td>
                                    <td>{`${employeeData.totalHours} h`}</td>
                                </tr>
                                {(empIndex < recapData.length - 1 || !showMonthlyRecapModal) && (
                                    <tr className="employee-divider">
                                        <td colSpan="3" style={{ height: '10px', backgroundColor: '#fff' }}></td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <div className="button-group" style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Button className="button-pdf" onClick={exportToPDF}>
                        Exporter en PDF
                    </Button>
                    <Button className="button-pdf" onClick={exportAsImagePdf}>
                        Exporter en PDF (image fidèle)
                    </Button>
                    <Button
                        className="modal-close"
                        onClick={() => {
                            console.log('MonthlyRecapModals: Closing modal');
                            if (showMonthlyRecapModal) {
                                setShowMonthlyRecapModal(false);
                            } else {
                                setShowEmployeeMonthlyRecap(false);
                                setSelectedEmployeeForMonthlyRecap('');
                            }
                        }}
                    >
                        ✕
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyRecapModals;