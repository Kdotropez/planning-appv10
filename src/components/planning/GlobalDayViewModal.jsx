import React from 'react';
import { format, addDays, addMinutes, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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
        close = format(addMinutes(parse(timeSlots[i], 'HH:mm', new Date()), config.interval), 'HH:mm');
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

  console.log('GlobalDayViewModal: Generated table data:', JSON.stringify(tableData, null, 2));

  const legend = 'Légende : 0 = ⚠️ Aucun employé, 1 = 1 employé, 2 = 2 employés, 3 = 3 employés ou plus';

  const exportToPDF = () => {
    console.log('GlobalDayViewModal: Exporting to PDF');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('Helvetica', 'normal');
    doc.text(`Vue globale par jour - ${selectedShop}`, 10, 10);
    doc.text(`Semaine du Lundi ${format(new Date(selectedWeek), 'dd/MM', { locale: fr })} au Dimanche ${format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr })}`, 10, 20);
    doc.text(legend, 10, 30);
    const body = tableData.map(dayData => [
      dayData.day,
      dayData.openClose,
      ...dayData.slots.map(slot => slot.display)
    ]);
    doc.autoTable({
      head: [['Jour', 'Tranche', ...timeSlots]],
      body,
      startY: 40,
      styles: { font: 'Helvetica', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      bodyStyles: { textColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`global_day_view_${selectedShop}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    console.log('GlobalDayViewModal: PDF exported successfully');
  };

  const exportToExcel = () => {
    console.log('GlobalDayViewModal: Exporting to Excel');
    const wsData = [
      ['Jour', 'Tranche', ...timeSlots],
      ...tableData.map(dayData => [
        dayData.day,
        dayData.openClose,
        ...dayData.slots.map(slot => slot.display)
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Global Day View');
    XLSX.write(wb, `global_day_view_${selectedShop}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    console.log('GlobalDayViewModal: Excel exported successfully');
  };

  const exportGlobalAsImagePdf = async () => {
    console.log('GlobalDayViewModal: Starting PDF export as image');
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
        let currentX = 0;
        let pageCount = 0;
        while (currentX < imgWidth) {
          if (pageCount > 0) pdf.addPage();
          const sliceWidth = maxWidth / ratio;
          pdf.addImage(imgData, 'PNG', margin, margin, maxWidth, Math.min(scaledHeight, maxHeight), null, 'FAST', 0, currentX);
          currentX += sliceWidth;
          pageCount++;
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
      }
      pdf.save(`global_day_view_${selectedShop}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      console.log('GlobalDayViewModal: PDF exported successfully');
    } catch (error) {
      console.error('GlobalDayViewModal: PDF export failed', error);
      alert(`Erreur lors de l'exportation PDF : ${error.message || 'Erreur inconnue'}`);
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
                    <span>{format(addMinutes(parse(slot, 'HH:mm', new Date()), config.interval), 'HH:mm')}</span>
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
          <Button className="button-pdf" onClick={exportToExcel}>
            Exporter en Excel
          </Button>
          <Button className="button-pdf" onClick={exportGlobalAsImagePdf}>
            Exporter en PDF (image fidèle)
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