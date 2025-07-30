import React from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import Button from '../common/Button';
import { calculateEmployeeDailyHours } from '../../utils/planningUtils';
import '@/assets/styles.css';

const EmployeeMonthlyDetailModal = ({
  showEmployeeMonthlyDetail,
  setShowEmployeeMonthlyDetail,
  config,
  selectedShop,
  selectedWeek,
  selectedEmployeeForMonthlyDetail,
  shops,
  employees,
  planningData
}) => {
  console.log('EmployeeMonthlyDetailModal: Rendered with props', {
    showEmployeeMonthlyDetail,
    selectedShop,
    selectedWeek,
    selectedEmployeeForMonthlyDetail,
    shops,
    config: config ? { timeSlotsLength: config.timeSlots?.length } : null
  });

  // Si la modale ne doit pas être affichée, ne rien rendre
  if (!showEmployeeMonthlyDetail) {
    return null;
  }

  // Fonction pour obtenir le nom de l'employé
  const getEmployeeName = (employeeId) => {
    if (!employees || !Array.isArray(employees)) return employeeId;
    const employee = employees.find(emp => emp.id === employeeId || emp === employeeId);
    return employee ? (employee.name || employee) : employeeId;
  };

  const employeeName = getEmployeeName(selectedEmployeeForMonthlyDetail);

  // Obtenir le premier et dernier jour du mois de la semaine sélectionnée
  const weekDate = new Date(selectedWeek);
  const firstDayOfMonth = startOfMonth(weekDate);
  const lastDayOfMonth = endOfMonth(weekDate);

  // Obtenir tous les jours du mois
  const allDaysOfMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  // Obtenir les boutiques où l'employé a des données de planning
  const getEmployeeShops = () => {
    if (!planningData?.shops) return [];
    
    const employeeShops = new Map();
    planningData.shops.forEach(shop => {
      if (shop.weeks) {
        // Vérifier si l'employé a des données de planning dans cette boutique
        let hasPlanningData = false;
        Object.keys(shop.weeks).forEach(weekKey => {
          const weekData = shop.weeks[weekKey];
          if (weekData.planning && weekData.planning[selectedEmployeeForMonthlyDetail]) {
            hasPlanningData = true;
          }
        });
        
        if (hasPlanningData) {
          employeeShops.set(shop.id, shop.name || shop.id);
        }
      }
    });
    
    return Array.from(employeeShops.entries()).map(([id, name]) => ({ id, name }));
  };

     const employeeShops = getEmployeeShops();

  

  // Obtenir les données de planning pour cet employé (toutes les boutiques)
  const getAllEmployeePlanning = () => {
    const allPlanning = {};
    
    planningData?.shops?.forEach(shop => {
      if (shop.weeks) {
        Object.keys(shop.weeks).forEach(weekKey => {
          const weekData = shop.weeks[weekKey];
          if (weekData.planning && weekData.planning[selectedEmployeeForMonthlyDetail]) {
            // Ajouter l'ID de la boutique aux données
            Object.keys(weekData.planning[selectedEmployeeForMonthlyDetail]).forEach(dayStr => {
              if (!allPlanning[dayStr]) {
                allPlanning[dayStr] = {};
              }
              allPlanning[dayStr][shop.id] = weekData.planning[selectedEmployeeForMonthlyDetail][dayStr];
            });
          }
        });
      }
    });
    
    return allPlanning;
  };

  const allEmployeePlanning = getAllEmployeePlanning();

  // Calculer les heures totales du mois (toutes boutiques)
  const calculateTotalMonthHours = () => {
    let totalHours = 0;
    allDaysOfMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayPlanning = allEmployeePlanning[dayStr];
      if (dayPlanning) {
        Object.keys(dayPlanning).forEach(shopId => {
          const hours = calculateEmployeeDailyHours(selectedEmployeeForMonthlyDetail, dayStr, { [selectedEmployeeForMonthlyDetail]: { [dayStr]: dayPlanning[shopId] } }, config);
          totalHours += hours;
        });
      }
    });
    return totalHours.toFixed(1);
  };

  // Calculer les heures par boutique
  const calculateShopHours = (shopId) => {
    let totalHours = 0;
    allDaysOfMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayPlanning = allEmployeePlanning[dayStr];
      if (dayPlanning && dayPlanning[shopId]) {
        const hours = calculateEmployeeDailyHours(selectedEmployeeForMonthlyDetail, dayStr, { [selectedEmployeeForMonthlyDetail]: { [dayStr]: dayPlanning[shopId] } }, config);
        totalHours += hours;
      }
    });
    return totalHours.toFixed(1);
  };

  // Obtenir le nom du jour
  const getDayName = (date) => {
    return format(date, 'EEEE', { locale: fr });
  };

  // Obtenir la boutique pour un jour donné
  const getShopForDay = (date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayPlanning = allEmployeePlanning[dayStr];
    if (!dayPlanning) return null;
    
    // Retourner la première boutique trouvée (normalement une seule par jour)
    const shopId = Object.keys(dayPlanning)[0];
    return shopId ? employeeShops.find(s => s.id === shopId) : null;
  };

  // Vérifier si un créneau est sélectionné
  const isSlotSelected = (date, slotIndex) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayPlanning = allEmployeePlanning[dayStr];
    if (!dayPlanning) return false;
    
    // Vérifier dans toutes les boutiques du jour
    return Object.values(dayPlanning).some(slots => slots && slots[slotIndex]);
  };

  // Calculer les heures d'un jour
  const calculateDayHours = (date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayPlanning = allEmployeePlanning[dayStr];
    if (!dayPlanning) return 0;
    
    let totalHours = 0;
    Object.values(dayPlanning).forEach(slots => {
      if (slots) {
        totalHours += calculateEmployeeDailyHours(selectedEmployeeForMonthlyDetail, dayStr, { [selectedEmployeeForMonthlyDetail]: { [dayStr]: slots } }, config);
      }
    });
    return totalHours;
  };

  // Vérifier si un jour est en congé (aucun créneau sélectionné)
  const isDayOff = (date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayPlanning = allEmployeePlanning[dayStr];
    return !dayPlanning || Object.values(dayPlanning).every(slots => !slots || slots.every(slot => !slot));
  };

  // Calculer les heures de travail pour un jour
  const calculateWorkHours = (date) => {
    if (isDayOff(date)) return { entry: null, pause: null, return: null, exit: null, hours: 0 };
    
    const selectedSlots = [];
    for (let i = 0; i < config.timeSlots.length; i++) {
      if (isSlotSelected(date, i)) {
        selectedSlots.push({
          index: i,
          start: config.timeSlots[i].split('-')[0],
          end: config.timeSlots[i].split('-')[1]
        });
      }
    }
    
    if (selectedSlots.length === 0) return { entry: null, pause: null, return: null, exit: null, hours: 0 };
    
    // Trier par index pour avoir l'ordre chronologique
    selectedSlots.sort((a, b) => a.index - b.index);
    
    const entry = selectedSlots[0].start;
    const exit = selectedSlots[selectedSlots.length - 1].end;
    
    // Détecter les pauses (gaps entre créneaux)
    let pause = null;
    let returnTime = null;
    
    for (let i = 0; i < selectedSlots.length - 1; i++) {
      const currentEnd = selectedSlots[i].end;
      const nextStart = selectedSlots[i + 1].start;
      
      if (currentEnd !== nextStart) {
        pause = currentEnd;
        returnTime = nextStart;
        break;
      }
    }
    
    return { entry, pause, return: returnTime, exit, hours: calculateDayHours(date) };
  };

  const exportToPDF = () => {
    console.log('EmployeeMonthlyDetailModal: Exporting to PDF');
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'normal');
    const title = `Récapitulatif mensuel détaillé pour ${employeeName} (${calculateTotalMonthHours()} H)`;
    doc.text(title, 10, 10);
    doc.text(`Mois de ${format(firstDayOfMonth, 'MMMM yyyy', { locale: fr })}`, 10, 20);
    
         const columns = ['Jour', 'BOUTIQUE', 'ENTRÉE', 'PAUSE', 'RETOUR', 'SORTIE', 'Heures'];
    const body = [];
    
    // Grouper les jours par semaine
    const weeks = {};
    allDaysOfMonth.forEach((date, index) => {
      const weekNumber = getWeekOfDate(date);
      if (!weeks[weekNumber]) {
        weeks[weekNumber] = [];
      }
      weeks[weekNumber].push({ date, index });
    });
    
    Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weekNumber => {
      const weekDays = weeks[weekNumber];
      const weekTitle = getWeekTitle(weekDays[0].date);
      
             // Ligne d'en-tête de semaine
       body.push([weekTitle, '', '', '', '', '', '']);
      
      // Jours de la semaine
      weekDays.forEach(({ date }) => {
        const dayName = getDayName(date);
        const dayDate = format(date, 'dd/MM', { locale: fr });
        const isOff = isDayOff(date);
        const workHours = calculateWorkHours(date);
        const shopForDay = getShopForDay(date);
        
                 body.push([
           `${dayName} ${dayDate}`,
           isOff ? 'Congé ☀️' : (shopForDay ? shopForDay.name : '-'),
           isOff ? '-' : (workHours.entry ? `${workHours.entry} H` : '-'),
           isOff ? '-' : (workHours.pause ? `${workHours.pause} H` : '-'),
           isOff ? '-' : (workHours.return ? `${workHours.return} H` : '-'),
           isOff ? '-' : (workHours.exit ? `${workHours.exit} H` : '-'),
           isOff ? '0.0 h' : `${workHours.hours} h`
         ]);
      });
    });
    
         // Totaux par boutique
     employeeShops.forEach((shop) => {
       body.push([`TOTAL ${shop.name}`, '', '', '', '', '', `${calculateShopHours(shop.id)} H`]);
     });
     
     // Total général
     body.push(['Total mois', '', '', '', '', '', `${calculateTotalMonthHours()} H`]);
    
    doc.autoTable({
      head: [columns],
      body: body,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 136, 229] }
    });
    doc.save(`monthly_detail_${employeeName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    console.log('EmployeeMonthlyDetailModal: PDF exported successfully');
  };

  const exportToExcel = () => {
    console.log('EmployeeMonthlyDetailModal: Exporting to Excel');
    const data = [];
    
    // Grouper les jours par semaine
    const weeks = {};
    allDaysOfMonth.forEach((date, index) => {
      const weekNumber = getWeekOfDate(date);
      if (!weeks[weekNumber]) {
        weeks[weekNumber] = [];
      }
      weeks[weekNumber].push({ date, index });
    });
    
    Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weekNumber => {
      const weekDays = weeks[weekNumber];
      const weekTitle = getWeekTitle(weekDays[0].date);
      
             // Ligne d'en-tête de semaine
       data.push({
         'Jour': weekTitle,
         'BOUTIQUE': '',
         'ENTRÉE': '',
         'PAUSE': '',
         'RETOUR': '',
         'SORTIE': '',
         'Heures': ''
       });
      
      // Jours de la semaine
      weekDays.forEach(({ date }) => {
        const dayName = getDayName(date);
        const dayDate = format(date, 'dd/MM', { locale: fr });
        const isOff = isDayOff(date);
        const workHours = calculateWorkHours(date);
        const shopForDay = getShopForDay(date);
        
                 data.push({
           'Jour': `${dayName} ${dayDate}`,
           'BOUTIQUE': isOff ? 'Congé ☀️' : (shopForDay ? shopForDay.name : '-'),
           'ENTRÉE': isOff ? '-' : (workHours.entry ? `${workHours.entry} H` : '-'),
           'PAUSE': isOff ? '-' : (workHours.pause ? `${workHours.pause} H` : '-'),
           'RETOUR': isOff ? '-' : (workHours.return ? `${workHours.return} H` : '-'),
           'SORTIE': isOff ? '-' : (workHours.exit ? `${workHours.exit} H` : '-'),
           'Heures': isOff ? '0.0 h' : `${workHours.hours} h`
         });
      });
    });
    
         // Totaux par boutique
     employeeShops.forEach((shop) => {
       data.push({
         'Jour': `TOTAL ${shop.name}`,
         'BOUTIQUE': '',
         'ENTRÉE': '',
         'PAUSE': '',
         'RETOUR': '',
         'SORTIE': '',
         'Heures': `${calculateShopHours(shop.id)} H`
       });
     });
     
     // Total général
     data.push({
       'Jour': 'Total mois',
       'BOUTIQUE': '',
       'ENTRÉE': '',
       'PAUSE': '',
       'RETOUR': '',
       'SORTIE': '',
       'Heures': `${calculateTotalMonthHours()} H`
     });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Récapitulatif mensuel détaillé');
    XLSX.writeFile(wb, `monthly_detail_${employeeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    console.log('EmployeeMonthlyDetailModal: Excel exported successfully');
  };

  const exportAsImagePdf = async () => {
    console.log('EmployeeMonthlyDetailModal: Exporting to PDF as image');
    try {
      const element = document.querySelector('.modal-content');
      if (!element) {
        throw new Error('Modal content not found');
      }
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`monthly_detail_${employeeName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      console.log('EmployeeMonthlyDetailModal: PDF exported successfully as image');
    } catch (error) {
      console.error('EmployeeMonthlyDetailModal: PDF export failed', error);
      alert(`Erreur lors de l'exportation PDF : ${error.message || 'Erreur inconnue'}`);
    }
  };

  if (!config?.timeSlots?.length) {
    return (
      <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="modal-content">
          <button
            className="modal-close"
            onClick={() => {
              console.log('EmployeeMonthlyDetailModal: Closing modal via cross');
              setShowEmployeeMonthlyDetail(false);
            }}
            style={{ color: '#dc3545', fontSize: '18px' }}
          >
            ✕
          </button>
          <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
            Erreur
          </h3>
          <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
            Aucune configuration de tranches horaires disponible.
          </p>
          <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
            <Button
              className="button-retour"
              onClick={() => {
                console.log('EmployeeMonthlyDetailModal: Closing modal via button');
                setShowEmployeeMonthlyDetail(false);
              }}
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalHours = calculateTotalMonthHours();

  // Couleurs pastel différentes pour chaque semaine
  const weekColors = [
    '#E3F2FD', // Light Blue - Semaine 1
    '#E8F5E8', // Light Green - Semaine 2
    '#FFEBEE', // Light Red - Semaine 3
    '#F3E5F5', // Light Purple - Semaine 4
    '#FFF8E1', // Light Yellow - Semaine 5
    '#E1F5FE', // Light Cyan - Semaine 6
    '#F1F8E9', // Light Lime - Semaine 7
    '#FFF3E0', // Light Orange - Semaine 8
  ];

  // Fonction pour obtenir la semaine d'une date (semaine du lundi au dimanche)
  const getWeekOfDate = (date) => {
    // Calculer le dimanche de la semaine de cette date
    const dayOfWeek = date.getDay();
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sundayOfWeek = new Date(date);
    sundayOfWeek.setDate(date.getDate() + daysToSunday);
    
    // Calculer le premier dimanche du mois
    const monthStart = startOfMonth(new Date(date));
    const firstSundayOfMonth = new Date(monthStart);
    const daysToFirstSunday = monthStart.getDay() === 0 ? 0 : 7 - monthStart.getDay();
    firstSundayOfMonth.setDate(monthStart.getDate() + daysToFirstSunday);
    
    // Calculer le numéro de semaine basé sur les dimanches
    const diffTime = sundayOfWeek.getTime() - firstSundayOfMonth.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    
    return Math.max(0, weekNumber);
  };

  // Fonction pour obtenir le titre de la semaine
  const getWeekTitle = (date) => {
    const mondayOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    mondayOfWeek.setDate(date.getDate() - daysToMonday);
    
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
    
    return `Semaine du ${format(mondayOfWeek, 'd MMMM', { locale: fr })} au ${format(sundayOfWeek, 'd MMMM yyyy', { locale: fr })}`;
  };

     return (
     <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
       <div className="modal-content" style={{ 
         maxHeight: '80vh', 
         overflowY: 'auto',
         '@media print': {
           maxHeight: 'none',
           overflowY: 'visible',
           backgroundColor: 'white',
           color: 'black'
         }
       }}>
        <button
          className="modal-close"
          onClick={() => {
            console.log('EmployeeMonthlyDetailModal: Closing modal via cross');
            setShowEmployeeMonthlyDetail(false);
          }}
          style={{ color: '#dc3545', fontSize: '18px' }}
        >
          ✕
        </button>
                 <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
           Récapitulatif mensuel détaillé pour {employeeName} ({calculateTotalMonthHours()} H)
         </h3>
         <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '20px' }}>
           Mois de {format(firstDayOfMonth, 'MMMM yyyy', { locale: fr })}
         </p>
        
                                   <table style={{ 
                    fontFamily: 'Roboto, sans-serif', 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: '10px',
                    tableLayout: 'fixed'
                  }}>
                        <thead>
               <tr style={{ backgroundColor: '#f0f0f0' }}>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '15%' }}>Jour</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '20%' }}>BOUTIQUE</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '12%' }}>ENTRÉE</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '12%' }}>PAUSE</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '12%' }}>RETOUR</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '12%' }}>SORTIE</th>
                 <th style={{ border: '1px solid #ddd', padding: '2px 3px', fontWeight: '700', fontSize: '9px', width: '17%' }}>Heures</th>
               </tr>
             </thead>
           <tbody>
             {(() => {
               // Grouper les jours par semaine
               const weeks = {};
               allDaysOfMonth.forEach((date, index) => {
                 const weekNumber = getWeekOfDate(date);
                 if (!weeks[weekNumber]) {
                   weeks[weekNumber] = [];
                 }
                 weeks[weekNumber].push({ date, index });
               });

               const rows = [];
               Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weekNumber => {
                 const weekDays = weeks[weekNumber];
                 const weekColor = weekColors[parseInt(weekNumber) % weekColors.length];
                 const weekTitle = getWeekTitle(weekDays[0].date);
                 
                                                     // Calculer le total de la semaine
                  const weekTotal = weekDays.reduce((total, { date }) => {
                    return total + calculateDayHours(date);
                  }, 0);
                  
                                     // Ajouter une ligne d'en-tête pour la semaine
                   rows.push(
                     <tr key={`week-${weekNumber}`} style={{ backgroundColor: weekColor }}>
                                               <td 
                          colSpan="6" 
                          style={{ 
                            border: '1px solid #ddd', 
                            padding: '3px 4px', 
                            fontWeight: '700', 
                            fontSize: '10px',
                            textAlign: 'center',
                            color: '#333'
                          }}
                        >
                          {weekTitle}
                        </td>
                        <td 
                          style={{ 
                            border: '1px solid #ddd', 
                            padding: '3px 4px', 
                            fontWeight: '700', 
                            fontSize: '10px',
                            textAlign: 'center',
                            color: '#333',
                            backgroundColor: '#f0f0f0'
                          }}
                        >
                          {weekTotal.toFixed(1)} h
                        </td>
                     </tr>
                   );
                  
                                     // Ajouter les jours de la semaine
                   weekDays.forEach(({ date, index }) => {
                     const dayName = getDayName(date);
                     const dayDate = format(date, 'dd/MM', { locale: fr });
                     const isOff = isDayOff(date);
                     const workHours = calculateWorkHours(date);
                     const shopForDay = getShopForDay(date);
                     
                                          rows.push(
                        <tr key={index} style={{
                          backgroundColor: weekColor
                        }}>
                                                    <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontWeight: '600', fontSize: '9px' }}>
                             {dayName} {dayDate}
                           </td>
                           <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontSize: '9px' }}>
                             {isOff ? (
                               <span style={{ color: '#FF9800', fontWeight: '600', fontSize: '8px' }}>
                                 Congé ☀️
                               </span>
                             ) : (
                               shopForDay ? shopForDay.name : '-'
                             )}
                           </td>
                           <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontSize: '9px' }}>
                             {isOff ? '-' : (workHours.entry ? `${workHours.entry} H` : '-')}
                           </td>
                           <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontSize: '9px' }}>
                             {isOff ? '-' : (workHours.pause ? `${workHours.pause} H` : '-')}
                           </td>
                           <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontSize: '9px' }}>
                             {isOff ? '-' : (workHours.return ? `${workHours.return} H` : '-')}
                           </td>
                           <td style={{ border: '1px solid #ddd', padding: '1px 2px', fontSize: '9px' }}>
                             {isOff ? '-' : (workHours.exit ? `${workHours.exit} H` : '-')}
                           </td>
                           <td style={{ 
                             border: '1px solid #ddd', 
                             padding: '1px 2px', 
                             fontWeight: '600',
                             fontSize: '9px',
                             color: isOff ? '#FF9800' : '#333'
                           }}>
                             {isOff ? '0.0 h' : `${workHours.hours} h`}
                           </td>
                        </tr>
                      );
                   });
               });
               
               return rows;
             })()}
                                          {/* Totaux par boutique */}
                               {employeeShops.map((shop) => (
                  <tr key={`total-${shop.id}`} style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                    <td colSpan="6" style={{ border: '1px solid #ddd', padding: '3px 4px', fontSize: '10px' }}>
                      TOTAL {shop.name}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '3px 4px', fontSize: '10px' }}>
                      {calculateShopHours(shop.id)} H
                    </td>
                  </tr>
                ))}
                
                {/* Total général */}
                <tr style={{ backgroundColor: '#e0e0e0', fontWeight: '700' }}>
                  <td colSpan="6" style={{ border: '1px solid #ddd', padding: '3px 4px', fontSize: '10px' }}>Total mois</td>
                  <td style={{ border: '1px solid #ddd', padding: '3px 4px', fontSize: '10px' }}>{calculateTotalMonthHours()} H</td>
                </tr>
           </tbody>
         </table>
        
                                                                       <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', flexWrap: 'wrap', gap: '10px' }}>
                           <Button className="button-pdf" onClick={() => {
                // Masquer les boutons avant l'impression
                const buttonGroup = document.querySelector('.button-group');
                const modalClose = document.querySelector('.modal-close');
                if (buttonGroup) {
                  buttonGroup.style.display = 'none';
                }
                if (modalClose) {
                  modalClose.style.display = 'none';
                }
                
                // Créer une nouvelle fenêtre pour l'impression
                const printWindow = window.open('', '_blank');
                const modalContent = document.querySelector('.modal-content');
                
                if (printWindow && modalContent) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Récapitulatif mensuel détaillé - ${employeeName}</title>
                      <style>
                        body {
                          font-family: 'Roboto', sans-serif;
                          margin: 0;
                          padding: 20px;
                          background-color: white;
                          color: black;
                        }
                        .print-content {
                          max-width: 100%;
                          margin: 0 auto;
                        }
                        table {
                          font-family: 'Roboto', sans-serif;
                          width: 100%;
                          border-collapse: collapse;
                          font-size: 10px;
                          table-layout: fixed;
                        }
                        th, td {
                          border: 1px solid #ddd;
                          padding: 1px 2px;
                          font-size: 8px;
                          line-height: 1.2;
                        }
                        th {
                          background-color: #f0f0f0;
                          font-weight: 700;
                          font-size: 9px;
                          padding: 2px 3px;
                        }
                        h3, p {
                          text-align: center;
                          margin: 10px 0;
                        }
                        @page {
                          margin: 10mm;
                          size: A4 portrait;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-content">
                        ${modalContent.innerHTML}
                      </div>
                    </body>
                    </html>
                  `);
                  
                  printWindow.document.close();
                  printWindow.focus();
                  
                  // Attendre que le contenu soit chargé puis imprimer
                  printWindow.onload = function() {
                    printWindow.print();
                    printWindow.close();
                  };
                } else {
                  // Fallback si la nouvelle fenêtre échoue
                  window.print();
                }
                
                // Remettre les boutons après l'impression
                setTimeout(() => {
                  if (buttonGroup) {
                    buttonGroup.style.display = 'flex';
                  }
                  if (modalClose) {
                    modalClose.style.display = 'block';
                  }
                }, 1000);
              }}>
                Imprimer
              </Button>
             <Button className="button-pdf" onClick={() => exportToPDF()}>
               Exporter en PDF
             </Button>
             <Button className="button-pdf" onClick={() => exportToExcel()}>
               Exporter en Excel
             </Button>
             <Button className="button-pdf" onClick={() => exportAsImagePdf()}>
               Exporter en PDF (image fidèle)
             </Button>
             <Button
               className="button-retour"
               onClick={() => {
                 console.log('EmployeeMonthlyDetailModal: Closing modal via button');
                 setShowEmployeeMonthlyDetail(false);
               }}
             >
               Fermer
             </Button>
           </div>
      </div>
    </div>
  );
};

export default EmployeeMonthlyDetailModal; 