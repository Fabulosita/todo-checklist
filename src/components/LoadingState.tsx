interface LoadingStateProps {
    message?: string;
}

export const LoadingState = ({ message = "Loading your todos..." }: LoadingStateProps) => {
    return (
        <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{message}</p>
        </div>
    );
};