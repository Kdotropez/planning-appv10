import React from 'react';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { loadFromLocalStorage } from '../../utils/localStorage';
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
    if (!showMonthlyRecapModal && !showEmployeeMonthlyRecap) return null;

    const monthStart = startOfMonth(new Date(selectedWeek));
    const monthEnd = endOfMonth(new Date(selectedWeek));
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
        .filter(week => isMonday(week))
        .map(week => format(week, 'yyyy-MM-dd'));

    const formatTimeRange = (employee, dayKey, timeSlots) => {
        console.log(`MonthlyRecapModals: Formatting time range for ${employee} on ${dayKey}`);
        const weekKey = format(startOfWeek(new Date(dayKey), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekPlanning = loadFromLocalStorage(`planning_${selectedShop}_${weekKey}`, planning);
        if (!weekPlanning[employee]?.[dayKey] || weekPlanning[employee][dayKey].every(slot => !slot)) {
            return { start: 'Congé', pause: '', resume: '', end: '', hours: '0.0 h' };
        }

        let start = null, pause = null, resume = null, end = null;
        let inShift = false;

        timeSlots.forEach((slot, index) => {
            const isChecked = weekPlanning[employee][dayKey][index];
            if (isChecked && !inShift) {
                start = slot;
                inShift = true;
            } else if (!isChecked && inShift && !pause) {
                pause = slot;
                inShift = false;
            } else if (isChecked && !inShift && pause) {
                resume = slot;
                inShift = true;
            } else if (!isChecked && inShift && resume) {
                end = slot;
                inShift = false;
            } else if (isChecked && index === timeSlots.length - 1) {
                end = timeSlots[index];
            }
        });

        if (inShift && !end) {
            end = timeSlots[timeSlots.length - 1];
        }

        const hours = calculateEmployeeDailyHours(employee, dayKey, weekPlanning);
        console.log(`MonthlyRecapModals: Time range for ${employee} on ${dayKey}:`, { start, pause, resume, end, hours });
        return {
            start: start || '-',
            pause: pause || '-',
            resume: resume || '-',
            end: end || '-',
            hours: `${hours.toFixed(1)} h`
        };
    };

    const recapData = [];
    let totalMonthHours = 0;

    if (showMonthlyRecapModal) {
        weeks.forEach(week => {
            const weekStart = new Date(week);
            const days = Array.from({ length: 7 }, (_, i) => ({
                name: format(addDays(weekStart, i), 'EEEE', { locale: fr }),
                date: format(addDays(weekStart, i), 'd MMMM', { locale: fr }),
                key: format(addDays(weekStart, i), 'yyyy-MM-dd')
            }));

            selectedEmployees.forEach(employee => {
                days.forEach(day => {
                    const { start, pause, resume, end, hours } = formatTimeRange(employee, day.key, config.timeSlots);
                    recapData.push({
                        employee,
                        day: `${day.name} ${day.date}`,
                        start,
                        pause,
                        resume,
                        end,
                        hours
                    });
                });
                const weeklyHours = calculateEmployeeWeeklyHours(employee, week, loadFromLocalStorage(`planning_${selectedShop}_${week}`, planning));
                recapData.push({
                    employee: `Total semaine ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`,
                    day: '',
                    start: '',
                    pause: '',
                    resume: '',
                    end: '',
                    hours: `${weeklyHours.toFixed(1)} h`
                });
                totalMonthHours += weeklyHours;
            });
        });
        recapData.push({
            employee: 'Total mois',
            day: '',
            start: '',
            pause: '',
            resume: '',
            end: '',
            hours: `${totalMonthHours.toFixed(1)} h`
        });
    } else if (showEmployeeMonthlyRecap) {
        weeks.forEach(week => {
            const weekStart = new Date(week);
            const days = Array.from({ length: 7 }, (_, i) => ({
                name: format(addDays(weekStart, i), 'EEEE', { locale: fr }),
                date: format(addDays(weekStart, i), 'd MMMM', { locale: fr }),
                key: format(addDays(weekStart, i), 'yyyy-MM-dd')
            }));

            days.forEach(day => {
                const { start, pause, resume, end, hours } = formatTimeRange(selectedEmployeeForMonthlyRecap, day.key, config.timeSlots);
                recapData.push({
                    employee: selectedEmployeeForMonthlyRecap,
                    day: `${day.name} ${day.date}`,
                    start,
                    pause,
                    resume,
                    end,
                    hours
                });
            });
            const weeklyHours = calculateEmployeeWeeklyHours(selectedEmployeeForMonthlyRecap, week, loadFromLocalStorage(`planning_${selectedShop}_${week}`, planning));
            recapData.push({
                employee: `Total semaine ${format(weekStart, 'd MMMM yyyy', { locale: fr })}`,
                day: '',
                start: '',
                pause: '',
                resume: '',
                end: '',
                hours: `${weeklyHours.toFixed(1)} h`
            });
            totalMonthHours += weeklyHours;
        });
        recapData.push({
            employee: 'Total mois',
            day: '',
            start: '',
            pause: '',
            resume: '',
            end: '',
            hours: `${totalMonthHours.toFixed(1)} h`
        });
    }

    console.log('MonthlyRecapModals: Generated recap data:', recapData);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                    Récapitulatif mensuel {showMonthlyRecapModal ? `- ${selectedShop}` : `de ${selectedEmployeeForMonthlyRecap}`}
                </h2>
                <table className="recap-table">
                    <thead>
                        <tr>
                            <th>Employé</th>
                            <th>Jour</th>
                            <th>ENTRÉE</th>
                            <th>PAUSE</th>
                            <th>RETOUR</th>
                            <th>SORTIE</th>
                            <th>Heures effectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recapData.map((row, index) => (
                            <tr key={index} className={row.employee.includes('Total') ? 'total-row' : ''}>
                                <td>{row.employee}</td>
                                <td>{row.day}</td>
                                <td>{row.start}</td>
                                <td>{row.pause}</td>
                                <td>{row.resume}</td>
                                <td>{row.end}</td>
                                <td>{row.hours}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Button
                    className="modal-close"
                    onClick={() => {
                        console.log('MonthlyRecapModals: Closing modal');
                        if (showMonthlyRecapModal) {
                            setShowMonthlyRecapModal(false);
                        } else {
                            setShowEmployeeMonthlyRecap(false);
                            setSelectedEmployeeForMonthlyRecap('');
                        }
                    }}
                >
                    ✕
                </Button>
            </div>
        </div>
    );
};

export default MonthlyRecapModals;