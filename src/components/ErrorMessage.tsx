interface ErrorMessageProps {
    message: string;
    onClose: () => void;
}

export const ErrorMessage = ({ message, onClose }: ErrorMessageProps) => {
    return (
        <div className="error-message">
            {message}
            <button onClick={onClose} className="close-error">
                ×
            </button>
        </div>
    );
};