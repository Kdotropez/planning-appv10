// src/utils/backupUtils.js
import { format } from 'date-fns';
import { saveToLocalStorage, loadFromLocalStorage, saveShopBackup, loadShopBackup } from './localStorage';

export const exportAllData = async (setFeedback) => {
  try {
    console.log('exportAllData called');
    const shops = loadFromLocalStorage('shops', []);
    console.log('Parsed shops from localStorage:', shops);

    if (!shops || !Array.isArray(shops) || shops.length === 0) {
      setFeedback('Erreur: Aucune boutique créée. Veuillez créer une boutique avant d’exporter.');
      console.log('Export failed: No shops found');
      return;
    }

    shops.forEach(shop => {
      const shopData = loadShopBackup(shop);
      if (Object.keys(shopData).length > 1) {
        const dataStr = JSON.stringify(shopData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${shop}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`Exported backup for ${shop}`);
      } else {
        console.log(`Skipping empty shop data for ${shop}`);
      }
    });
    setFeedback('Succès: Données exportées avec succès pour toutes les boutiques.');
  } catch (error) {
    console.error('Export error:', error);
    setFeedback('Erreur: Échec de l’exportation : ' + error.message);
  }
};

export const importAllData = async (setFeedback, setShops, setSelectedShop, setConfig, setSelectedWeek, setSelectedEmployees, setPlanning, setStep) => {
  try {
    console.log('importAllData called');
    if (typeof document === 'undefined') {
      setFeedback('Erreur: Environnement client non disponible pour l’importation.');
      console.log('Import failed: Client environment not available');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) {
          setFeedback('Erreur: Aucun fichier sélectionné.');
          console.log('Import failed: No file selected');
          return;
        }
        const text = await file.text();
        const importData = JSON.parse(text);
        console.log('Imported data:', importData);

        if (!importData.shop || !importData.employees || !importData.timeSlotConfig || !importData.weeks) {
          setFeedback('Erreur: Format de fichier JSON invalide. Attendu shop, employees, timeSlotConfig, weeks.');
          console.log('Import failed: Invalid JSON format', importData);
          return;
        }

        const shop = importData.shop.trim().toUpperCase();
        saveShopBackup(shop, importData);
        const currentShops = loadFromLocalStorage('shops', []);
        if (!currentShops.includes(shop)) {
          currentShops.push(shop);
          saveToLocalStorage('shops', currentShops);
          setShops(currentShops);
        }
        setSelectedShop(shop);
        setConfig(importData.timeSlotConfig);
        const latestWeek = Object.keys(importData.weeks).sort().pop();
        if (latestWeek) {
          setSelectedWeek(latestWeek);
          setSelectedEmployees(importData.weeks[latestWeek].selectedEmployees || []);
          setPlanning(importData.weeks[latestWeek].planning || {});
          setStep(5); // Passe directement à l'étape PlanningDisplay
        }
        setFeedback(`Succès: Sauvegarde de la boutique ${shop} restaurée avec succès.`);
        console.log(`Import completed successfully for ${shop}`);
      } catch (fileError) {
        setFeedback('Erreur lors de l’importation : ' + fileError.message);
        console.error('File input import error:', fileError);
      }
    };
    input.click();
  } catch (error) {
    setFeedback('Erreur lors de l’importation : ' + error.message);
    console.error('Import error:', error);
  }
};