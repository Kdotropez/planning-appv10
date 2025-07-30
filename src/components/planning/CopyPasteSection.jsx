import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const CopyPasteSection = ({
  config,
  selectedShop,
  selectedWeek,
  selectedEmployees,
  planning,
  setPlanning,
  days,
  setAvailableWeeks,
  setFeedback
}) => {
  const [copySource, setCopySource] = useState({ employee: '', day: '', week: selectedWeek });
  const [pasteTarget, setPasteTarget] = useState({ shop: selectedShop, week: selectedWeek, employee: '' });

  const handleCopy = () => {
    if (!copySource.employee || !copySource.day) {
      setFeedback('Erreur : Sélectionnez un employé et un jour à copier.');
      return;
    }
    const dayKey = format(addDays(new Date(selectedWeek), parseInt(copySource.day)), 'yyyy-MM-dd');
    const sourceData = planning[copySource.employee]?.[dayKey] || [];
    if (!sourceData.length) {
      setFeedback('Erreur : Aucune donnée à copier pour ce jour.');
      return;
    }
    navigator.clipboard.writeText(JSON.stringify({ employee: copySource.employee, dayKey, slots: sourceData }))
      .then(() => setFeedback('Succès : Planning copié dans le presse-papiers.'))
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
        setFeedback('Erreur lors de la copie dans le presse-papiers.');
      });
    console.log('CopyPasteSection: Copied data:', { employee: copySource.employee, dayKey, slots: sourceData });
  };

  const handlePaste = async () => {
    if (!pasteTarget.shop || !pasteTarget.week || !pasteTarget.employee) {
      setFeedback('Erreur : Sélectionnez une boutique, une semaine et un employé pour coller.');
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const copiedData = JSON.parse(text);
      if (!copiedData.employee || !copiedData.dayKey || !Array.isArray(copiedData.slots)) {
        setFeedback('Erreur : Données copiées invalides.');
        return;
      }
      const targetWeek = pasteTarget.week;
      const targetDayKey = format(addDays(new Date(targetWeek), parseInt(copySource.day)), 'yyyy-MM-dd');
      const targetPlanning = loadFromLocalStorage(`planning_${pasteTarget.shop}_${targetWeek}`, {}) || {};
      if (!targetPlanning[pasteTarget.employee]) {
        targetPlanning[pasteTarget.employee] = {};
      }
      targetPlanning[pasteTarget.employee][targetDayKey] = copiedData.slots;
      saveToLocalStorage(`planning_${pasteTarget.shop}_${targetWeek}`, targetPlanning);
      setPlanning(targetPlanning);
      setAvailableWeeks(prev => {
        const updated = new Set(prev);
        updated.add(targetWeek);
        return Array.from(updated);
      });
      setFeedback('Succès : Planning collé avec succès.');
      console.log('CopyPasteSection: Pasted data:', { shop: pasteTarget.shop, week: targetWeek, employee: pasteTarget.employee, dayKey: targetDayKey, slots: copiedData.slots });
    } catch (err) {
      console.error('Erreur lors du collage:', err);
      setFeedback('Erreur lors du collage des données.');
    }
  };

  return (
    <div className="copy-paste-section" style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '10px' }}>
        Copier / Coller le planning
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <h4 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>Copier depuis</h4>
          <select
            value={copySource.employee}
            onChange={(e) => setCopySource({ ...copySource, employee: e.target.value })}
            style={{ fontFamily: 'Roboto, sans-serif', padding: '5px', marginRight: '10px' }}
          >
            <option value="">Sélectionner un employé</option>
            {selectedEmployees.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
          <select
            value={copySource.day}
            onChange={(e) => setCopySource({ ...copySource, day: e.target.value })}
            style={{ fontFamily: 'Roboto, sans-serif', padding: '5px' }}
          >
            <option value="">Sélectionner un jour</option>
            {days.map((day, index) => (
              <option key={index} value={index}>{day.name}</option>
            ))}
          </select>
          <Button
            className="button-copy"
            onClick={handleCopy}
            style={{ marginLeft: '10px' }}
          >
            Copier
          </Button>
        </div>
        <div>
          <h4 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}>Coller dans</h4>
          <select
            value={pasteTarget.shop}
            onChange={(e) => setPasteTarget({ ...pasteTarget, shop: e.target.value })}
            style={{ fontFamily: 'Roboto, sans-serif', padding: '5px', marginRight: '10px' }}
          >
            <option value="">Sélectionner une boutique</option>
            {loadFromLocalStorage('shops', []).map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
          <select
            value={pasteTarget.week}
            onChange={(e) => setPasteTarget({ ...pasteTarget, week: e.target.value })}
            style={{ fontFamily: 'Roboto, sans-serif', padding: '5px', marginRight: '10px' }}
          >
            <option value="">Sélectionner une semaine</option>
            {loadFromLocalStorage('availableWeeks', []).map(week => (
              <option key={week} value={week}>{format(new Date(week), 'd MMMM yyyy', { locale: fr })}</option>
            ))}
          </select>
          <select
            value={pasteTarget.employee}
            onChange={(e) => setPasteTarget({ ...pasteTarget, employee: e.target.value })}
            style={{ fontFamily: 'Roboto, sans-serif', padding: '5px' }}
          >
            <option value="">Sélectionner un employé</option>
            {loadFromLocalStorage(`employees_${pasteTarget.shop}`, []).map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
          <Button
            className="button-paste"
            onClick={handlePaste}
            style={{ marginLeft: '10px' }}
          >
            Coller
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CopyPasteSection;