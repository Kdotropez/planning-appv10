import { useState } from 'react';
import { format, addDays, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../../assets/styles.css';

const PlanningTable = ({ config, selectedWeek, planning, selectedEmployees, toggleSlot, currentDay, calculateEmployeeDailyHours }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragValue, setDragValue] = useState(null);
    let clickTimeout = null;

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const handleMouseDown = (employee, slotIndex, dayIndex, event) => {
        if (event.type !== 'mousedown') return;
        console.log('handleMouseDown called:', { employee, slotIndex, dayIndex });
        setIsDragging(true);
        setDragStart({ employee, slotIndex, dayIndex });

        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const currentValue = planning[employee]?.[dayKey]?.[slotIndex] || false;
        setDragValue(!currentValue);

        clickTimeout = setTimeout(() => {
            if (typeof toggleSlot === 'function') {
                console.log('Simulating single click:', { employee, slotIndex, dayIndex, currentValue });
                toggleSlot(employee, slotIndex, dayIndex, !currentValue);
            } else {
                console.error('toggleSlot is not a function:', toggleSlot);
            }
        }, 100);
    };

    const handleMouseMove = (employee, slotIndex, dayIndex, event) => {
        if (!isDragging || !dragStart || event.type !== 'mousemove') return;
        if (employee !== dragStart.employee || dayIndex !== dragStart.dayIndex) return;
        clearTimeout(clickTimeout);
        console.log('handleMouseMove called:', { employee, slotIndex, dayIndex, dragValue });
        if (typeof toggleSlot === 'function') {
            toggleSlot(employee, slotIndex, dayIndex, dragValue);
        } else {
            console.error('toggleSlot is not a function:', toggleSlot);
        }
    };

    const handleMouseUp = () => {
        console.log('handleMouseUp called');
        clearTimeout(clickTimeout);
        setIsDragging(false);
        setDragStart(null);
        setDragValue(null);
    };

    const handleTouchStart = (employee, slotIndex, dayIndex, event) => {
        console.log('handleTouchStart called:', { employee, slotIndex, dayIndex });
        event.preventDefault();
        if (typeof toggleSlot !== 'function') {
            console.error('toggleSlot is not a function:', toggleSlot);
            return;
        }
        if (!planning || !selectedWeek || currentDay === undefined || !selectedEmployees) {
            console.error('Invalid props:', { planning, selectedWeek, currentDay, selectedEmployees });
            return;
        }
        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const currentValue = planning[employee]?.[dayKey]?.[slotIndex] || false;
        console.log('Toggling slot:', { employee, dayKey, slotIndex, currentValue });
        toggleSlot(employee, slotIndex, dayIndex, !currentValue);
    };

    const days = Array.from({ length: 7 }, (_, i) => ({
        name: format(addDays(new Date(selectedWeek), i), 'EEEE', { locale: fr }),
        date: format(addDays(new Date(selectedWeek), i), 'd MMMM', { locale: fr }),
    }));

    const getEmployeeColorClass = (index) => {
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return colors[index % colors.length];
    };

    console.log('PlanningTable props:', { config, selectedWeek, planning, selectedEmployees, currentDay });

    return (
        <div className="table-container" style={{ maxWidth: '1600px', margin: '0 auto' }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <table className="planning-table" style={{ width: '100%', tableLayout: 'auto' }}>
                <thead>
                    <tr>
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}>DE</th>
                        {(config.timeSlots || []).map((slot, index) => (
                            <th key={slot} className="scrollable-col" style={{ minWidth: '30px' }}>
                                {typeof slot === 'string' ? slot : slot.start}
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}>À</th>
                        {(config.timeSlots || []).map((slot, index) => (
                            <th key={slot} className="scrollable-col" style={{ minWidth: '30px' }}>
                                {index < config.timeSlots.length - 1
                                    ? (typeof config.timeSlots[index + 1] === 'string' ? config.timeSlots[index + 1] : config.timeSlots[index + 1].start)
                                    : getEndTime(typeof slot === 'string' ? slot : slot.start, config.interval || 30)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(selectedEmployees || []).map((employee, employeeIndex) => {
                        const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                        const hours = calculateEmployeeDailyHours(employee, dayKey, planning);
                        console.log('Employee hours:', { employee, dayKey, hours });
                        return (
                            <tr key={employee}>
                                <td className={`fixed-col employee ${getEmployeeColorClass(employeeIndex)}`} style={{ width: '150px', minWidth: '150px' }}>
                                    {employee} {hours !== undefined && hours !== null ? `(${hours.toFixed(1)} h)` : '(0.0 h)'}
                                </td>
                                {(config.timeSlots || []).map((_, slotIndex) => {
                                    const isChecked = planning[employee]?.[dayKey]?.[slotIndex] || false;
                                    return (
                                        <td
                                            key={slotIndex}
                                            className={`scrollable-col ${isChecked ? `clicked-${employeeIndex % 7}` : ''}`}
                                            style={{ minWidth: '30px' }}
                                            onTouchStart={(e) => handleTouchStart(employee, slotIndex, currentDay, e)}
                                            onMouseDown={(e) => handleMouseDown(employee, slotIndex, currentDay, e)}
                                            onMouseMove={(e) => handleMouseMove(employee, slotIndex, currentDay, e)}
                                        >
                                            {isChecked ? '✅' : ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PlanningTable;