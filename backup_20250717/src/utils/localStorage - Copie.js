export const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Saved to localStorage: ${key}`, data);
    } catch (error) {
        console.error('Erreur localStorage (save):', error);
    }
};

export const loadFromLocalStorage = (key, defaultValue) => {
    try {
        const data = localStorage.getItem(key);
        if (data === null || data === '') {
            return defaultValue;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur localStorage (load):', error);
        return defaultValue;
    }
};

export const cleanLocalStorage = () => {
    const validKeys = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
            key.startsWith('shops') ||
            key.startsWith('employees_') ||
            key.startsWith('selectedWeek') ||
            key.startsWith('timeSlotConfig') ||
            key.startsWith('copied_') ||
            (key.startsWith('planning_') && dateRegex.test(key.split('_')[2])) ||
            (key.startsWith('lastPlanning_') && key.split('_').length === 3)
        ) {
            validKeys.push(key);
        }
    }
    Object.keys(localStorage).forEach(key => {
        if (!validKeys.includes(key)) {
            localStorage.removeItem(key);
            console.log(`Removed invalid key from localStorage: ${key}`);
        }
    });
};