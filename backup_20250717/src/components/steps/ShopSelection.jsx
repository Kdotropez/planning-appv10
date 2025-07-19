import React, { useState } from 'react';
import Button from '../common/Button';
import { saveToLocalStorage, loadFromLocalStorage } from '../../utils/localStorage';
import '../../assets/styles.css';

const ShopSelection = ({ selectedShop, setSelectedShop, setStep, setFeedback }) => {
    const [newShop, setNewShop] = useState('');
    const shops = loadFromLocalStorage('shops', []) || [];

    const handleAddShop = () => {
        if (!newShop.trim()) {
            setFeedback('Erreur: Le nom du magasin ne peut pas être vide.');
            return;
        }
        if (shops.includes(newShop)) {
            setFeedback('Erreur: Ce magasin existe déjà.');
            return;
        }
        const updatedShops = [...shops, newShop];
        saveToLocalStorage('shops', updatedShops);
        setNewShop('');
        setFeedback('Succès: Magasin ajouté.');
    };

    const handleRemoveShop = (shop) => {
        const updatedShops = shops.filter(s => s !== shop);
        saveToLocalStorage('shops', updatedShops);
        if (selectedShop === shop) {
            setSelectedShop('');
        }
        setFeedback('Succès: Magasin supprimé.');
    };

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
    };

    const handleNext = () => {
        if (!selectedShop) {
            setFeedback('Erreur: Veuillez sélectionner un magasin.');
            return;
        }
        setStep(3);
        setFeedback('Succès: Magasin validé.');
    };

    const handleReset = () => {
        setNewShop('');
        setSelectedShop('');
        saveToLocalStorage('shops', []);
        setFeedback('Succès: Liste des magasins réinitialisée.');
    };

    console.log('Rendering ShopSelection with shops:', shops, 'selectedShop:', selectedShop);

    return (
        <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginBottom: '15px' }}>
                Sélection du magasin
            </h2>
            <div className="shop-input" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Ajouter un magasin
                </label>
                <input
                    type="text"
                    value={newShop}
                    onChange={(e) => setNewShop(e.target.value)}
                    placeholder="Nom du magasin"
                    className="shop-input-field"
                />
                <Button
                    text="Ajouter"
                    onClick={handleAddShop}
                    style={{ backgroundColor: '#1e88e5', color: '#fff', padding: '8px 16px', fontSize: '14px', marginTop: '10px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
                />
            </div>
            <div className="shop-list" style={{ marginBottom: '15px', width: '100%', maxWidth: '400px' }}>
                <label style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    Magasins disponibles
                </label>
                {shops.length === 0 ? (
                    <p style={{ fontFamily: 'Roboto, sans-serif', color: '#e53935', textAlign: 'center' }}>
                        Aucun magasin disponible.
                    </p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {shops.map(shop => (
                            <li key={shop} className="shop-item">
                                <Button
                                    text={shop}
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
                                    {shop}
                                    <span className="delete-icon" onClick={() => handleRemoveShop(shop)}>🗑️</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="button-group" style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px', width: '100%', maxWidth: '400px' }}>
                <Button
                    text="Retour"
                    onClick={() => setStep(1)}
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