import { format } from 'date-fns';
import { saveToLocalStorage, loadFromLocalStorage } from './localStorage';

export const exportAllData = async (setFeedback) => {
    try {
        console.log('exportAllData called');
        const shopsRaw = localStorage.getItem('shops');
        console.log('Raw shops data from localStorage:', shopsRaw);
        const shops = loadFromLocalStorage('shops', []);
        console.log('Parsed shops from localStorage:', shops);

        if (!shops || !Array.isArray(shops) || shops.length === 0) {
            setFeedback('Erreur: Aucune boutique disponible pour l’exportation.');
            console.log('Export failed: No shops found or invalid shops data');
            return;
        }

        const handle = await window.showSaveFilePicker({
            suggestedName: `planning_all_shops_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`,
            types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        const exportData = {
            shops: [],
            timeSlotConfig: loadFromLocalStorage('timeSlotConfig', {})
        };
        console.log('TimeSlotConfig retrieved:', exportData.timeSlotConfig);

        shops.forEach(shop => {
            if (!shop || shop === 'DEFAULT') {
                console.log(`Skipping invalid shop: ${shop}`);
                return;
            }
            const shopData = {
                shop,
                employees: loadFromLocalStorage(`employees_${shop}`, []),
                weeks: {}
            };
            console.log(`Processing shop: ${shop}, employees:`, shopData.employees);

            const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${shop}_`));
            console.log(`Storage keys for ${shop}:`, storageKeys);

            storageKeys.forEach(key => {
                const weekKey = key.replace(`planning_${shop}_`, '');
                try {
                    const weekDate = new Date(weekKey);
                    if (!isNaN(weekDate.getTime())) {
                        const planning = loadFromLocalStorage(key, {});
                        const selectedEmployees = loadFromLocalStorage(`selected_employees_${shop}_${weekKey}`, []);
                        console.log(`Week ${weekKey} for ${shop}: planning=`, planning, 'selectedEmployees=', selectedEmployees);
                        shopData.weeks[weekKey] = {
                            planning,
                            selectedEmployees
                        };
                    } else {
                        console.log(`Skipping invalid weekKey: ${weekKey}`);
                    }
                } catch (e) {
                    console.error(`Error processing weekKey ${weekKey} for shop ${shop}:`, e);
                }
            });

            exportData.shops.push(shopData);
            console.log(`Added shop to exportData: ${shop}`);
        });

        if (!exportData.shops.length) {
            setFeedback('Erreur: Aucune boutique valide à exporter.');
            console.log('Export failed: No valid shop data');
            await writable.close();
            return;
        }

        console.log('Final exportData:', JSON.stringify(exportData, null, 2));
        await writable.write(JSON.stringify(exportData, null, 2));
        await writable.close();
        setFeedback('Succès: Sauvegarde de toutes les boutiques exportée avec succès.');
        console.log('Exported planning successfully');
    } catch (error) {
        setFeedback('Erreur lors de l’exportation: ' + error.message);
        console.error('Export error:', error);
    }
};

export const importAllData = async (setFeedback, setShops, setSelectedShop, setConfig) => {
    try {
        console.log('importAllData called');
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const importData = JSON.parse(text);

        // Vérifier le format du fichier JSON
        if (!importData.shops || !Array.isArray(importData.shops) || !importData.timeSlotConfig) {
            setFeedback('Erreur: Format de fichier JSON invalide. Attendu un tableau "shops" et "timeSlotConfig".');
            console.log('Import failed: Invalid JSON format', importData);
            return;
        }

        // Effacer toutes les données existantes dans localStorage
        localStorage.clear();
        console.log('Cleared localStorage before import');

        // Restaurer toutes les boutiques
        const shopNames = [];
        importData.shops.forEach(shopData => {
            const shop = shopData.shop ? shopData.shop.trim().toUpperCase() : null;
            if (!shop || shop === 'DEFAULT') {
                console.log(`Skipping invalid shop: ${shop}`);
                return;
            }
            shopNames.push(shop);

            // Restaurer les employés
            saveToLocalStorage(`employees_${shop}`, shopData.employees || []);
            console.log(`Restored employees for ${shop}:`, shopData.employees);

            // Restaurer les semaines
            Object.keys(shopData.weeks || {}).forEach(weekKey => {
                saveToLocalStorage(`planning_${shop}_${weekKey}`, shopData.weeks[weekKey].planning || {});
                saveToLocalStorage(`selected_employees_${shop}_${weekKey}`, shopData.weeks[weekKey].selectedEmployees || []);
                console.log(`Restored week ${weekKey} for ${shop}: planning=`, shopData.weeks[weekKey].planning, 'selectedEmployees=', shopData.weeks[weekKey].selectedEmployees);
            });

            // Mettre à jour le dernier planning pour chaque boutique
            const latestWeek = Object.keys(shopData.weeks || {}).sort().pop();
            if (latestWeek) {
                saveToLocalStorage(`lastPlanning_${shop}`, {
                    week: latestWeek,
                    planning: shopData.weeks[latestWeek].planning || {}
                });
                console.log(`Restored lastPlanning for ${shop}:`, { week: latestWeek });
            }
        });

        // Restaurer la liste des boutiques
        console.log('Adding shops to localStorage:', shopNames);
        saveToLocalStorage('shops', shopNames);
        setShops(shopNames);

        // Sélectionner la première boutique par défaut
        if (shopNames.length > 0) {
            setSelectedShop(shopNames[0]);
            saveToLocalStorage('lastPlanning', { shop: shopNames[0] });
            console.log('Selected first shop:', shopNames[0]);
        } else {
            setSelectedShop('');
            saveToLocalStorage('lastPlanning', {});
            console.log('No shops to select');
        }

        // Restaurer la configuration des tranches horaires
        setConfig(importData.timeSlotConfig || {});
        saveToLocalStorage('timeSlotConfig', importData.timeSlotConfig || {});
        console.log('Restored timeSlotConfig:', importData.timeSlotConfig);

        setFeedback('Succès: Sauvegarde de toutes les boutiques restaurée avec succès.');
        console.log('Imported data:', importData);
    } catch (error) {
        setFeedback('Erreur lors de l’importation: ' + error.message);
        console.error('Import error:', error);
    }
};