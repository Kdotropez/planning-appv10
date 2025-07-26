export const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans localStorage pour la clé ${key}:`, error);
    }
};

export const loadFromLocalStorage = (key, defaultValue) => {
    try {
        const value = localStorage.getItem(key);
        if (value === null || value === "undefined") {
            return defaultValue;
        }
        return JSON.parse(value);
    } catch (error) {
        console.error(`Erreur lors du chargement depuis localStorage pour la clé ${key}:`, error);
        return defaultValue;
    }
};