import PropTypes from 'prop-types';
import '../../assets/styles.css';

const Button = ({ className, onClick, text, style, onMouseOver, onMouseOut, disabled }) => {
    return (
        <button
            className={`button-base ${className || ''}`}
            onClick={onClick}
            style={style}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
    style: PropTypes.object,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func,
    disabled: PropTypes.bool
};

Button.defaultProps = {
    className: '',
    onClick: () => {},
    style: {},
    onMouseOver: () => {},
    onMouseOut: () => {},
    disabled: false
};

export default Button;