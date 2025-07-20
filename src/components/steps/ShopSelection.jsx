import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '@/assets/styles.css';

const ShopSelection = ({ shops: propsShops, setShops: setPropsShops, selectedShop, setSelectedShop, onNext, onReset, setFeedback, setStep }) => {
    const [newShop, setNewShop] = useState('');
    const [localShops, setLocalShops] = useState(loadFromLocalStorage('shops', []));

    // Utiliser propsShops si fourni, sinon localShops
    const shops = propsShops !== undefined ? propsShops : localShops;
    const setShops = setPropsShops !== undefined ? setPropsShops : setLocalShops;

    // Synchroniser l'état avec localStorage au montage
    useEffect(() => {
        const storedShops = loadFromLocalStorage('shops', []);
        console.log('Initial shops from localStorage:', storedShops, 'propsShops:', propsShops);
        if (JSON.stringify(storedShops) !== JSON.stringify(shops)) {
            setShops(storedShops);
        }
    }, [shops, setShops]);

    const handleAddShop = () => {
        console.log('handleAddShop called with newShop:', newShop, 'current shops:', shops);
        if (!newShop.trim()) {
            setFeedback('Erreur: Le nom de la boutique ne peut pas être vide.');
            console.log('Add shop failed: Empty shop name');
            return;
        }
        const upperCaseShop = newShop.trim().toUpperCase();
        if (shops.includes(upperCaseShop)) {
            setFeedback('Erreur: Cette boutique existe déjà.');
            console.log('Add shop failed: Shop already exists', upperCaseShop);
            return;
        }
        const updatedShops = [...shops, upperCaseShop];
        console.log('Updating shops to:', updatedShops);
        saveToLocalStorage('shops', updatedShops);
        setShops(updatedShops);
        setNewShop('');
        setFeedback('Succès: Boutique ajoutée.');
    };

    const handleRemoveShop = (shop) => {
        console.log('handleRemoveShop called with shop:', shop);
        const updatedShops = shops.filter(s => s !== shop);
        saveToLocalStorage('shops', updatedShops);
        setShops(updatedShops);
        if (selectedShop === shop) {
            setSelectedShop('');
            saveToLocalStorage('lastPlanning', {});
        }
        setFeedback('Succès: Boutique supprimée.');
    };

    const handleSelectShop = (shop) => {
        console.log('handleSelectShop called with shop:', shop);
        setSelectedShop(shop);
        saveToLocalStorage('lastPlanning', { shop });
        setFeedback('');
    };

    const handleNext = () => {
        console.log('handleNext called with selectedShop:', selectedShop);
        if (!selectedShop) {
            setFeedback('Erreur: Veuillez sélectionner une boutique.');
            return;
        }
        console.log('Calling onNext with shop:', selectedShop);
        onNext(selectedShop);
        setStep(3);
    };

    const handleReset = () => {
        console.log('handleReset called in ShopSelection');
        setNewShop('');
        setSelectedShop('');
        saveToLocalStorage('shops', []);
        setShops([]);
        saveToLocalStorage('lastPlanning', {});
        setFeedback('Succès: Liste des boutiques réinitialisée.');
        console.log('Calling onReset with feedback:', 'Succès: Liste des boutiques réinitialisée.');
        onReset({ feedback: 'Succès: Liste des boutiques réinitialisée.' });
    };

    console.log('Rendering ShopSelection with shops:', shops, 'selectedShop:', selectedShop);

    return (
        <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '465px' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection de la boutique
            </h2>
            <div className="shop-input" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Ajouter une boutique
                </label>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => {
                        console.log('Input changed, newShop:', e.target.value);
                        setNewShop(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        console.log('Key down:', e.key);
                        if (e.key === 'Enter') handleAddShop();
                    }}
                    placeholder="Nom de la boutique"
                    className="shop-input-field"
                />
                <Button
                    text="Ajouter"
                    onClick={() => {
                        console.log('Add button clicked');
                        handleAddShop();
                    }}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px', marginTop: '10px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                />
            </div>
            <div className="shop-list" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px', maxHeight: '150px', overflowY: 'auto' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Boutiques disponibles
                </label>
                {shops.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucune boutique disponible.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {shops.map(shop => (
                            <li key={shop} className="shop-item">
                                <Button
                                    text={shop.toUpperCase()}
                                    onClick={() => handleSelectShop(shop)}
                                    style={{
                                        backgroundColor: selectedShop === shop ? '#f28c38' : '#f0f0f0',
                                        color: selectedShop === shop ? '#fff' : '#333',
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = selectedShop === shop ? '#d9742f' : '#e0e0e0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedShop === shop ? '#f28c38' : '#f0f0f0'}
                                >
                                    {shop.toUpperCase()}
                                    <span className="delete-icon" onClick={() => handleRemoveShop(shop)}>🗑️</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="button-group" style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: 'auto', width: '100%', maxWidth: '400px' }}>
                <Button
                    text="Retour"
                    onClick={() => {
                        console.log('Retour button clicked');
                        setStep(1);
                    }}
                    style={{ backgroundColor: '#000000', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                />
                <Button
                    text="Valider"
                    onClick={handleNext}
                    style={{ backgroundColor: '#4caf50', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                />
                <Button
                    text="Réinitialiser"
                    onClick={handleReset}
                    style={{ backgroundColor: '#e53935', color: '#fff', padding: '8px 16px', fontSize: '14px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c62828'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53935'}
                />
            </div>
            <p style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
                Klick-Planning - copyright © Nicolas Lefevre
            </p>
        </div>
    );
};

export default ShopSelection;