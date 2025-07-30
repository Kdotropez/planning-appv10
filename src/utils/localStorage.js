export const saveToLocalStorage = (key, value) => {
  try {
    console.log(`Saving to localStorage: ${key}`, value);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
};

export const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null || value === undefined) {
      console.log(`No data in localStorage for key: ${key}, returning default:`, defaultValue);
      return defaultValue;
    }
    const parsed = JSON.parse(value);
    console.log(`Loaded from localStorage: ${key}`, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error loading from localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

export const clearLocalStorage = () => {
  try {
    console.log('Clearing localStorage');
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};