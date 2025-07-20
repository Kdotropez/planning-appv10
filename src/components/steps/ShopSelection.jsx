import React, { useState, useEffect } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '../../utils/localStorage';
import Button from '../common/Button';
import '@/assets/styles.css';

const ShopSelection = ({ shops, setShops, setSelectedShop, setStep, setFeedback }) => {
    const [shopInput, setShopInput] = useState('');
    const [localShops, setLocalShops] = useState(loadFromLocalStorage('shops', []));

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
    };

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
        setStep(3);
        setFeedback('Succès: Boutique sélectionnée.');
    };

    const handleBack = () => {
        console.log('ShopSelection: Retour button clicked');
        setStep(1);
    };

    console.log('ShopSelection: Rendering ShopSelection with shops:', localShops, 'selectedShop:', selectedShop);

    return (
        <div className="step-container">
            <h2>Choix de la boutique</h2>
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
            <div className="shop-list">
                {localShops.map((shop, index) => (
                    <div key={index} className="shop-item">
                        <span>{shop}</span>
                        <span
                            className="delete-icon"
                            onClick={() => handleDeleteShop(shop)}
                        >
                            ✕
                        </span>
                        <Button
                            className="button-primary"
                            onClick={() => handleSelectShop(shop)}
                        >
                            Sélectionner
                        </Button>
                    </div>
                ))}
            </div>
            <div className="button-group">
                <Button className="button-retour" onClick={handleBack}>
                    Retour
                </Button>
            </div>
        </div>
    );
};

export default ShopSelection;