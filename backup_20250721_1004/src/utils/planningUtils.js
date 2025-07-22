import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, isMonday, isSameMonth, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from './localStorage';

export const isValidDate = (dateString) => {
    return dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime());
};

export const generateDays = (selectedWeek) => {
    if (!isValidDate(selectedWeek)) return [];
    return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(selectedWeek), i);
        return {
            name: format(date, 'EEEE', { locale: fr }),
            date: format(date, 'd MMMM', { locale: fr }),
        };
    });
};

export const calculateDailyHours = (dayIndex, selectedWeek, selectedShop, planning, config, selectedEmployees) => {
    if (!isValidDate(selectedWeek) || !selectedShop) return 0;
    const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
    let totalHours = 0;
    const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
    (storedSelectedEmployees || []).forEach(employee => {
        const slots = planning[employee]?.[dayKey] || [];
        const hours = (slots.filter(slot => slot).length * (config?.interval || 0)) / 60;
        totalHours += hours;
    });
    return totalHours;
};

export const calculateEmployeeDailyHours = (employee, dayKey, weekPlanning, config) => {
    const slots = weekPlanning[employee]?.[dayKey] || [];
    console.log(`Calcul des heures quotidiennes pour ${employee} le ${dayKey}:`, { slots });
    return (slots.filter(slot => slot).length * (config?.interval || 0)) / 60;
};

export const calculateEmployeeWeeklyHours = (employee, weekStart, weekPlanning, config, targetMonth = null) => {
    if (!isValidDate(weekStart)) return 0;
    let totalHours = 0;
    for (let i = 0; i < 7; i++) {
        const dayDate = addDays(new Date(weekStart), i);
        const dayKey = format(dayDate, 'yyyy-MM-dd');
        if (targetMonth && !isSameMonth(dayDate, new Date(targetMonth))) {
            continue;
        }
        totalHours += calculateEmployeeDailyHours(employee, dayKey, weekPlanning, config);
    }
    console.log(`Calcul des heures hebdomadaires pour ${employee} à partir de ${weekStart}:`, { totalHours });
    return totalHours;
};

export const calculateShopWeeklyHours = (selectedWeek, selectedShop, planning, config, selectedEmployees) => {
    let totalHours = 0;
    const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
    (storedSelectedEmployees || []).forEach(employee => {
        totalHours += calculateEmployeeWeeklyHours(employee, selectedWeek, planning, config);
    });
    return totalHours.toFixed(1);
};

export const calculateShopMonthlyHours = (selectedWeek, selectedShop, planning, config, selectedEmployees) => {
    const weeks = getMonthlyWeeks(selectedWeek, selectedShop, planning);
    let totalHours = 0;
    const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
    
    weeks.forEach(({ weekStart, planning: weekPlanning }) => {
        (storedSelectedEmployees || []).forEach(employee => {
            totalHours += calculateEmployeeWeeklyHours(employee, weekStart, weekPlanning, config, selectedWeek);
        });
    });
    
    console.log(`Calcul des heures mensuelles pour ${selectedShop} dans le mois de ${selectedWeek}:`, { totalHours });
    return totalHours.toFixed(1);
};

export const getEndTime = (startTime, interval) => {
    if (!startTime) return '-';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date(2025, 0, 1, hours, minutes);
    return format(addMinutes(date, interval), 'HH:mm');
};

export const getAvailableWeeks = (selectedShop) => {
    if (!selectedShop) return [];
    const weeks = [];
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
    console.log('Clés de stockage disponibles:', storageKeys);

    storageKeys.forEach(key => {
        const weekKey = key.replace(`planning_${selectedShop}_`, '');
        try {
            const weekDate = new Date(weekKey);
            if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                const weekPlanning = loadFromLocalStorage(key, {});
                if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                    weeks.push({
                        key: weekKey,
                        date: weekDate,
                        display: `Semaine du ${format(weekDate, 'd MMMM yyyy', { locale: fr })}`
                    });
                    console.log(`Données de la semaine pour ${key}:`, weekPlanning);
                }
            }
        } catch (e) {
            console.error(`Format de date invalide pour la clé ${key}:`, e);
        }
    });

    weeks.sort((a, b) => a.date - b.date);
    console.log('Semaines disponibles:', weeks);
    return weeks;
};

export const getMonthlyWeeks = (selectedWeek, selectedShop, planning) => {
    if (!isValidDate(selectedWeek) || !selectedShop) return [];
    const monthStart = startOfMonth(new Date(selectedWeek));
    const monthEnd = endOfMonth(new Date(selectedWeek));
    const weeks = [];
    const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');

    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
    console.log('Clés de stockage disponibles:', storageKeys);

    storageKeys.forEach(key => {
        const weekKey = key.replace(`planning_${selectedShop}_`, '');
        try {
            const weekDate = new Date(weekKey);
            if (!isNaN(weekDate.getTime()) && isMonday(weekDate)) {
                const weekEnd = addDays(weekDate, 6);
                if (isWithinInterval(weekDate, { start: monthStart, end: monthEnd }) ||
                    isWithinInterval(weekEnd, { start: monthStart, end: monthEnd }) ||
                    (weekDate < monthStart && weekEnd > monthEnd)) {
                    const weekPlanning = loadFromLocalStorage(key, {});
                    if (weekPlanning && Object.keys(weekPlanning).length > 0) {
                        weeks.push({ weekStart: weekKey, planning: weekPlanning });
                        console.log(`Données de la semaine pour ${key}:`, weekPlanning);
                    }
                }
            }
        } catch (e) {
            console.error(`Format de date invalide pour la clé ${key}:`, e);
        }
    });

    if (isMonday(new Date(selectedWeek)) && Object.keys(planning).length > 0) {
        const weekExists = weeks.some(week => week.weekStart === currentWeekKey);
        if (!weekExists) {
            saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, planning);
            weeks.push({ weekStart: currentWeekKey, planning });
            console.log(`Ajout des données de la semaine actuelle pour ${currentWeekKey}:`, planning);
        }
    }

    weeks.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
    console.log('Semaines triées pour le mois:', weeks);
    return weeks;
};

export const getMonthlyRecapData = (selectedEmployees, selectedWeek, selectedShop, planning, config) => {
    const weeks = getMonthlyWeeks(selectedWeek, selectedShop, planning);
    const monthlyTotals = {};
    const weeklyRecaps = [];

    if (weeks.length === 0) {
        console.log('Aucune semaine trouvée pour le récapitulatif mensuel');
        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
        (storedSelectedEmployees || []).forEach(employee => {
            monthlyTotals[employee] = 0;
            weeklyRecaps.push({
                employee,
                week: isValidDate(selectedWeek) ? `Semaine du ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(selectedWeek), 6), 'd MMMM yyyy', { locale: fr })}` : 'Semaine invalide',
                hours: '0.0'
            });
        });
        return { monthlyTotals, weeklyRecaps };
    }

    const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
    (storedSelectedEmployees || []).forEach(employee => {
        monthlyTotals[employee] = 0;
    });

    weeks.forEach(({ weekStart, planning: weekPlanning }) => {
        console.log(`Traitement de la semaine ${weekStart}:`, weekPlanning);
        (storedSelectedEmployees || []).forEach(employee => {
            if (!weekPlanning[employee]) {
                console.log(`Aucune donnée pour l'employé ${employee} dans la semaine ${weekStart}`);
                weeklyRecaps.push({
                    employee,
                    week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: '0.0'
                });
                return;
            }

            const weekTotalHours = calculateEmployeeWeeklyHours(employee, weekStart, weekPlanning, config, selectedWeek);
            monthlyTotals[employee] += weekTotalHours;
            weeklyRecaps.push({
                employee,
                week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                hours: weekTotalHours.toFixed(1)
            });
        });
    });

    console.log('Données du récapitulatif mensuel:', { monthlyTotals, weeklyRecaps });
    return { monthlyTotals, weeklyRecaps };
};

export const getEmployeeMonthlyRecapData = (employee, selectedWeek, selectedShop, config) => {
    const weeks = getMonthlyWeeks(selectedWeek, selectedShop);
    const weeklyRecaps = [];
    let monthlyTotal = 0;

    if (weeks.length === 0) {
        console.log(`Aucune semaine trouvée pour le récapitulatif mensuel de l'employé ${employee}`);
        return { monthlyTotal: 0, weeklyRecaps };
    }

    weeks.forEach(({ weekStart, planning: weekPlanning }) => {
        if (!weekPlanning[employee]) {
            console.log(`Aucune donnée pour l'employé ${employee} dans la semaine ${weekStart}`);
            weeklyRecaps.push({
                week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                hours: '0.0'
            });
            return;
        }

        const weekTotalHours = calculateEmployeeWeeklyHours(employee, weekStart, weekPlanning, config, selectedWeek);
        monthlyTotal += weekTotalHours;
        weeklyRecaps.push({
            week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
            hours: weekTotalHours.toFixed(1)
        });
    });

    console.log(`Données du récapitulatif mensuel pour ${employee}:`, { monthlyTotal, weeklyRecaps });
    return { monthlyTotal, weeklyRecaps };
};