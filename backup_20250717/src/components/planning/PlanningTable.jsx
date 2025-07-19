import React from 'react';
import { format, addDays, addMinutes, parse, differenceInMinutes } from 'date-fns';
import '../../assets/styles.css';

const PlanningTable = ({ config, selectedWeek, planning, selectedEmployees, toggleSlot, currentDay }) => {
    const pastelColors = ['#e6f0fa', '#e6ffed', '#ffe6e6', '#d0f0fa', '#f0e6fa', '#fffde6', '#d6e6ff'];

    const formatTimeSlot = (time) => {
        if (!time || typeof time !== 'string' || !time.includes(':')) return '';
        const [hours, minutes] = time.split(':').map(part => part.trim());
        if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return '';
        return `${parseInt(hours)} h ${minutes.padStart(2, '0')}`;
    };

    const getEndTime = (startTime, interval) => {
        if (!startTime || !interval) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return '';
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'H:mm');
    };

    const calculateTotalHours = (employee, day) => {
        if (!planning?.[employee]?.[day]) {
            return 0;
        }
        return planning[employee][day].reduce((total, slot, index) => {
            if (!slot || !config.timeSlots[index]) return total;
            const timeSlot = config.timeSlots[index];
            if (!timeSlot || typeof timeSlot !== 'string') return total;
            const match = timeSlot.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            if (!match) return total;
            const [, start, end] = match;
            const startTime = parse(start, 'H:mm', new Date());
            const endTime = parse(end, 'H:mm', new Date());
            if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
            return total + (slot ? differenceInMinutes(endTime, startTime) / 60 : 0);
        }, 0).toFixed(1);
    };

    if (!config?.timeSlots || !Array.isArray(config.timeSlots) || config.timeSlots.length === 0) {
        return <p className="error" style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>Erreur: Configuration des tranches horaires non valide.</p>;
    }

    if (!selectedEmployees || selectedEmployees.length === 0) {
        return <p className="error" style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>Erreur: Aucun employé sélectionné.</p>;
    }

    return (
        <div className="table-container">
            <table className="planning-table">
                <thead>
                    <tr>
                        <th className="fixed-col header">DE</th>
                        {config.timeSlots.map((_, index) => (
                            <th key={`slot-${index}`} className="scrollable-col">{formatTimeSlot(config.timeSlots[index].split('-')[0])}</th>
                        ))}
                        <th className="fixed-col header">Total</th>
                    </tr>
                    <tr>
                        <th className="fixed-col header">À</th>
                        {config.timeSlots.map((_, index) => (
                            <th key={`slot-end-${index}`} className="scrollable-col">
                                {index < config.timeSlots.length - 1
                                    ? formatTimeSlot(config.timeSlots[index + 1].split('-')[0])
                                    : formatTimeSlot(getEndTime(config.timeSlots[config.timeSlots.length - 1].split('-')[0], config.interval))}
                            </th>
                        ))}
                        <th className="fixed-col header"></th>
                    </tr>
                </thead>
                <tbody>
                    {selectedEmployees.map((employee, empIndex) => (
                        <tr key={employee}>
                            <td className="fixed-col">{employee.toUpperCase()} ({calculateTotalHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'))} h)</td>
                            <td className="fixed-col"></td>
                            {config.timeSlots.map((slot, slotIndex) => {
                                const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                                const isChecked = planning?.[employee]?.[dayKey]?.[slotIndex] || false;
                                console.log(`Render cell - Employee: ${employee}, Day: ${dayKey}, Slot: ${slot}, SlotIndex: ${slotIndex}, IsChecked: ${isChecked}, Slots:`, planning?.[employee]?.[dayKey] || []);
                                return (
                                    <td
                                        key={`${employee}-slot-${slotIndex}`}
                                        className="scrollable-col"
                                        style={{
                                            backgroundColor: isChecked ? pastelColors[empIndex % pastelColors.length] : '#fff',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            console.log(`Click cell - Employee: ${employee}, Day: ${dayKey}, SlotIndex: ${slotIndex}, Slot: ${slot}`);
                                            toggleSlot(employee, slotIndex, currentDay);
                                        }}
                                    >
                                        {isChecked ? '✅' : ''}
                                    </td>
                                );
                            })}
                            <td className="fixed-col">{calculateTotalHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'))} h</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlanningTable;