import React, { useState, useEffect } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import { FaTrash } from 'react-icons/fa';
import '@/assets/styles.css';

const ShopSelection = ({ shops, setShops, setSelectedShop, setStep, setFeedback }) => {
    const [shopInput, setShopInput] = useState('');
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
        const trimmedShop = shopInput.trim().toUpperCase();
        if (!trimmedShop) {
            setFeedback('Erreur: Le nom de la boutique ne peut pas être vide.');
            return;
        }
        if (localShops.includes(trimmedShop)) {
            setFeedback('Erreur: Cette boutique existe déjà.');
            return;
        }
        const newShops = [...localShops, trimmedShop];
        setLocalShops(newShops);
        setShops(newShops);
        saveToLocalStorage('shops', newShops);
        setShopInput('');
        setFeedback('Succès: Boutique ajoutée.');
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
        if (selected === shop) {
            setSelected(null);
        }
    };

    const handleSelectShop = (shop) => {
        setSelected(shop);
        setSelectedShop(shop);
        setStep(3);
        setFeedback('Succès: Boutique sélectionnée.');
    };

    const handleReset = () => {
        setLocalShops([]);
        setShops([]);
        saveToLocalStorage('shops', []);
        localStorage.clear();
        setSelected(null);
        setFeedback('Succès: Liste des boutiques réinitialisée.');
    };

    const handleValidate = () => {
        if (!selected) {
            setFeedback('Erreur: Aucune boutique sélectionnée.');
            return;
        }
        setSelectedShop(selected);
        setStep(3);
        setFeedback('Succès: Validation effectuée.');
    };

    console.log('ShopSelection: Rendering ShopSelection with shops:', localShops);

    return (
        <div className="step-container">
            <h2>Sélection de la boutique</h2>
            <h3>Ajouter une boutique</h3>
            <div className="shop-input">
                <input
                    type="text"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    placeholder="Nom de la boutique"
                    className="shop-input-field"
                />
                <Button className="button-validate" onClick={handleAddShop}>
                    Ajouter
                </Button>
            </div>
            <h3>Boutiques disponibles</h3>
            <div className="shop-list">
                {localShops.map((shop, index) => (
                    <div key={index} className="shop-item">
                        <span
                            className={`button-jour ${selected === shop ? 'selected' : ''}`}
                            onClick={() => handleSelectShop(shop)}
                            style={{ cursor: 'pointer', padding: '10px 20px', display: 'inline-block', fontSize: '16px', fontWeight: '500' }}
                        >
                            {shop}
                        </span>
                        <span
                            className="delete-icon"
                            onClick={() => handleDeleteShop(shop)}
                            style={{ fontSize: '20px', marginLeft: '15px', color: '#e53935', cursor: 'pointer' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#c62828'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#e53935'}
                        >
                            <FaTrash />
                        </span>
                    </div>
                ))}
            </div>
            <div className="button-group">
                <Button className="button-retour" onClick={() => setStep(1)}>
                    Retour
                </Button>
                <Button className="button-validate" onClick={handleValidate}>
                    Valider
                </Button>
                <Button className="button-reinitialiser" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#333' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default ShopSelection;