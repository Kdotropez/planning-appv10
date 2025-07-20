import { format } from 'date-fns';
import { saveToLocalStorage, loadFromLocalStorage } from './localStorage';

export const exportAllData = async (setFeedback) => {
    try {
        console.log('exportAllData called');
        const shopsRaw = localStorage.getItem('shops');
        console.log('Raw shops data from localStorage:', shopsRaw);
        const shops = loadFromLocalStorage('shops', []);
        console.log('Parsed shops from localStorage:', shops);
        const timeSlotConfig = loadFromLocalStorage('timeSlotConfig', {});
        console.log('TimeSlotConfig retrieved:', timeSlotConfig);

        if (!shops || !Array.isArray(shops) || shops.length === 0) {
            setFeedback('Erreur: Aucune boutique créée. Veuillez créer une boutique avant d’exporter.');
            console.log('Export failed: No shops found');
            return;
        }

        const exportData = {
            shops: [],
            timeSlotConfig
        };

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

        console.log('Export data prepared:', JSON.stringify(exportData, null, 2));

        if (typeof document !== 'undefined') {
            try {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `planning_all_shops_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Exported to local file via download link');
                setFeedback('Succès: Données exportées avec succès.');
            } catch (error) {
                console.error('Export error:', error);
                setFeedback('Erreur: Échec de l’exportation : ' + error.message);
            }
        } else {
            setFeedback('Erreur: Environnement client non disponible pour l’exportation.');
            console.log('Export failed: Client environment not available');
        }
    } catch (error) {
        setFeedback('Erreur lors de l’exportation : ' + error.message);
        console.error('Export error:', error);
    }
};

export const importAllData = async (setFeedback, setShops, setSelectedShop, setConfig) => {
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

                if (!importData.shops || !Array.isArray(importData.shops)) {
                    setFeedback('Erreur: Format de fichier JSON invalide. Attendu un tableau "shops".');
                    console.log('Import failed: Invalid JSON format', importData);
                    return;
                }

                localStorage.clear();
                console.log('Cleared localStorage before import');

                importData.shops.forEach(shopData => {
                    const shop = shopData.shop ? shopData.shop.trim().toUpperCase() : null;
                    if (!shop || shop === 'DEFAULT') {
                        console.log(`Skipping invalid shop: ${shop}`);
                        return;
                    }

                    saveToLocalStorage(`employees_${shop}`, shopData.employees || []);
                    console.log(`Restored employees for ${shop}:`, shopData.employees);

                    Object.keys(shopData.weeks || {}).forEach(weekKey => {
                        saveToLocalStorage(`planning_${shop}_${weekKey}`, shopData.weeks[weekKey].planning || {});
                        saveToLocalStorage(`selected_employees_${shop}_${weekKey}`, shopData.weeks[weekKey].selectedEmployees || []);
                        console.log(`Restored week ${weekKey} for ${shop}: planning=`, shopData.weeks[weekKey].planning, 'selectedEmployees=', shopData.weeks[weekKey].selectedEmployees);
                    });

                    const latestWeek = Object.keys(shopData.weeks || {}).sort().pop();
                    if (latestWeek) {
                        saveToLocalStorage(`lastPlanning_${shop}`, {
                            week: latestWeek,
                            planning: shopData.weeks[latestWeek].planning || {}
                        });
                        console.log(`Restored lastPlanning for ${shop}:`, { week: latestWeek });
                    }
                });

                setShops(importData.shops); // Passer l'objet complet shops
                saveToLocalStorage('shops', importData.shops);
                console.log('Restored shops:', importData.shops);

                if (importData.shops.length > 0) {
                    setSelectedShop(importData.shops[0].shop);
                    saveToLocalStorage('lastPlanning', { shop: importData.shops[0].shop });
                    console.log('Selected first shop:', importData.shops[0].shop);
                } else {
                    setSelectedShop('');
                    saveToLocalStorage('lastPlanning', {});
                    console.log('No shops to select');
                }

                if (importData.timeSlotConfig) {
                    setConfig(importData.timeSlotConfig);
                    saveToLocalStorage('timeSlotConfig', importData.timeSlotConfig);
                    console.log('Restored timeSlotConfig:', importData.timeSlotConfig);
                } else {
                    setFeedback('Erreur: timeSlotConfig manquant dans le fichier JSON.');
                    console.log('Import failed: Missing timeSlotConfig');
                }

                setFeedback('Succès: Sauvegarde de toutes les boutiques restaurée avec succès.');
                console.log('Import completed successfully');
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