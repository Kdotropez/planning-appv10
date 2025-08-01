import React, { useState } from 'react';
import { FaDownload, FaChevronDown, FaChevronUp, FaCog, FaChartBar, FaArrowLeft, FaTools } from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import '../../assets/styles.css';

const PlanningMenuBar = ({
  // Navigation
  currentShop,
  shops,
  currentWeek,
  changeWeek,
  changeShop,
  changeMonth,
  onBack,
  onBackToShop,
  onBackToWeek,
  onBackToConfig,
  onBackToStartup,
  
  // Actions
  onExport,
  onReset,
  setShowGlobalDayViewModal,
  handleManualSave,
  
  // Récapitulatifs
  selectedEmployees,
  currentShopEmployees,
  setShowRecapModal,
  setShowMonthlyRecapModal,
  setShowEmployeeMonthlyRecap,
  setShowEmployeeWeeklyRecap,
  setShowMonthlyDetailModal,
  setShowEmployeeMonthlyDetail,
  setSelectedEmployeeForMonthlyRecap,
  setSelectedEmployeeForWeeklyRecap,
  setSelectedEmployeeForMonthlyDetail,
  
  // Calculs
  calculateEmployeeDayHours,
  calculateEmployeeWeekHours,
  calculateEmployeeMonthHours,
  calculateShopWeekHours,
  calculateGlobalMonthHours,
  calculateTotalSelectedEmployeesHours,
  calculateTotalShopEmployeesHours,
  getSelectedEmployeesCount,
  getTotalShopEmployeesCount,
  showCalendarTotals
}) => {
  const [openMenus, setOpenMenus] = useState({
    navigation: false,
    actions: false,
    recaps: false,
    tools: false
  });

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const closeAllMenus = () => {
    setOpenMenus({
      navigation: false,
      actions: false,
      recaps: false,
      tools: false
    });
  };

  const MenuButton = ({ icon, label, isOpen, onClick, children }) => (
    <div style={{ position: 'relative' }}>
      <Button
        className="menu-button"
        onClick={onClick}
        style={{
          backgroundColor: '#1e88e5',
          color: '#fff',
          padding: '10px 16px',
          fontSize: '14px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '140px',
          justifyContent: 'space-between'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          {label}
        </div>
        {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </Button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );

  const MenuItem = ({ onClick, children, style = {} }) => (
    <div
      onClick={() => {
        onClick();
        closeAllMenus();
      }}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '14px',
        ...style
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
    >
      {children}
    </div>
  );

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}
      onClick={(e) => {
        // Fermer les menus si on clique en dehors
        const target = e.target;
        if (target && typeof target.closest === 'function' && !target.closest('.menu-button')) {
          closeAllMenus();
        }
      }}
    >
      {/* Menu Navigation */}
      <MenuButton
        icon={<FaArrowLeft />}
        label="Navigation"
        isOpen={openMenus.navigation}
        onClick={() => toggleMenu('navigation')}
      >
        <MenuItem onClick={() => changeWeek('prev')}>
          ← Semaine précédente
        </MenuItem>
        <MenuItem onClick={() => changeWeek('next')}>
          Semaine suivante →
        </MenuItem>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <select
            value={currentWeek ? format(new Date(currentWeek), 'yyyy-MM') : ''}
            onChange={(e) => changeMonth(e.target.value)}
            style={{ 
              width: '100%',
              padding: '6px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            {(() => {
              const currentDate = currentWeek ? new Date(currentWeek) : new Date();
              const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
              const endDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
              
              const months = [];
              for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
                const monthKey = format(d, 'yyyy-MM');
                const monthLabel = format(d, 'MMMM yyyy', { locale: fr });
                months.push(
                  <option key={monthKey} value={monthKey}>
                    {monthLabel}
                  </option>
                );
              }
              return months;
            })()}
          </select>
        </div>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <select
            value={currentShop}
            onChange={(e) => changeShop(e.target.value)}
            style={{ 
              width: '100%',
              padding: '6px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>
        <MenuItem onClick={onBack}>
          ← Retour Employés
        </MenuItem>
        <MenuItem onClick={onBackToShop}>
          ← Retour Boutique
        </MenuItem>
        <MenuItem onClick={onBackToWeek}>
          ← Retour Semaine
        </MenuItem>
        <MenuItem onClick={onBackToConfig}>
          ← Retour Configuration
        </MenuItem>
        <MenuItem onClick={onBackToStartup}>
          ← Retour au démarrage
        </MenuItem>
      </MenuButton>

      {/* Menu Actions */}
      <MenuButton
        icon={<FaCog />}
        label="Actions"
        isOpen={openMenus.actions}
        onClick={() => toggleMenu('actions')}
      >
        <MenuItem onClick={handleManualSave}>
          💾 Sauvegarder maintenant
        </MenuItem>
        <MenuItem onClick={onExport}>
          <FaDownload /> Exporter les données
        </MenuItem>
        <MenuItem onClick={onReset}>
          🔄 Réinitialiser
        </MenuItem>
        <MenuItem onClick={() => setShowGlobalDayViewModal(true)}>
          📊 Vue globale par jour
        </MenuItem>
      </MenuButton>

      {/* Menu Récapitulatifs */}
      <MenuButton
        icon={<FaChartBar />}
        label="Récapitulatifs"
        isOpen={openMenus.recaps}
        onClick={() => toggleMenu('recaps')}
      >
        {/* Récaps par employé */}
        {selectedEmployees?.map((employeeId) => {
          const employee = currentShopEmployees?.find(emp => emp.id === employeeId);
          const employeeName = employee?.name || employeeId;
          
          return (
            <div key={employeeId} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f8f9fa', 
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                {employeeName}
              </div>
              <MenuItem onClick={() => setShowRecapModal(employeeId)}>
                📅 Jour: {calculateEmployeeDayHours(employeeId)}h
              </MenuItem>
              <MenuItem onClick={() => {
                setSelectedEmployeeForWeeklyRecap(employeeId);
                setShowEmployeeWeeklyRecap(true);
              }}>
                📊 Semaine: {calculateEmployeeWeekHours(employeeId)}h
              </MenuItem>
              <MenuItem onClick={() => {
                setSelectedEmployeeForMonthlyRecap(employeeId);
                setShowEmployeeMonthlyRecap(true);
              }}>
                📈 Mois: {calculateEmployeeMonthHours(employeeId)}h
              </MenuItem>
              <MenuItem onClick={() => {
                setSelectedEmployeeForMonthlyDetail(employeeId);
                setShowEmployeeMonthlyDetail(true);
              }}>
                📋 Mois détail
              </MenuItem>
            </div>
          );
        })}
        
        {/* Récaps globaux */}
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#e3f2fd', 
          fontWeight: 'bold',
          fontSize: '13px',
          borderTop: '2px solid #1e88e5'
        }}>
          {currentShop} ({getSelectedEmployeesCount()}/{getTotalShopEmployeesCount()} emp)
        </div>
        <MenuItem onClick={() => setShowRecapModal('week')}>
          📊 Semaine: {calculateShopWeekHours()}h
        </MenuItem>
        <MenuItem onClick={() => setShowMonthlyRecapModal(true)}>
          📈 Mois global: {calculateGlobalMonthHours()}h
        </MenuItem>
        <MenuItem onClick={() => {}}>
          📋 Total sélectionnés: {calculateTotalSelectedEmployeesHours()}h
        </MenuItem>
        <MenuItem onClick={() => {}}>
          📊 Total boutique: {calculateTotalShopEmployeesHours()}h
        </MenuItem>
      </MenuButton>

      {/* Menu Outils */}
      <MenuButton
        icon={<FaTools />}
        label="Outils"
        isOpen={openMenus.tools}
        onClick={() => toggleMenu('tools')}
      >
        <MenuItem onClick={() => {}}>
          🔧 Diagnostic données
        </MenuItem>
        <MenuItem onClick={() => {}}>
          🧹 Nettoyer cache
        </MenuItem>
        <MenuItem onClick={() => {}}>
          📋 Logs système
        </MenuItem>
      </MenuButton>
    </div>
  );
};

export default PlanningMenuBar; 