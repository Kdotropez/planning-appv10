import React from 'react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage } from '../../utils/localStorage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    calculateEmployeeWeeklyHours
}) => {
    if (!showMonthlyRecapModal && !showEmployeeMonthlyRecap) return null;

    const monthStart = startOfMonth(new Date(selectedWeek));
    const monthEnd = endOfMonth(new Date(selectedWeek));
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
        .filter(week => isMonday(week))
        .map(week => format(week, 'yyyy-MM-dd'));

    const getEmployeeColorClass = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return index >= 0 ? colors[index % colors.length] : '';
    };

    const getEmployeeBorderColor = (employee) => {
        const index = selectedEmployees.indexOf(employee);
        const borderColors = [
            [230, 240, 250], // #e6f0fa
            [230, 255, 237], // #e6ffed
            [255, 230, 230], // #ffe6e6
            [208, 240, 250], // #d0f0fa
            [240, 230, 250], // #f0e6fa
            [255, 253, 230], // #fffde6
            [214, 230, 255]  // #d6e6ff
        ];
        return index >= 0 ? borderColors[index % borderColors.length] : [200, 200, 200];
    };

    const recapData = [];
    const employees = showMonthlyRecapModal ? selectedEmployees : [selectedEmployeeForMonthlyRecap];
    let totalMonthHoursByEmployee = {};

    employees.forEach(employee => {
        totalMonthHoursByEmployee[employee] = 0;
        weeks.forEach(week => {
            const weekStart = new Date(week);
            const weeklyHours = calculateEmployeeWeeklyHours(employee, week, loadFromLocalStorage(`planning_${selectedShop}_${week}`, planning));
            recapData.push({
                employee,
                week: `Semaine du ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`,
                hours: `${weeklyHours.toFixed(1)} h`,
                borderColor: getEmployeeBorderColor(employee)
            });
            totalMonthHoursByEmployee[employee] += weeklyHours;
        });
        recapData.push({
            employee,
            week: `Total mois pour ${employee}`,
            hours: `${totalMonthHoursByEmployee[employee].toFixed(1)} h`,
            borderColor: [200, 200, 200]
        });
    });

    console.log('MonthlyRecapModals: Generated recap data:', recapData);

    const exportToPDF = () => {
        console.log('MonthlyRecapModals: Exporting to PDF');
        const doc = new jsPDF();
        doc.setFont('Roboto', 'normal');
        doc.text(
            `Récapitulatif mensuel ${showMonthlyRecapModal ? `- ${selectedShop}` : `de ${selectedEmployeeForMonthlyRecap}`}`,
            10,
            10
        );
        doc.autoTable({
            head: [['Employé', 'Semaine', 'Heures']],
            body: recapData.map(row => [row.employee, row.week, row.hours]),
            startY: 20,
            styles: { font: 'Roboto', fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            bodyStyles: { textColor: [51, 51, 51] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 80 },
                2: { cellWidth: 30 }
            },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    const rowIndex = data.row.index;
                    data.cell.styles.lineWidth = 0.5;
                    data.cell.styles.lineColor = recapData[rowIndex].borderColor;
                }
            }
        });
        doc.save(`recap_monthly_${showMonthlyRecapModal ? 'shop' : `employee_${selectedEmployeeForMonthlyRecap}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        console.log('MonthlyRecapModals: PDF exported successfully');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Récapitulatif mensuel {showMonthlyRecapModal ? `- ${selectedShop}` : `de ${selectedEmployeeForMonthlyRecap}`}
                </h2>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Employé</th>
                            <th>Semaine</th>
                            <th>Heures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((row, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={row.week.includes('Total mois') ? 'total-row' : getEmployeeColorClass(row.employee)}
                                    style={{ borderLeft: `4px solid ${row.borderColor.map(c => c.toString(16).padStart(2, '0')).join('')}` }}
                                >
                                    <td>{row.employee}</td>
                                    <td>{row.week}</td>
                                    <td>{row.hours}</td>
                                </tr>
                                {row.week.includes('Total mois') && index < recapData.length - 1 && (
                                    <tr className="spacer-row">
                                        <td colSpan="3" style={{ height: '10px', background: 'transparent' }}></td>
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