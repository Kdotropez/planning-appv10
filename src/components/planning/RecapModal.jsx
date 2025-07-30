import React from 'react';
import { format, addDays, addMinutes, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import Button from '../common/Button';
import { calculateEmployeeDailyHours } from '../../utils/planningUtils';
import { loadFromLocalStorage } from '../../utils/localStorage'; // Correction de l'importation
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
  shops // Prop shops requis pour multi-boutiques
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
    [230, 240, 250], // #e6f0fa
    [230, 255, 237], // #e6ffed
    [255, 230, 230], // #ffe6e6
    [208, 240, 250], // #d0f0fa
    [240, 230, 250], // #f0e6fa
    [255, 253, 230], // #fffde6
    [214, 230, 255]  // #d6e6ff
  ];

  const getDayColorClass = (dayIndex) => {
    const colors = ['day-0', 'day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6'];
    return colors[dayIndex % colors.length];
  };

  const getDayBackgroundColor = (dayIndex) => {
    return pastelColors[dayIndex % pastelColors.length];
  };

  const formatTimeRange = (employee, dayKey, timeSlots, shopId, shopName) => {
    console.log(`RecapModal: Formatting time range for ${employee} on ${dayKey} in shop ${shopId}`, { timeSlots });
    const weekPlanning = loadFromLocalStorage(`planning_${shopId}_${selectedWeek}`, {});
    if (!weekPlanning[employee]?.[dayKey] || weekPlanning[employee][dayKey].every(slot => !slot)) {
      return { start: 'Congé ☀️', pause: '', resume: '', end: '', hours: '0.0 h', shop: shopName || 'Plage' };
    }

    let start = null, pause = null, resume = null, end = null;
    let inShift = false;

    for (let index = 0; index < timeSlots.length; index++) {
      const isChecked = weekPlanning[employee][dayKey][index];
      const slot = timeSlots[index];
      console.log(`RecapModal: Processing slot ${slot} at index ${index}, isChecked: ${isChecked}, inShift: ${inShift}, start: ${start}, pause: ${pause}, resume: ${resume}, end: ${end}`);
      
      if (isChecked && !inShift && !start) {
        start = slot ? `${slot} H` : '-';
        inShift = true;
      } else if (!isChecked && inShift && !pause) {
        pause = slot ? `${slot} H` : '-';
        inShift = false;
      } else if (isChecked && !inShift && pause && !resume) {
        resume = slot ? `${slot} H` : '-';
        inShift = true;
      } else if (!isChecked && inShift && resume) {
        end = slot ? `${slot} H` : '-';
        inShift = false;
      } else if (isChecked && index === timeSlots.length - 1) {
        end = format(addMinutes(parse(slot, 'HH:mm', new Date()), config.interval), 'HH:mm') + ' H';
      }
    }

    if (inShift && !end) {
      end = format(addMinutes(parse(timeSlots[timeSlots.length - 1], 'HH:mm', new Date()), config.interval), 'HH:mm') + ' H';
    }

    const hours = calculateEmployeeDailyHours(employee, dayKey, weekPlanning, config);
    console.log(`RecapModal: Time range for ${employee} on ${dayKey} in shop ${shopId}:`, { start, pause, resume: resume || '-', end, hours });
    return {
      start: start || '-',
      pause: pause || '-',
      resume: resume || '-',
      end: end || '-',
      hours: `${hours.toFixed(1)} h`,
      shop: shopName
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
        const { start, pause, resume, end, hours, shop } = formatTimeRange(employee, dayKey, config.timeSlots, selectedShop, selectedShop);
        dayData.employees.push({
          employee,
          start,
          pause,
          resume,
          end,
          hours,
          shop
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
      let added = false;
      shops.forEach(shop => {
        const { start, pause, resume, end, hours, shop: shopName } = formatTimeRange(employee, dayKey, config.timeSlots, shop.id, shop.name);
        if (hours !== '0.0 h') {
          recapData.push({
            day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
            employees: [{
              employee,
              start,
              pause,
              resume,
              end,
              hours,
              shop: shopName
            }],
            dayIndex: index
          });
          totalWeekHours += parseFloat(hours);
          added = true;
        }
      });
      if (!added) {
        recapData.push({
          day: `${day.name} ${format(addDays(new Date(selectedWeek), index), 'dd/MM', { locale: fr })}`,
          employees: [{
            employee,
            start: 'Congé ☀️',
            pause: '',
            resume: '',
            end: '',
            hours: '0.0 h',
            shop: 'Plage'
          }],
          dayIndex: index
        });
      }
    });
  } else {
    console.log('RecapModal: Generating data for employee day recap');
    const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
    const { start, pause, resume, end, hours, shop } = formatTimeRange(employee, dayKey, config.timeSlots, selectedShop, selectedShop);
    recapData.push({
      day: `${days[currentDay].name} ${format(addDays(new Date(selectedWeek), currentDay), 'dd/MM', { locale: fr })}`,
      employees: [{
        employee,
        start,
        pause,
        resume,
        end,
        hours,
        shop
      }],
      dayIndex: currentDay
    });
  }

  console.log('RecapModal: Generated recap data:', recapData);

  const exportToPDF = () => {
    console.log('RecapModal: Exporting to PDF for', { showRecapModal, employee });
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'normal');
    const title = isWeekRecap
      ? `Récapitulatif hebdomadaire - ${selectedShop} (${totalWeekHours.toFixed(1)} h)`
      : isEmployeeWeekRecap
      ? `Récapitulatif de ${employee} ${totalWeekHours.toFixed(1)} h`
      : `Récapitulatif de ${employee}`;
    doc.text(title, 10, 10);
    const weekStart = format(new Date(selectedWeek), 'dd/MM', { locale: fr });
    const weekEnd = format(addDays(new Date(selectedWeek), 6), 'dd/MM', { locale: fr });
    doc.text(`Semaine du Lundi ${weekStart} au Dimanche ${weekEnd}`, 10, 20);
    const body = [];
    recapData.forEach(dayData => {
      if (dayData.employees.length > 0) {
        dayData.employees.forEach((emp, empIndex) => {
          body.push({
            row: [dayData.day, emp.shop, emp.start, emp.pause, emp.resume, emp.end, emp.hours],
            backgroundColor: getDayBackgroundColor(dayData.dayIndex)
          });
          if (empIndex === 0) dayData.day = '';
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
      head: [['Jour', 'Boutique', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures effectives']],
      body: body.map(item => item.row),
      startY: 30,
      styles: { font: 'Helvetica', fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      bodyStyles: { textColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 30, halign: 'left' },
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

  const exportToExcel = () => {
    console.log('RecapModal: Exporting to Excel for', { showRecapModal, employee });
    const wsData = [
      ['Jour', 'Boutique', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures effectives'],
      ...recapData.flatMap(dayData => 
        dayData.employees.map((emp, empIndex) => [
          empIndex === 0 ? dayData.day : '',
          emp.shop,
          emp.start,
          emp.pause,
          emp.resume,
          emp.end,
          emp.hours
        ])
      )
    ];
    if (isWeekRecap || isEmployeeWeekRecap) {
      wsData.push(['Total semaine', '', '', '', '', '', `${totalWeekHours.toFixed(1)} h`]);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recap');
    XLSX.write(wb, `recap_${isWeekRecap ? 'weekly' : isEmployeeWeekRecap ? `employee_week_${employee}` : `employee_day_${employee}`}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    console.log('RecapModal: Excel exported successfully');
  };

  const exportAsImagePdf = async () => {
    console.log('RecapModal: Starting PDF export as image');
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
      pdf.save(`recap_${isWeekRecap ? 'weekly' : isEmployeeWeekRecap ? `employee_week_${employee}` : `employee_day_${employee}`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      console.log('RecapModal: PDF exported successfully as image');
    } catch (error) {
      console.error('RecapModal: PDF export failed', error);
      alert(`Erreur lors de l'exportation PDF : ${error.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
          {isWeekRecap
            ? `Récapitulatif hebdomadaire - ${selectedShop} (${totalWeekHours.toFixed(1)} h)`
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
              <th className="align-left">Jour</th>
              <th className="align-left">Boutique</th>
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
                    <td className="align-left">{empIndex === 0 ? dayData.day : ''}</td>
                    <td className="align-left">{emp.shop}</td>
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
                <td className="align-left">Total semaine</td>
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
          <Button className="button-pdf" onClick={exportToExcel}>
            Exporter en Excel
          </Button>
          <Button className="button-pdf" onClick={exportAsImagePdf}>
            Exporter en PDF (image fidèle)
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