import React from 'react';
import { format, addDays, startOfMonth, endOfMonth, isMonday, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import { calculateEmployeeDailyHours } from '../../utils/planningUtils';
import { loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const RecapButtons = ({
  selectedEmployees,
  currentShop,
  currentWeek,
  currentDay,
  showCalendarTotals,
  setShowRecapModal,
  setShowMonthlyRecapModal,
  setShowEmployeeMonthlyRecap,
  setShowEmployeeWeeklyRecap,
  setShowMonthlyDetailModal,
  setShowEmployeeMonthlyDetail,

  setSelectedEmployeeForMonthlyRecap,
  setSelectedEmployeeForWeeklyRecap,
  setSelectedEmployeeForMonthlyDetail,
  config,
  shops,
  currentShopEmployees,
  planning,
  planningData
}) => {

  const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];
  const monthDisplay = 'MM';



  // Fonction pour obtenir les semaines du mois
  const getMonthWeeks = (weekStart) => {
    const weeks = [];
    const startDate = new Date(weekStart);
    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(startDate);
    
    let currentWeek = new Date(monthStart);
    while (currentWeek <= monthEnd) {
      if (isMonday(currentWeek)) {
        weeks.push(new Date(currentWeek));
      }
      currentWeek = addDays(currentWeek, 1);
    }
    return weeks;
  };

  // Calculer les heures journalières pour un employé
  const calculateEmployeeDayHours = (employee) => {
    if (!currentWeek || !currentShop || !planning) return 0;
    // Utiliser le jour actuellement sélectionné dans l'interface
    const dayKey = format(addDays(new Date(currentWeek), currentDay || 0), 'yyyy-MM-dd');
    const hours = calculateEmployeeDailyHours(employee, dayKey, planning, config);
    return hours.toFixed(1);
  };

  // Calculer les heures hebdomadaires réelles pour un employé
  const calculateEmployeeWeekHours = (employee) => {
    if (!currentWeek || !currentShop || !planning) return 0;
    let totalHours = 0;
    for (let i = 0; i < 7; i++) {
      const dayKey = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
      const hours = calculateEmployeeDailyHours(employee, dayKey, planning, config);
      totalHours += hours;
    }
    return totalHours.toFixed(1);
  };

  // Calculer les heures mensuelles réelles pour un employé
  const calculateEmployeeMonthHours = (employee) => {
    if (!currentWeek || !planningData) return 0;
    
    // Pour l'instant, on utilise seulement la semaine actuelle
    // TODO: Implémenter le calcul mensuel complet multi-boutiques
    return calculateEmployeeWeekHours(employee);
  };

  // Calculer les heures mensuelles de la boutique actuelle
  const calculateGlobalMonthHours = () => {
    if (!currentWeek || !planningData || !currentShop) return 0;
    
    // Trouver la boutique actuelle
    const shop = planningData.shops.find(s => s.id === currentShop);
    if (!shop || !shop.config) return 0;
    
    // Obtenir le mois de la semaine actuelle
    const currentDate = new Date(currentWeek);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Obtenir toutes les semaines du mois
    const monthWeeks = getMonthWeeks(currentWeek);
    
    let totalMonthHours = 0;
    
    // Pour chaque semaine du mois
    monthWeeks.forEach(weekStart => {
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      // Récupérer le planning de cette semaine pour cette boutique
      const weekData = shop.weeks?.[weekKey];
      if (weekData && weekData.planning) {
        // Pour chaque employé de cette boutique
        shop.employees.forEach(employee => {
          if (weekData.planning[employee.id]) {
            // Calculer les heures de cette semaine pour cet employé
            let weekHours = 0;
            for (let i = 0; i < 7; i++) {
              const dayDate = format(addDays(weekStart, i), 'yyyy-MM-dd');
              const hours = calculateEmployeeDailyHours(employee.id, dayDate, weekData.planning, shop.config);
              weekHours += hours;
            }
            totalMonthHours += weekHours;
          }
        });
      }
    });
    
    return totalMonthHours.toFixed(1);
  };

  // Calculer les heures d'un employé dans une boutique spécifique
  const calculateEmployeeShopHours = (employee, shopId) => {
    if (!currentWeek || !planningData) return 0;
    
    const shop = planningData.shops.find(s => s.id === shopId);
    if (!shop || !shop.config) return 0;
    
    console.log(`Recherche données pour employé ${employee} dans boutique ${shopId}, semaine ${currentWeek}`);
    console.log(`Boutique trouvée:`, shop);
    console.log(`Semaines disponibles:`, Object.keys(shop.weeks || {}));
    
    // Récupérer le planning de cette boutique pour cette semaine
    const weekData = shop.weeks?.[currentWeek];
    console.log(`Données de semaine trouvées:`, weekData);
    
    if (!weekData || !weekData.planning) {
      console.log(`Aucune donnée trouvée pour la semaine ${currentWeek}`);
      return 0;
    }
    
    // Vérifier les données de l'employé spécifiquement
    const employeeData = weekData.planning[employee];
    console.log(`Données de l'employé ${employee} dans ${shopId}:`, employeeData);
    
    // Calculer les heures pour cette semaine dans cette boutique
    let totalHours = 0;
    for (let i = 0; i < 7; i++) {
      const dayDate = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
      const employeeData = weekData.planning[employee];
      const daySlots = employeeData?.[dayDate];
      console.log(`Jour ${dayDate} pour ${employee} dans ${shopId}:`, daySlots);
      const hours = calculateEmployeeDailyHours(employee, dayDate, weekData.planning, shop.config);
      totalHours += hours;
    }
    
    console.log(`Total heures calculé pour ${employee} dans ${shopId}: ${totalHours.toFixed(1)}`);
    return totalHours.toFixed(1);
  };

  // Calculer le total des heures d'un employé dans toutes ses boutiques
  const calculateEmployeeTotalMultiShopHours = (employee) => {
    if (!currentWeek || !planningData) return 0;
    
    const employeeShops = getEmployeeShops(employee);
    console.log(`Calcul total multi-boutiques pour ${employee}:`, employeeShops);
    
    if (employeeShops.length <= 1) {
      const weekHours = calculateEmployeeWeekHours(employee);
      console.log(`Employé dans une seule boutique, heures: ${weekHours}`);
      return weekHours;
    }
    
    let totalHours = 0;
    employeeShops.forEach(shop => {
      const shopHours = parseFloat(calculateEmployeeShopHours(employee, shop.id));
      console.log(`Heures dans ${shop.name}: ${shopHours}`);
      totalHours += shopHours;
    });
    
    console.log(`Total multi-boutiques pour ${employee}: ${totalHours.toFixed(1)}`);
    return totalHours.toFixed(1);
  };

  // Obtenir les boutiques où un employé travaille ET a des données
  const getEmployeeShops = (employee) => {
    if (!planningData || !currentWeek) return [];
    
    const employeeShops = new Map(); // Utiliser Map pour éviter les doublons
    
    // Parcourir toutes les boutiques
    for (const shop of planningData.shops) {
      const emp = shop.employees.find(e => e.id === employee);
      if (emp) {
        // Vérifier si l'employé a des données dans cette boutique pour la semaine actuelle
        const weekData = shop.weeks?.[currentWeek];
        if (weekData && weekData.planning && weekData.planning[employee]) {
                  // Vérifier si l'employé a réellement des heures dans cette boutique
        const employeeData = weekData.planning[employee];
        let hasHours = false;
        
        // Vérifier si l'employé a des créneaux cochés sur au moins un jour
        for (let i = 0; i < 7; i++) {
          const dayDate = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
          if (employeeData[dayDate] && Array.isArray(employeeData[dayDate])) {
            const trueSlots = employeeData[dayDate].filter(slot => slot === true).length;
            if (trueSlots > 0) {
              hasHours = true;
              break;
            }
          }
        }
        
        if (hasHours) {
          employeeShops.set(shop.id, {
            id: shop.id,
            name: shop.name
          });
        }
        }
        
        // Ajouter aussi les boutiques où il peut travailler ET a des données
        if (emp.canWorkIn && emp.canWorkIn.length > 0) {
          emp.canWorkIn.forEach(shopId => {
            const shopData = planningData.shops.find(s => s.id === shopId);
            if (shopData) {
              const canWorkWeekData = shopData.weeks?.[currentWeek];
              if (canWorkWeekData && canWorkWeekData.planning && canWorkWeekData.planning[employee]) {
                // Vérifier si l'employé a réellement des heures dans cette boutique
                const employeeData = canWorkWeekData.planning[employee];
                let hasHours = false;
                
                // Vérifier si l'employé a des créneaux cochés sur au moins un jour
                for (let i = 0; i < 7; i++) {
                  const dayDate = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
                  if (employeeData[dayDate] && Array.isArray(employeeData[dayDate])) {
                    const trueSlots = employeeData[dayDate].filter(slot => slot === true).length;
                    if (trueSlots > 0) {
                      hasHours = true;
                      break;
                    }
                  }
                }
                
                if (hasHours) {
                  employeeShops.set(shopId, {
                    id: shopId,
                    name: shopData.name
                  });
                }
              }
            }
          });
        }
      }
    }
    
    const uniqueShops = Array.from(employeeShops.values());
    console.log(`Boutiques trouvées pour employé ${employee}:`, uniqueShops);
    return uniqueShops;
  };

  // Calculer les heures hebdomadaires pour la boutique
  const calculateShopWeekHours = () => {
    if (!currentWeek || !currentShop || !planning || !selectedEmployees) return 0;
    let totalHours = 0;
    selectedEmployees.forEach(employee => {
      for (let i = 0; i < 7; i++) {
        const dayKey = format(addDays(new Date(currentWeek), i), 'yyyy-MM-dd');
        const hours = calculateEmployeeDailyHours(employee, dayKey, planning, config);
        totalHours += hours;
      }
    });
    return totalHours.toFixed(1);
  };

  // Calculer les heures mensuelles pour la boutique
  const calculateShopMonthHours = () => {
    if (!currentWeek || !currentShop || !planning || !selectedEmployees) return 0;
    // Pour l'instant, on utilise seulement la semaine actuelle
    // TODO: Implémenter le calcul mensuel complet
    return calculateShopWeekHours();
  };

  // Calculer le total des heures pour tous les employés sélectionnés
  const calculateTotalSelectedEmployeesHours = () => {
    if (!selectedEmployees || selectedEmployees.length === 0) return 0;
    let totalHours = 0;
    selectedEmployees.forEach(employeeId => {
      totalHours += parseFloat(calculateEmployeeWeekHours(employeeId));
    });
    return totalHours.toFixed(1);
  };

  // Calculer le total des heures pour tous les employés de la boutique
  const calculateTotalShopEmployeesHours = () => {
    if (!currentShopEmployees || currentShopEmployees.length === 0 || !planning) return 0;
    let totalHours = 0;
    currentShopEmployees.forEach(employee => {
      totalHours += parseFloat(calculateEmployeeWeekHours(employee.id));
    });
    return totalHours.toFixed(1);
  };

  // Calculer le nombre d'employés sélectionnés
  const getSelectedEmployeesCount = () => {
    return selectedEmployees?.length || 0;
  };

  // Calculer le nombre total d'employés dans la boutique
  const getTotalShopEmployeesCount = () => {
    return currentShopEmployees?.length || 0;
  };

  return (
    <div className="recap-buttons" style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
      {(selectedEmployees || []).map((employeeId, index) => {
        // Trouver l'employé dans currentShopEmployees pour récupérer son nom
        const employee = currentShopEmployees?.find(emp => emp.id === employeeId);
        const employeeName = employee?.name || employeeId;
        
        return (
                  <div
            key={employeeId}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              width: 'fit-content',
              minWidth: '120px',
              maxWidth: '300px',
              alignItems: 'center',
              backgroundColor: pastelColors[index % pastelColors.length],
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            <h4 style={{
              fontFamily: 'Roboto, sans-serif',
              textAlign: 'center',
              marginBottom: '4px',
              lineHeight: '1.2',
              maxHeight: '2.8em',
              fontSize: '14px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              <span>RECAP</span><br />
              <span>{employeeName}</span>
            </h4>
                      <Button
              className="button-recap"
              onClick={() => {
                console.log('Opening RecapModal for employee (day):', employeeId);
                setShowRecapModal(employeeId);
              }}
              style={{
                backgroundColor: '#1e88e5',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '11px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
            >
              JOUR: {calculateEmployeeDayHours(employeeId)}h
            </Button>
                      <Button
              className="button-recap"
              onClick={() => {
                console.log('Opening EmployeeWeeklyRecapModal for employee:', employeeId);
                console.log('setShowEmployeeWeeklyRecap function:', typeof setShowEmployeeWeeklyRecap);
                console.log('setSelectedEmployeeForWeeklyRecap function:', typeof setSelectedEmployeeForWeeklyRecap);
                setSelectedEmployeeForWeeklyRecap(employeeId);
                setShowEmployeeWeeklyRecap(true);
              }}
              style={{
                backgroundColor: '#1e88e5',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '11px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
            >
              SEMAINE: {calculateEmployeeWeekHours(employeeId)}h
            </Button>
          {showCalendarTotals && (
            <Button
              className="button-recap"
              onClick={() => {
                console.log('Opening RecapModal for employee (week):', employeeId + '_week');
                setShowRecapModal(employeeId + '_week');
              }}
              style={{
                backgroundColor: '#1e88e5',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '11px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
            >
              SEMAINE CAL: {calculateEmployeeWeekHours(employeeId)}h
            </Button>
          )}
          {(() => {
            const employeeShops = getEmployeeShops(employeeId);
            
            if (employeeShops.length <= 1) {
              // Employé dans une seule boutique ou pas de données multi-boutiques
              return (
                <Button
                  className="button-recap"
                  onClick={() => {
                    console.log('Bouton MOIS RÉEL cliqué pour employé:', employeeId, 'Heures:', calculateEmployeeMonthHours(employeeId));
                    setSelectedEmployeeForMonthlyRecap(employeeId);
                    setShowEmployeeMonthlyRecap(true);
                  }}
                  style={{
                    backgroundColor: '#1e88e5',
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: '11px',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                  MOIS: {calculateEmployeeMonthHours(employeeId)}h
                </Button>
              );
            } else {
              // Employé dans plusieurs boutiques - afficher une ligne par boutique
              return (
                <div style={{ width: '100%' }}>
                  {employeeShops.map((shop, shopIndex) => (
                    <Button
                      key={shop.id}
                      className="button-recap"
                      onClick={() => {
                        console.log('Bouton MOIS RÉEL cliqué pour employé:', employeeId, 'Boutique:', shop.name, 'Heures:', calculateEmployeeShopHours(employeeId, shop.id));
                        setSelectedEmployeeForMonthlyRecap(employeeId);
                        setShowEmployeeMonthlyRecap(true);
                      }}
                      style={{
                        backgroundColor: '#1e88e5',
                        color: '#fff',
                        padding: '4px 8px',
                        fontSize: '10px',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: shopIndex < employeeShops.length - 1 ? '2px' : '0'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                                         >
                       {shop.name}: {calculateEmployeeShopHours(employeeId, shop.id)}h (Total: {calculateEmployeeTotalMultiShopHours(employeeId)}h)
                     </Button>
                  ))}
                </div>
              );
            }
          })()}
          {showCalendarTotals && (
            <Button
              className="button-recap"
              onClick={() => {
                console.log('Bouton MOIS CALENDAIRE cliqué pour employé:', employeeId, 'Heures:', calculateEmployeeMonthHours(employeeId));
                // Modale désactivée pour le moment
              }}
              style={{
                backgroundColor: '#1e88e5',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '11px',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
            >
              MOIS CAL: {calculateEmployeeMonthHours(employeeId)}h
            </Button>
          )}
          <Button
            className="button-recap"
            onClick={() => {
              console.log('Bouton MOIS DÉTAIL cliqué pour employé:', employeeId, 'Heures:', calculateEmployeeMonthHours(employeeId));
              setSelectedEmployeeForMonthlyDetail(employeeId);
              setShowEmployeeMonthlyDetail(true);
            }}
            style={{
              backgroundColor: '#1e88e5',
              color: '#fff',
              padding: '8px 16px',
              fontSize: '11px',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
          >
                          MOIS DÉTAIL
          </Button>
        </div>
      );
      })}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: 'fit-content', minWidth: '120px', maxWidth: '300px', alignItems: 'center' }}>
        <h4 style={{
          fontFamily: 'Roboto, sans-serif',
          textAlign: 'center',
          marginBottom: '4px',
          lineHeight: '1.2',
          maxHeight: '2.8em',
          fontSize: '14px',
          fontWeight: '700',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
          <span>PLANNING</span><br />
          <span>{currentShop}</span><br />
          <span style={{ fontSize: '12px', fontWeight: '400' }}>
            {getSelectedEmployeesCount()}/{getTotalShopEmployeesCount()} employés
          </span>
        </h4>
        <Button
          className="button-recap"
          onClick={() => {
            console.log('Opening RecapModal for week');
            setShowRecapModal('week');
          }}
          style={{
            backgroundColor: '#1e88e5',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '12px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
        >
          SEMAINE: {calculateShopWeekHours()}h ({getSelectedEmployeesCount()} emp)
        </Button>
        {showCalendarTotals && (
          <Button
            className="button-recap"
            onClick={() => {
              console.log('Opening RecapModal for week');
              setShowRecapModal('week');
            }}
            style={{
              backgroundColor: '#1e88e5',
              color: '#fff',
              padding: '8px 16px',
              fontSize: '12px',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
          >
            SEMAINE CAL: {calculateShopWeekHours()}h ({getSelectedEmployeesCount()} emp)
          </Button>
        )}
        {/* Garder uniquement le bouton MOIS GLOBAL */}
        <Button
          className="button-recap"
          onClick={() => {
            console.log('Bouton MOIS GLOBAL cliqué, Heures:', calculateGlobalMonthHours());
            // Modale désactivée pour le moment
          }}
          style={{
            backgroundColor: '#9c27b0',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '12px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7b1fa2'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9c27b0'}
        >
          MOIS GLOBAL: {calculateGlobalMonthHours()}h
        </Button>
        <Button
          className="button-recap"
          onClick={() => {
            console.log('Bouton MENSUEL DÉTAIL cliqué');
            // Modale désactivée pour le moment
          }}
          style={{
            backgroundColor: '#1e88e5',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '12px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
        >
          MENSUEL DÉTAIL
        </Button>
        <Button
          className="button-recap"
          onClick={() => {
            console.log('Bouton TOTAL SÉLECTIONNÉS cliqué, Heures:', calculateTotalSelectedEmployeesHours());
            // Modale désactivée pour le moment
          }}
          style={{
            backgroundColor: '#4caf50',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '12px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
        >
          TOTAL SÉLECTIONNÉS: {calculateTotalSelectedEmployeesHours()}h ({getSelectedEmployeesCount()} emp)
        </Button>
        <Button
          className="button-recap"
          onClick={() => {
            console.log('Bouton TOTAL BOUTIQUE cliqué, Heures:', calculateTotalShopEmployeesHours());
            // Modale désactivée pour le moment
          }}
          style={{
            backgroundColor: '#ff9800',
            color: '#fff',
            padding: '8px 16px',
            fontSize: '12px',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f57c00'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
        >
          TOTAL BOUTIQUE: {calculateTotalShopEmployeesHours()}h ({getTotalShopEmployeesCount()} emp)
        </Button>
      </div>
    </div>
  );
};

export default RecapButtons;