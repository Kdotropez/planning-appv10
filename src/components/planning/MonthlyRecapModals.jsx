import React from 'react';
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, isMonday, isSameMonth, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const MonthlyRecapModals = ({
    config,
    selectedShop,
    selectedWeek,
    selectedEmployees,
    planning,
    showMonthlyRecapModal,
    setShowMonthlyRecapModal,
    showEmployeeMonthlyRecap,
    setShowEmployeeMonthlyRecap,
    selectedEmployeeForMonthlyRecap,
    setSelectedEmployeeForMonthlyRecap,
    calculateEmployeeDailyHours,
    calculateEmployeeWeeklyHours
}) => {
    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const getTimeSlotsWithBreaks = (employee, dayKey, weekPlanning) => {
        const slots = weekPlanning[employee]?.[dayKey] || [];
        const timeSlots = config?.timeSlots || [];
        const ranges = [];
        let currentRange = null;
        let breaks = [];

        if (!slots.some(slot => slot)) {
            return { status: 'Congé', ranges: [], breaks: [], hours: 0, columns: ['Arrivée'], values: ['Congé'] };
        }

        for (let i = 0; i < slots.length && i < timeSlots.length; i++) {
            if (!timeSlots[i]) {
                console.warn(`timeSlots[${i}] is undefined for employee ${employee} on ${dayKey}`);
                continue;
            }
            if (slots[i]) {
                if (!currentRange) {
                    currentRange = { 
                        start: timeSlots[i].split('-')[0] || '00:00', 
                        end: timeSlots[i].split('-')[1] || getEndTime(timeSlots[i].split('-')[0], config?.interval || 30) 
                    };
                } else {
                    currentRange.end = timeSlots[i].split('-')[1] || getEndTime(timeSlots[i].split('-')[0], config?.interval || 30);
                }
            } else if (currentRange) {
                ranges.push(currentRange);
                if (i < slots.length) {
                    breaks.push({ 
                        start: currentRange.end, 
                        end: timeSlots[i]?.split('-')[0] || '-' 
                    });
                }
                currentRange = null;
            }
        }
        if (currentRange) {
            ranges.push(currentRange);
        }

        const columns = ['Arrivée', 'Pause', 'Retour', 'Fin'];
        const values = [];

        if (ranges[0]) {
            values.push(ranges[0].start); // Arrivée
            values.push(breaks[0]?.start || '-'); // Première pause
            values.push(breaks[0] && ranges[1] ? ranges[1].start : '-'); // Retour
            values.push(ranges[ranges.length - 1]?.end || '-'); // Fin
        } else {
            values.push('-', '-', '-', '-');
        }

        const hours = calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
        return { status: null, ranges, breaks, hours, columns, values };
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime || startTime === '-') return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const getMonthlyWeeks = () => {
        const monthStart = startOfMonth(new Date(selectedWeek));
        const monthEnd = endOfMonth(new Date(selectedWeek));
        const weeks = [];
        const currentWeekKey = format(new Date(selectedWeek), 'yyyy-MM-dd');

        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(`planning_${selectedShop}_`));
        console.log('Available storage keys for monthly weeks:', storageKeys);

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
                            console.log(`Week data for ${key}:`, weekPlanning);
                        }
                    }
                }
            } catch (e) {
                console.error(`Invalid date format for key ${key}:`, e);
            }
        });

        if (isMonday(new Date(selectedWeek))) {
            saveToLocalStorage(`planning_${selectedShop}_${currentWeekKey}`, planning);
            const weekExists = weeks.some(week => week.weekStart === currentWeekKey);
            if (!weekExists) {
                weeks.push({ weekStart: currentWeekKey, planning });
                console.log(`Added current week data for ${currentWeekKey}:`, planning);
            }
        }

        weeks.sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
        console.log('Sorted weeks found for month:', weeks);
        return weeks;
    };

    const getMonthlyRecapData = () => {
        const weeks = getMonthlyWeeks();
        const monthlyTotals = {};
        const weeklyRecaps = [];

        if (weeks.length === 0) {
            console.log('No weeks found for monthly recap');
            const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
            (storedSelectedEmployees || []).forEach(employee => {
                monthlyTotals[employee] = 0;
                weeklyRecaps.push({
                    employee,
                    week: `Semaine du ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(selectedWeek), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: '0.0',
                    timeSlots: Array(7).fill().map((_, i) => ({
                        day: format(addDays(new Date(selectedWeek), i), 'EEEE d MMMM', { locale: fr }),
                        status: 'Congé',
                        hours: 0,
                        columns: ['Arrivée'],
                        values: ['Congé']
                    }))
                });
            });
            return { monthlyTotals, weeklyRecaps };
        }

        const storedSelectedEmployees = loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []);
        (storedSelectedEmployees || []).forEach(employee => {
            monthlyTotals[employee] = 0;
        });

        weeks.forEach(({ weekStart, planning: weekPlanning }) => {
            console.log(`Processing week ${weekStart}:`, weekPlanning);
            (storedSelectedEmployees || []).forEach(employee => {
                const timeSlots = [];
                let weekTotalHours = 0;
                for (let i = 0; i < 7; i++) {
                    const dayDate = addDays(new Date(weekStart), i);
                    const dayKey = format(dayDate, 'yyyy-MM-dd');
                    if (!isSameMonth(dayDate, new Date(selectedWeek))) {
                        continue;
                    }
                    const slotData = getTimeSlotsWithBreaks(employee, dayKey, weekPlanning);
                    timeSlots.push({ day: format(dayDate, 'EEEE d MMMM', { locale: fr }), ...slotData });
                    weekTotalHours += slotData.hours;
                }
                monthlyTotals[employee] += weekTotalHours;
                weeklyRecaps.push({
                    employee,
                    week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: weekTotalHours.toFixed(1),
                    timeSlots
                });
            });
        });

        console.log('Monthly recap data:', { monthlyTotals, weeklyRecaps });
        return { monthlyTotals, weeklyRecaps };
    };

    const calculateShopMonthlyHours = () => {
        const { monthlyTotals } = getMonthlyRecapData();
        let totalHours = 0;
        Object.values(monthlyTotals).forEach(hours => {
            totalHours += hours;
        });
        return totalHours.toFixed(1);
    };

    const getEmployeeMonthlyRecapData = (employee) => {
        const weeks = getMonthlyWeeks();
        const weeklyRecaps = [];
        let monthlyTotal = 0;

        if (weeks.length === 0) {
            console.log(`No weeks found for employee ${employee} monthly recap`);
            return {
                monthlyTotal: 0,
                weeklyRecaps: [{
                    week: `Semaine du ${format(new Date(selectedWeek), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(selectedWeek), 6), 'd MMMM yyyy', { locale: fr })}`,
                    hours: '0.0',
                    timeSlots: Array(7).fill().map((_, i) => ({
                        day: format(addDays(new Date(selectedWeek), i), 'EEEE d MMMM', { locale: fr }),
                        status: 'Congé',
                        hours: 0,
                        columns: ['Arrivée'],
                        values: ['Congé']
                    }))
                }]
            };
        }

        weeks.forEach(({ weekStart, planning: weekPlanning }) => {
            const timeSlots = [];
            let weekTotalHours = 0;
            for (let i = 0; i < 7; i++) {
                const dayDate = addDays(new Date(weekStart), i);
                const dayKey = format(dayDate, 'yyyy-MM-dd');
                if (!isSameMonth(dayDate, new Date(selectedWeek))) {
                    continue;
                }
                const slotData = getTimeSlotsWithBreaks(employee, dayKey, weekPlanning);
                timeSlots.push({ day: format(dayDate, 'EEEE d MMMM', { locale: fr }), ...slotData });
                weekTotalHours += slotData.hours;
            }
            monthlyTotal += weekTotalHours;
            weeklyRecaps.push({
                week: `Semaine du ${format(new Date(weekStart), 'd MMMM', { locale: fr })} au ${format(addDays(new Date(weekStart), 6), 'd MMMM yyyy', { locale: fr })}`,
                hours: weekTotalHours.toFixed(1),
                timeSlots
            });
        });

        console.log(`Employee monthly recap data for ${employee}:`, { monthlyTotal, weeklyRecaps });
        return { monthlyTotal, weeklyRecaps };
    };

    if (!planning || !config?.timeSlots?.length) {
        return (
            <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="modal-content">
                    <button
                        className="modal-close"
                        onClick={() => {
                            setShowMonthlyRecapModal(false);
                            setShowEmployeeMonthlyRecap(false);
                            setSelectedEmployeeForMonthlyRecap('');
                        }}
                        style={{ color: '#dc3545', fontSize: '18px' }}
                    >
                        ✕
                    </button>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                        Erreur
                    </h3>
                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                        Aucune configuration de tranches horaires ou données de planning disponibles.
                    </p>
                    <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                        <Button className="button-retour" onClick={() => {
                            setShowMonthlyRecapModal(false);
                            setShowEmployeeMonthlyRecap(false);
                            setSelectedEmployeeForMonthlyRecap('');
                        }}>
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {showMonthlyRecapModal && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => setShowMonthlyRecapModal(false)}
                            style={{ color: '#dc3545', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Récapitulatif mensuel - {selectedShop} ({calculateShopMonthlyHours()} h)
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                            Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                        </p>
                        {(() => {
                            const { monthlyTotals, weeklyRecaps } = getMonthlyRecapData();
                            const shopTotalHours = Object.values(monthlyTotals).reduce((sum, hours) => sum + hours, 0).toFixed(1);
                            if (Object.keys(monthlyTotals).length === 0 || weeklyRecaps.every(recap => recap.hours === '0.0')) {
                                return (
                                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                                        Aucune donnée disponible pour ce mois.
                                    </p>
                                );
                            }
                            const columns = ['Arrivée', 'Pause', 'Retour', 'Fin'];
                            return (
                                <table className="recap-table" style={{ fontFamily: 'Roboto, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Employé</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total mois (h)</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Semaine</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Jour</th>
                                            {columns.map((col, index) => (
                                                <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>{col}</th>
                                            ))}
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total semaine (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(loadFromLocalStorage(`selected_employees_${selectedShop}_${selectedWeek}`, selectedEmployees || []) || []).map((employee, empIndex) => (
                                            weeklyRecaps
                                                .filter(recap => recap.employee === employee)
                                                .map((recap, recapIndex) => (
                                                    recap.timeSlots.map((slot, slotIndex) => (
                                                        <tr key={`${employee}-${recapIndex}-${slotIndex}`} style={{ backgroundColor: pastelColors[empIndex % pastelColors.length] }}>
                                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slotIndex === 0 ? recap.employee : ''}</td>
                                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slotIndex === 0 ? (monthlyTotals[employee] ? monthlyTotals[employee].toFixed(1) : '0.0') : ''}</td>
                                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slotIndex === 0 ? recap.week : ''}</td>
                                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slot.day}</td>
                                                            {slot.status ? (
                                                                <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan={columns.length}>{slot.status}</td>
                                                            ) : (
                                                                slot.values.map((value, idx) => (
                                                                    <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                                                                ))
                                                            )}
                                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.hours}</td>
                                                        </tr>
                                                    ))
                                                )).concat([
                                                    <tr key={`${employee}-spacer`} style={{ height: '10px' }}><td colSpan={columns.length + 4}></td></tr>
                                                ])
                                        ))}
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{shopTotalHours} h</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            {columns.map((_, index) => (
                                                <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}></th>
                                            ))}
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })()}
                        <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <Button className="button-retour" onClick={() => setShowMonthlyRecapModal(false)}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showEmployeeMonthlyRecap && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowEmployeeMonthlyRecap(false);
                                setSelectedEmployeeForMonthlyRecap('');
                            }}
                            style={{ color: '#dc3545', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                        <h3 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                            Récapitulatif mensuel - {selectedEmployeeForMonthlyRecap} ({getEmployeeMonthlyRecapData(selectedEmployeeForMonthlyRecap).monthlyTotal.toFixed(1)} h)
                        </h3>
                        <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '10px' }}>
                            Mois de {format(new Date(selectedWeek), 'MMMM yyyy', { locale: fr })}
                        </p>
                        {(() => {
                            const { monthlyTotal, weeklyRecaps } = getEmployeeMonthlyRecapData(selectedEmployeeForMonthlyRecap);
                            if (weeklyRecaps.length === 0 || weeklyRecaps.every(recap => recap.hours === '0.0')) {
                                return (
                                    <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', color: '#e53935' }}>
                                        Aucune donnée disponible pour ce mois.
                                    </p>
                                );
                            }
                            const columns = ['Arrivée', 'Pause', 'Retour', 'Fin'];
                            return (
                                <table className="recap-table" style={{ fontFamily: 'Roboto, sans-serif', width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Semaine</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Jour</th>
                                            {columns.map((col, index) => (
                                                <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>{col}</th>
                                            ))}
                                            <th style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}>Total semaine (h)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklyRecaps.map((recap, recapIndex) => (
                                            recap.timeSlots.map((slot, slotIndex) => (
                                                <tr key={`${recapIndex}-${slotIndex}`} style={{ backgroundColor: pastelColors[recapIndex % pastelColors.length] }}>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slotIndex === 0 ? recap.week : ''}</td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{slot.day}</td>
                                                    {slot.status ? (
                                                        <td style={{ border: '1px solid #ddd', padding: '8px' }} colSpan={columns.length}>{slot.status}</td>
                                                    ) : (
                                                        slot.values.map((value, idx) => (
                                                            <td key={idx} style={{ border: '1px solid #ddd', padding: '8px' }}>{value}</td>
                                                        ))
                                                    )}
                                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{recap.hours}</td>
                                                </tr>
                                            ))
                                        ))}
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: '700' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Total général</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}></td>
                                            {columns.map((_, index) => (
                                                <th key={index} style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '700' }}></th>
                                            ))}
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getEmployeeMonthlyRecapData(selectedEmployeeForMonthlyRecap).monthlyTotal.toFixed(1)} h</td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        })()}
                        <div className="button-group" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
                            <Button className="button-retour" onClick={() => {
                                setShowEmployeeMonthlyRecap(false);
                                setSelectedEmployeeForMonthlyRecap('');
                            }}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MonthlyRecapModals;