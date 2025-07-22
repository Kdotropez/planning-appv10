import React from 'react';
import { format, addDays, addMinutes, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Button from '../common/Button';
import '@/assets/styles.css';

const GlobalDayViewModal = ({
    showGlobalDayViewModal,
    setShowGlobalDayViewModal,
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning
}) => {
    if (!showGlobalDayViewModal) {
        console.log('GlobalDayViewModal: No modal to show');
        return null;
    }

    const days = config.days || [
        { name: 'Lundi' },
        { name: 'Mardi' },
        { name: 'Mercredi' },
        { name: 'Jeudi' },
        { name: 'Vendredi' },
        { name: 'Samedi' },
        { name: 'Dimanche' }
    ];

    const timeSlots = config.timeSlots || [];

    const getEmployeesInSlot = (dayKey, slotIndex) => {
        console.log(`GlobalDayViewModal: Checking employees for ${dayKey}, slot ${slotIndex}`);
        const employees = selectedEmployees.filter(emp => 
            planning[emp]?.[dayKey]?.[slotIndex]
        );
        const count = employees.length;
        return {
            count,
            display: slotIndex === 0 && count === 0 ? '' : count === 0 ? '⚠️ 0' : count >= 3 ? '3' : count.toString(),
            className: count === 0 ? 'no-employee' : 
                      count === 1 ? 'single-employee' : 
                      count === 2 ? 'two-employees' : 'multiple-employees'
        };
    };

    const getDayOpenClose = (dayKey) => {
        let open = null, close = null;
        for (let i = 0; i < timeSlots.length; i++) {
            const employees = getEmployeesInSlot(dayKey, i);
            if (employees.count > 0 && !open) {
                open = timeSlots[i];
            }
            if (employees.count > 0) {
                close = format(addMinutes(parse(timeSlots[i], 'HH:mm', new Date()), 30), 'HH:mm');
            }
        }
        return { open: open || 'Fermé', close: close || 'Fermé' };
    };

    const tableData = days.map((day, index) => {
        const dayKey = format(addDays(new Date(selectedWeek), index), 'yyyy-MM-dd');
        const { open, close } = getDayOpenClose(dayKey);
        return {
            day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
            slots: timeSlots.map((_, slotIndex) => getEmployeesInSlot(dayKey, slotIndex)),
            openClose: `O: ${open}, F: ${close}`
        };
    });

    console.log('GlobalDayViewModal: Generated table data:', tableData);

    const legend = 'Légende : 0 = ⚠️ Aucun employé, 1 = 1 employé, 2 = 2 employés, 3 = 3 employés ou plus';

    const exportToPDF = () => {
        console.log('GlobalDayViewModal: Starting PDF export', { selectedShop, selectedWeek, timeSlots, selectedEmployees, tableData });
        try {
            if (!timeSlots.length) {
                throw new Error('Aucune tranche horaire disponible');
            }
            if (!selectedEmployees.length) {
                throw new Error('Aucun employé sélectionné');
            }
            if (!tableData.length) {
                throw new Error('Aucune donnée de tableau générée');
            }

            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFont('Roboto', 'normal');
            doc.text(`Vue globale par jour - ${selectedShop}`, 10, 10);
            const weekStart = format(new Date(selectedWeek), 'dd/MM', { locale: fr });
            const weekEnd = format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr });
            doc.text(`Semaine du Lundi ${weekStart} au Dimanche ${weekEnd}`, 10, 20);
            doc.text(legend, 10, 30);

            const body = [];
            tableData.forEach((dayData, dayIndex) => {
                const row = [
                    dayIndex === 0 ? dayData.day : '',
                    dayIndex === 0 ? dayData.openClose : '',
                    ...dayData.slots.map(slot => slot.display)
                ];
                body.push({
                    row,
                    backgroundColor: dayData.slots.map(slot => 
                        slot.count === 0 ? [255, 230, 230] :
                        slot.count === 1 ? [230, 255, 237] :
                        slot.count === 2 ? [230, 240, 250] : [240, 230, 250]
                    )
                });
            });

            console.log('GlobalDayViewModal: Generating PDF table with body:', body);

            doc.autoTable({
                head: [
                    ['Jour', 'Tranche', ...timeSlots],
                    ['', '', ...timeSlots.map(slot => format(addMinutes(parse(slot, 'HH:mm', new Date()), 30), 'HH:mm'))]
                ],
                body: body.map(item => item.row),
                startY: 40,
                styles: { font: 'Roboto', fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
                bodyStyles: { textColor: [51, 51, 51] },
                columnStyles: {
                    0: { cellWidth: 100 },
                    1: { cellWidth: 40 },
                    ...timeSlots.reduce((acc, _, index) => {
                        acc[index + 2] = { cellWidth: 30 };
                        return acc;
                    }, {})
                },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        const rowIndex = data.row.index;
                        const colIndex = data.column.index;
                        if (colIndex >= 2) {
                            data.cell.styles.fillColor = body[rowIndex].backgroundColor[colIndex - 2];
                        }
                        if (colIndex === 0 && data.cell.text[0]) {
                            data.cell.styles.lineWidth = 0.5;
                            data.cell.styles.lineColor = [200, 200, 200];
                        }
                    }
                },
                didDrawPage: (data) => {
                    console.log('GlobalDayViewModal: Drawing PDF page');
                    const tableStartY = data.table.startY;
                    const tableBody = data.table.body;
                    let currentY = tableStartY + data.table.headHeight;
                    tableBody.forEach((row, index) => {
                        if (index > 0) {
                            doc.setDrawColor(200, 200, 200);
                            doc.line(10, currentY, doc.internal.pageSize.width - 10, currentY);
                        }
                        currentY += data.table.rows[index].height;
                    });
                }
            });

            doc.save(`global_day_view_${selectedShop}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            console.log('GlobalDayViewModal: PDF exported successfully');
        } catch (error) {
            console.error('GlobalDayViewModal: PDF export failed', error);
            alert(`Erreur lors de l'exportation PDF : ${error.message}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Vue globale par jour - {selectedShop}
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    Semaine du Lundi {format(new Date(selectedWeek), 'dd/MM', { locale: fr })} au Dimanche {format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr })}
                </p>
                <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px', fontSize: '14px', color: '#333' }}>
                    {legend}
                </p>
                <div className="table-container">
                    <table className="global-day-table">
                        <thead>
                            <tr>
                                <th className="fixed-col header" rowSpan="2">Jour</th>
                                <th className="fixed-col header" rowSpan="2">Tranche</th>
                                {timeSlots.map((slot, index) => (
                                    <th key={index} className="scrollable-col header">
                                        <span>{slot}</span>
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {timeSlots.map((slot, index) => (
                                    <th key={index} className="scrollable-col header">
                                        <span>{format(addMinutes(parse(slot, 'HH:mm', new Date()), 30), 'HH:mm')}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((dayData, dayIndex) => (
                                <React.Fragment key={dayIndex}>
                                    <tr className="day-group">
                                        <td className="fixed-col">{dayData.day}</td>
                                        <td className="fixed-col">{dayData.openClose}</td>
                                        {dayData.slots.map((slot, slotIndex) => (
                                            <td key={slotIndex} className={`scrollable-col ${slot.className}`}>
                                                {slot.display}
                                            </td>
                                        ))}
                                    </tr>
                                    {dayIndex < tableData.length - 1 && (
                                        <tr className="day-divider">
                                            <td colSpan={timeSlots.length + 2} style={{ borderTop: '2px solid #ccc' }}></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="button-group" style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <Button className="button-pdf" onClick={exportToPDF}>
                        Exporter en PDF
                    </Button>
                    <Button
                        className="modal-close"
                        onClick={() => {
                            console.log('GlobalDayViewModal: Closing modal');
                            setShowGlobalDayViewModal(false);
                        }}
                    >
                        ✕
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GlobalDayViewModal;