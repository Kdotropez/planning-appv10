import '../../assets/styles.css';

const Button = ({ className, onClick, text, style, disabled }) => {
    return (
        <button
            className={`button-base ${className || ''}`}
            onClick={onClick || (() => {})}
            style={style || {}}
            disabled={disabled || false}
        >
            {text}
        </button>
    );
};

export default Button;