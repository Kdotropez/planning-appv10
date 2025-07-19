import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { calculateShopWeeklyHours, calculateShopMonthlyHours } from '../../utils/planningUtils';
import Button from '../common/Button';
import '../../assets/styles.css';

const RecapButtons = ({ selectedShop, selectedWeek, selectedEmployees, planning, config, setShowRecapModal, setShowMonthlyRecapModal, setShowEmployeeMonthlyRecap, setSelectedEmployeeForMonthlyRecap }) => {
    const handleEmployeeRecap = (employee) => {
        setShowRecapModal(employee);
    };

    const handleWeekRecap = () => {
        setShowRecapModal('week');
    };

    const handleMonthlyRecap = () => {
        setShowMonthlyRecapModal(true);
    };

    const handleEmployeeMonthlyRecap = (employee) => {
        setSelectedEmployeeForMonthlyRecap(employee);
        setShowEmployeeMonthlyRecap(true);
    };

    return (
        <div className="recap-buttons">
            <Button
                className="button-base button-recap"
                onClick={handleWeekRecap}
                text={`Récapitulatif Semaine (${calculateShopWeeklyHours(selectedWeek, selectedShop, planning, config, selectedEmployees)} h)`}
            />
            <Button
                className="button-base button-recap"
                onClick={handleMonthlyRecap}
                text={`Récapitulatif Mensuel (${calculateShopMonthlyHours(selectedWeek, selectedShop, planning, config, selectedEmployees)} h)`}
            />
            {selectedEmployees.map((employee, index) => (
                <Button
                    key={index}
                    className="button-base button-recap"
                    onClick={() => handleEmployeeRecap(employee)}
                    text={`Récap ${employee}`}
                />
            ))}
            {selectedEmployees.map((employee, index) => (
                <Button
                    key={index}
                    className="button-base button-recap"
                    onClick={() => handleEmployeeMonthlyRecap(employee)}
                    text={`Récap Mensuel ${employee}`}
                />
            ))}
        </div>
    );
};

export default RecapButtons;