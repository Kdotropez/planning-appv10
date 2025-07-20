import { useState, useEffect, useRef } from 'react';
import { format, addDays, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import '@/assets/styles.css';

const PlanningTable = ({ config, selectedWeek, planning, selectedEmployees, toggleSlot, currentDay, calculateEmployeeDailyHours }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragValue, setDragValue] = useState(null);
    const [hoveredCells, setHoveredCells] = useState([]);
    const tableRef = useRef(null);

    const getEndTime = (startTime, interval) => {
        if (!startTime) return '-';
        const [hours, minutes] = startTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, hours, minutes);
        return format(addMinutes(date, interval), 'HH:mm');
    };

    const handleMouseDown = (employee, slotIndex, dayIndex, event) => {
        if (event.type !== 'mousedown') return;
        event.preventDefault(); // Empêche le comportement par défaut (ex. : sélection de texte)
        console.log('handleMouseDown called:', { employee, slotIndex, dayIndex });
        setIsDragging(true);
        setDragStart({ employee, slotIndex, dayIndex });

        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const currentValue = planning[employee]?.[dayKey]?.[slotIndex] || false;
        setDragValue(!currentValue);
        setHoveredCells([{ employee, slotIndex, dayIndex }]);

        if (typeof toggleSlot === 'function') {
            toggleSlot(employee, slotIndex, dayIndex, !currentValue);
        } else {
            console.error('toggleSlot is not a function:', toggleSlot);
        }
    };

    const handleMouseMove = (employee, slotIndex, dayIndex, event) => {
        if (!isDragging || !dragStart || event.type !== 'mousemove') return;
        if (employee !== dragStart.employee || dayIndex !== dragStart.dayIndex) return;
        event.preventDefault(); // Empêche le scroll par défaut
        console.log('handleMouseMove called:', { employee, slotIndex, dayIndex, dragValue });

        // Mettre à jour les cellules survolées pour le feedback visuel
        const startIdx = Math.min(dragStart.slotIndex, slotIndex);
        const endIdx = Math.max(dragStart.slotIndex, slotIndex);
        const newHoveredCells = [];
        for (let i = startIdx; i <= endIdx; i++) {
            newHoveredCells.push({ employee, slotIndex: i, dayIndex });
        }
        setHoveredCells(newHoveredCells);

        // Appliquer le changement aux cellules survolées
        if (typeof toggleSlot === 'function') {
            for (let i = startIdx; i <= endIdx; i++) {
                toggleSlot(employee, i, dayIndex, dragValue);
            }
        } else {
            console.error('toggleSlot is not a function:', toggleSlot);
        }
    };

    const handleMouseUp = () => {
        console.log('handleMouseUp called');
        setIsDragging(false);
        setDragStart(null);
        setDragValue(null);
        setHoveredCells([]);
    };

    const handleTouchStart = (employee, slotIndex, dayIndex, event) => {
        event.preventDefault();
        console.log('handleTouchStart called:', { employee, slotIndex, dayIndex });
        setIsDragging(true);
        setDragStart({ employee, slotIndex, dayIndex });

        const dayKey = format(addDays(new Date(selectedWeek), dayIndex), 'yyyy-MM-dd');
        const currentValue = planning[employee]?.[dayKey]?.[slotIndex] || false;
        setDragValue(!currentValue);
        setHoveredCells([{ employee, slotIndex, dayIndex }]);

        if (typeof toggleSlot === 'function') {
            toggleSlot(employee, slotIndex, dayIndex, !currentValue);
        } else {
            console.error('toggleSlot is not a function:', toggleSlot);
        }
    };

    const handleTouchMove = (employee, slotIndex, dayIndex, event) => {
        if (!isDragging || !dragStart || event.type !== 'touchmove') return;
        event.preventDefault(); // Empêche le scroll par défaut
        console.log('handleTouchMove called:', { employee, slotIndex, dayIndex, dragValue });

        // Mettre à jour les cellules survolées pour le feedback visuel
        const startIdx = Math.min(dragStart.slotIndex, slotIndex);
        const endIdx = Math.max(dragStart.slotIndex, slotIndex);
        const newHoveredCells = [];
        for (let i = startIdx; i <= endIdx; i++) {
            newHoveredCells.push({ employee, slotIndex: i, dayIndex });
        }
        setHoveredCells(newHoveredCells);

        // Appliquer le changement aux cellules survolées
        if (typeof toggleSlot === 'function') {
            for (let i = startIdx; i <= endIdx; i++) {
                toggleSlot(employee, i, dayIndex, dragValue);
            }
        } else {
            console.error('toggleSlot is not a function:', toggleSlot);
        }
    };

    const handleTouchEnd = () => {
        console.log('handleTouchEnd called');
        setIsDragging(false);
        setDragStart(null);
        setDragValue(null);
        setHoveredCells([]);
    };

    // Désactiver les interactions pendant le scroll
    useEffect(() => {
        const table = tableRef.current;
        let isScrolling = false;
        let scrollTimeout = null;

        const handleScroll = () => {
            isScrolling = true;
            setIsDragging(false); // Désactiver le drag pendant le scroll
            setHoveredCells([]);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150); // Réactiver après 150ms d'inactivité
        };

        if (table) {
            table.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (table) {
                table.removeEventListener('scroll', handleScroll);
            }
            clearTimeout(scrollTimeout);
        };
    }, []);

    const days = Array.from({ length: 7 }, (_, i) => ({
        name: format(addDays(new Date(selectedWeek), i), 'EEEE', { locale: fr }),
        date: format(addDays(new Date(selectedWeek), i), 'd MMMM', { locale: fr }),
    }));

    const getEmployeeColorClass = (index) => {
        const colors = ['employee-0', 'employee-1', 'employee-2', 'employee-3', 'employee-4', 'employee-5', 'employee-6'];
        return colors[index % colors.length];
    };

    const isCellHovered = (employee, slotIndex, dayIndex) => {
        return hoveredCells.some(cell => cell.employee === employee && cell.slotIndex === slotIndex && cell.dayIndex === dayIndex);
    };

    return (
        <div className="table-container" style={{ width: '100%', overflowX: 'auto' }} ref={tableRef} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchEnd={handleTouchEnd}>
            <table className="planning-table" style={{ width: '100%', tableLayout: 'auto' }}>
                <thead>
                    <tr>
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}>DE</th>
                        {config.timeSlots.map((slot, index) => (
                            <th key={slot} className="scrollable-col" style={{ minWidth: '60px' }}>{slot}</th>
                        ))}
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}>Total</th>
                    </tr>
                    <tr>
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}>À</th>
                        {config.timeSlots.map((slot, index) => (
                            <th key={slot} className="scrollable-col" style={{ minWidth: '60px' }}>
                                {index < config.timeSlots.length - 1
                                    ? config.timeSlots[index + 1]
                                    : getEndTime(config.timeSlots[config.timeSlots.length - 1], config.interval)}
                            </th>
                        ))}
                        <th className="fixed-col header" style={{ width: '150px', minWidth: '150px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {selectedEmployees.map((employee, employeeIndex) => (
                        <tr key={employee}>
                            <td className={`fixed-col employee ${getEmployeeColorClass(employeeIndex)}`} style={{ width: '150px', minWidth: '150px' }}>{employee}</td>
                            {config.timeSlots.map((_, slotIndex) => {
                                const dayKey = format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd');
                                const isChecked = planning[employee]?.[dayKey]?.[slotIndex] || false;
                                const isHovered = isCellHovered(employee, slotIndex, currentDay);
                                return (
                                    <td
                                        key={slotIndex}
                                        className={`scrollable-col ${isChecked ? `clicked-${employeeIndex % 7}` : ''} ${isHovered ? 'hovered' : ''}`}
                                        style={{ minWidth: '60px' }}
                                        onMouseDown={(e) => handleMouseDown(employee, slotIndex, currentDay, e)}
                                        onMouseMove={(e) => handleMouseMove(employee, slotIndex, currentDay, e)}
                                        onTouchStart={(e) => handleTouchStart(employee, slotIndex, currentDay, e)}
                                        onTouchMove={(e) => handleTouchMove(employee, slotIndex, currentDay, e)}
                                    >
                                        {isChecked ? '✅' : ''}
                                    </td>
                                );
                            })}
                            <td className="scrollable-col" style={{ minWidth: '150px' }}>
                                {calculateEmployeeDailyHours(employee, format(addDays(new Date(selectedWeek), currentDay), 'yyyy-MM-dd'), planning).toFixed(1)} h
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlanningTable;