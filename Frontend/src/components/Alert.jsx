import { useEffect, useState } from "react";
import Button from "./Button";

export const Alert = ({ heading, text, isVisible, onClose, type }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const status = {
        success: "bg-green-500",
        failure: "bg-red-600"
    }

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            setTimeout(() => setShouldRender(false), 300);
        }
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div className={`absolute left-0 top-0 z-50 flex min-h-dvh w-full items-center justify-center bg-slate-950 text-center backdrop-blur-sm transition-all duration-300 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`}>
            <div className={`surface-panel w-[min(92vw,26rem)] rounded-2xl p-5 pt-7 transition-all duration-300 transform ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                <h1 className='text-base font-bold text-slate-950'>{heading}</h1>
                <p className='mt-4 mb-6 text-pretty text-sm font-normal leading-6 text-slate-600'>{text}</p>
                <Button
                    title={"Okay"}
                    fun={onClose}
                    classes={type && status[type]}
                />
            </div>
        </div>
    );
};
