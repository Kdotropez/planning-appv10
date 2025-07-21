import { useState, useEffect } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import { importAllData } from '../../utils/backupUtils';
import Button from '../common/Button';
import '../../assets/styles.css';

const ShopSelection = ({ shops, setShops, setSelectedShop, setStep, setConfig, setSelectedWeek, setSelectedEmployees, setPlanning, setFeedback }) => {
    const [newShop, setNewShop] = useState('');
    const [localShops, setLocalShops] = useState(loadFromLocalStorage('shops', []));
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        console.log('ShopSelection: Initial shops from localStorage:', localShops, 'propsShops:', shops);
        if (shops.length > 0) {
            setLocalShops(shops);
            saveToLocalStorage('shops', shops);
        }
    }, [shops]);

    const handleAddShop = () => {
        const trimmedShop = newShop.trim().toUpperCase();
        if (!trimmedShop) {
            setFeedback('Erreur: Le nom de la boutique ne peut pas être vide.');
            console.error('Failed to add shop: Empty name');
            return;
        }
        if (localShops.includes(trimmedShop)) {
            setFeedback('Erreur: Cette boutique existe déjà.');
            console.error('Failed to add shop: Already exists', trimmedShop);
            return;
        }
        const newShops = [...localShops, trimmedShop];
        setLocalShops(newShops);
        setShops(newShops);
        saveToLocalStorage('shops', newShops);
        setNewShop('');
        setFeedback('Succès: Boutique ajoutée.');
        console.log('Shop added:', trimmedShop);
    };

    const handleDeleteShop = (shop) => {
        const newShops = localShops.filter(s => s !== shop);
        setLocalShops(newShops);
        setShops(newShops);
        saveToLocalStorage('shops', newShops);
        localStorage.removeItem(`employees_${shop}`);
        localStorage.removeItem(`lastPlanning_${shop}`);
        Object.keys(localStorage)
            .filter(key => key.startsWith(`planning_${shop}_`))
            .forEach(key => localStorage.removeItem(key));
        setFeedback('Succès: Boutique supprimée.');
        console.log('Shop deleted:', shop);
        if (selected === shop) {
            setSelected(null);
        }
    };

    const handleSelectShop = (shop) => {
        setSelected(shop);
        setSelectedShop(shop);
        setStep(3);
        setFeedback('Succès: Boutique sélectionnée.');
        console.log('Shop selected:', shop);
    };

    const handleImport = (event) => {
        console.log('handleImport triggered');
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            importAllData(file, setFeedback, setStep, setShops, setConfig, setSelectedShop, setSelectedWeek, setSelectedEmployees, setPlanning);
        } else {
            setFeedback('Erreur: Aucun fichier sélectionné.');
            console.error('No file selected');
        }
    };

    const handleReset = () => {
        setLocalShops([]);
        setShops([]);
        saveToLocalStorage('shops', []);
        localStorage.clear();
        setSelected(null);
        setFeedback('Succès: Liste des boutiques réinitialisée.');
        console.log('Shops reset');
    };

    const handleValidate = () => {
        if (!selected) {
            setFeedback('Erreur: Aucune boutique sélectionnée.');
            console.error('No shop selected for validation');
            return;
        }
        setSelectedShop(selected);
        setStep(3);
        setFeedback('Succès: Validation effectuée.');
        console.log('Validation successful:', selected);
    };

    console.log('Rendering ShopSelection with shops:', localShops);

    return (
        <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '465px' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection des boutiques
            </h2>
            <div className="shop-input" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Ajouter une boutique
                </label>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddShop(); }}
                    placeholder="Nom de la boutique"
                    className="shop-input-field"
                />
                <Button
                    className="button-validate"
                    onClick={handleAddShop}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px', marginTop: '10px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                >
                    Ajouter
                </Button>
            </div>
            <div className="form-group" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Importer une sauvegarde
                </label>
                <input type="file" accept=".json" onChange={handleImport} />
            </div>
            <div className="shop-list" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px', maxHeight: '200px', overflowY: 'auto' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Boutiques disponibles
                </label>
                {localShops.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune boutique disponible.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {localShops.map(shop => (
                            <li key={shop} className="shop-item">
                                <Button
                                    text={shop.toUpperCase()}
                                    onClick={() => handleSelectShop(shop)}
                                    style={{
                                        backgroundColor: selected === shop ? '#f28c38' : '#f0f0f0',
                                        color: selected === shop ? '#fff' : '#333',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = selected === shop ? '#d9742f' : '#e0e0e0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selected === shop ? '#f28c38' : '#f0f0f0'}
                                >
                                    {shop.toUpperCase()}
                                    <span className="delete-icon" onClick={() => handleDeleteShop(shop)}>🗑️</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="button-group" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: 'auto', width: '100%', maxWidth: '400px' }}>
                <Button
                    className="button-retour"
                    onClick={() => setStep(1)}
                    style={{ backgroundColor: '#000000', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                >
                    Retour
                </Button>
                <Button
                    className="button-validate"
                    onClick={handleValidate}
                    style={{ backgroundColor: '#4caf50', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                >
                    Valider
                </Button>
                <Button
                    className="button-reinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                >
                    Réinitialiser
                </Button>
            </div>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default ShopSelection;