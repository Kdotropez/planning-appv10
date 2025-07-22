import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../../assets/styles.css';

const DayButtons = ({ days, currentDay, setCurrentDay }) => {
    return (
        <div className="day-buttons">
            {days.map((day, index) => (
                <button
                    key={index}
                    className={`button-base button-jour ${currentDay === index ? 'selected' : ''}`}
                    onClick={() => setCurrentDay(index)}
                >
                    <div className="day-button-content">
                        <span>{day.name}</span>
                        <span>{day.date}</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default DayButtons;