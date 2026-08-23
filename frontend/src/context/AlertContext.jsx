/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);

    const showAlert = (message, type = "success") => {
        setAlert({ message, type });

        setTimeout(() => {
            setAlert(null);
        }, 3000);
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}

            <div className="fixed top-[80px] left-[80px] right-4 z-50 flex justify-end pointer-events-none">
                {alert && (
                    <div
                        className={`
                        pointer-events-auto
                        min-w-[300px] max-w-sm
                        bg-white border-l-4 shadow-lg rounded-lg
                        px-4 py-3 flex items-start gap-3
                        animate-slideIn
                        ${
                            alert.type === "success"
                                ? "border-green-500"
                                : alert.type === "error"
                                  ? "border-[#b62324]"
                                  : "border-blue-500"
                        }
                    `}
                    >
                        <p className="text-sm text-gray-800 flex-1">
                            {alert.message}
                        </p>

                        <button
                            onClick={() => setAlert(null)}
                            className="text-gray-400 hover:text-gray-700 text-lg font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </AlertContext.Provider>
    );
};
