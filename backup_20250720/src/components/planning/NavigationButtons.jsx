import React from 'react';
import Button from '../common/Button';
import '../../assets/styles.css';

const NavigationButtons = ({ onBack, onBackToShop, onBackToWeek, onBackToConfig, onReset }) => {
    return (
        <div className="navigation-buttons">
            <Button
                className="button-base button-primary"
                onClick={() => console.log('Exporter clicked')} // À remplacer par la fonction réelle
                text="Exporter"
            />
            <Button
                className="button-base button-primary"
                onClick={() => console.log('Importer clicked')} // À remplacer par la fonction réelle
                text="Importer"
            />
            <Button
                className="button-base button-retour"
                onClick={onBack}
                text="Retour Employés"
            />
            <Button
                className="button-base button-retour"
                onClick={onBackToShop}
                text="Retour Boutique"
            />
            <Button
                className="button-base button-retour"
                onClick={onBackToWeek}
                text="Retour Semaine"
            />
            <Button
                className="button-base button-retour"
                onClick={onBackToConfig}
                text="Retour Configuration"
            />
            <Button
                className="button-base button-reinitialiser"
                onClick={onReset}
                text="Réinitialiser"
            />
        </div>
    );
};

export default NavigationButtons;