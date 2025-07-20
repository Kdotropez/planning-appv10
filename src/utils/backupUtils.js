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

        // Vérifier si des boutiques existent
        if (!shops || !Array.isArray(shops) || shops.length === 0) {
            setFeedback('Erreur: Aucune boutique créée. Veuillez créer une boutique avant d’exporter.');
            console.log('Export failed: No shops found');
            return;
        }

        // Préparer les données à exporter
        const exportData = {
            shops: [],
            timeSlotConfig
        };

        // Remplir les données des boutiques
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

        const exportString = JSON.stringify(exportData, null, 2);
        const fileName = `planning_all_shops_${format(new Date(), 'yyyy-MM-dd_HHmm')}`;

        // Téléchargement direct
        try {
            const blob = new Blob([exportString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.json`;
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
    } catch (error) {
        setFeedback('Erreur lors de l’exportation : ' + error.message);
        console.error('Export error:', error);
    }
};

export const importAllData = async (setFeedback, setShops, setSelectedShop, setConfig) => {
    try {
        console.log('importAllData called');
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

                // Vérifier le format du fichier JSON
                if (!importData.shops || !Array.isArray(importData.shops)) {
                    setFeedback('Erreur: Format de fichier JSON invalide. Attendu un tableau "shops".');
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
                console.log('Imported data via file input:', importData);
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