// src/utils/localStorage.js
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`Saved to localStorage: ${key}`, value);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde dans localStorage pour la clé ${key}:`, error);
  }
};

export const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null || value === "undefined") {
      console.log(`No data found in localStorage for ${key}, returning default`, defaultValue);
      return defaultValue;
    }
    const parsed = JSON.parse(value);
    console.log(`Loaded from localStorage: ${key}`, parsed);
    return parsed;
  } catch (error) {
    console.error(`Erreur lors du chargement depuis localStorage pour la clé ${key}:`, error);
    return defaultValue;
  }
};

export const saveShopBackup = (shop, data) => {
  saveToLocalStorage(`backup_${shop}`, {
    shop,
    employees: data.employees || [],
    timeSlotConfig: data.timeSlotConfig || {},
    weeks: data.weeks || {}
  });
};

export const loadShopBackup = (shop, defaultValue = {}) => {
  return loadFromLocalStorage(`backup_${shop}`, {
    shop,
    employees: [],
    timeSlotConfig: {},
    weeks: {},
    ...defaultValue
  });
};