import React from 'react';

const Button = ({ children, className, onClick, ...props }) => {
    const combinedClassName = `button ${className || ''}`.trim();
    return (
        <button className={combinedClassName} onClick={onClick} {...props}>
            {children}
        </button>
    );
};

export default Button;