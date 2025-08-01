import React, { useState } from 'react';
import { FaDownload, FaCog, FaArrowLeft, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import Button from '../common/Button';
import '../../assets/styles.css';

const NavigationButtons = ({
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
  onExport,
  onReset,
  onBackToStartup,
  setShowGlobalDayViewModal
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);

  return (
    <div className="navigation-buttons" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '15px',
      padding: '0 10px'
    }}>
      {/* Section Navigation temporelle */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Button
          className="button-retour"
          onClick={() => changeWeek('prev')}
          style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 12px', fontSize: '12px' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
        >
          ← Précédente
        </Button>
        
        <select
          value={currentWeek ? format(new Date(currentWeek), 'yyyy-MM') : ''}
          onChange={(e) => {
            if (changeMonth) {
              changeMonth(e.target.value);
            }
          }}
          style={{ 
            padding: '8px', 
            fontSize: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#fff',
            minWidth: '100px'
          }}
        >
          {(() => {
            const currentDate = currentWeek ? new Date(currentWeek) : new Date();
            const startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
            
            const months = eachMonthOfInterval({ start: startDate, end: endDate });
            
            return months.map(month => {
              const monthKey = format(month, 'yyyy-MM');
              const monthLabel = format(month, 'MMMM yyyy', { locale: fr });
              return (
                <option key={monthKey} value={monthKey}>
                  {monthLabel}
                </option>
              );
            });
          })()}
        </select>
        
        <Button
          className="button-retour"
          onClick={() => changeWeek('next')}
          style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 12px', fontSize: '12px' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
        >
          Suivante →
        </Button>
      </div>

      {/* Section Centre - Boutique */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <select
          value={currentShop}
          onChange={(e) => changeShop(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            fontSize: '14px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#fff',
            minWidth: '150px',
            fontWeight: 'bold'
          }}
        >
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>{shop.name}</option>
          ))}
        </select>
      </div>

      {/* Section Droite - Menus */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Menu Actions */}
        <div style={{ position: 'relative' }}>
          <Button
            className="button-primary"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            style={{ 
              backgroundColor: '#28a745', 
              color: '#fff', 
              padding: '8px 12px', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            <FaCog /> Actions
          </Button>
          
          {showActionsMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '150px',
              marginTop: '2px'
            }}>
              <button
                onClick={() => {
                  onExport();
                  setShowActionsMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaDownload /> Exporter
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowActionsMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#dc3545'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaCog /> Réinitialiser
              </button>
              <button
                onClick={() => {
                  setShowGlobalDayViewModal(true);
                  setShowActionsMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaEye /> Vue globale par jour
              </button>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <div style={{ position: 'relative' }}>
          <Button
            className="button-retour"
            onClick={() => setShowNavigationMenu(!showNavigationMenu)}
            style={{ 
              backgroundColor: '#6c757d', 
              color: '#fff', 
              padding: '8px 12px', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            <FaArrowLeft /> Navigation
          </Button>
          
          {showNavigationMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '150px',
              marginTop: '2px'
            }}>
              <button
                onClick={() => {
                  onBack();
                  setShowNavigationMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaArrowLeft /> Retour Employés
              </button>
              <button
                onClick={() => {
                  onBackToShop();
                  setShowNavigationMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaArrowLeft /> Retour Boutique
              </button>
              <button
                onClick={() => {
                  onBackToWeek();
                  setShowNavigationMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaCalendarAlt /> Retour Semaine
              </button>
              <button
                onClick={() => {
                  onBackToConfig();
                  setShowNavigationMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaCog /> Retour Configuration
              </button>
              <button
                onClick={() => {
                  onBackToStartup();
                  setShowNavigationMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaArrowLeft /> Retour au démarrage
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fermer les menus si on clique ailleurs */}
      {showActionsMenu || showNavigationMenu ? (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => {
            setShowActionsMenu(false);
            setShowNavigationMenu(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default NavigationButtons;