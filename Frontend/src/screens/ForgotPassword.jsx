import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Input } from '../components';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import Console from '../utils/console';
import axios from 'axios';
import useCooldownTimer from '../hooks/useCooldownTimer';
import mailImg from "/mail.png";
import { ArrowLeft } from 'lucide-react';
import { useAlert } from '../hooks/useAlert';
import { Alert } from '../components';
import { getApiErrorMessage } from '../utils/apiError';

const allowedParams = ["user", "captain"];

function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    // const alert
    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm();

    const navigation = useNavigate();
    const { userType } = useParams();
    const { alert, showAlert, hideAlert } = useAlert();
    const { timeLeft, isActive, startCooldown } = useCooldownTimer(60000, 'forgot-password-cooldown');

    if (!allowedParams.includes(userType)) {
        return <Navigate to={'/not-found'} replace />
    }

    const forgotPassword = async (data) => {
        if (data.email.trim() !== "") {
            try {
                setLoading(true);
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/mail/${userType}/reset-password`,
                    data
                );
                Console.log(response);
                showAlert('Reset password email sent successfully!', 'Please check your inbox and click on the received link to reset the password', 'success');
                startCooldown();

            } catch (error) {
                showAlert('Some error occured', getApiErrorMessage(error), 'failure');
                Console.log(getApiErrorMessage(error));
            } finally {
                setLoading(false);
            }
        }
    }

    const getButtonTitle = () => {
        if (isActive) {
            return `Wait ${timeLeft}s`;
        }
        return "Reset Password";
    };

    return (
        <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_#dcfce7,_transparent_32%),linear-gradient(135deg,_#f8fafc,_#ecfeff)] p-4 text-center sm:grid sm:place-items-center sm:p-8">
            <Alert
                heading={alert.heading}
                text={alert.text}
                isVisible={alert.isVisible}
                onClose={hideAlert}
                type={alert.type}
            />
            <div className="mx-auto w-full max-w-lg rounded-md border border-slate-200 bg-white/95 p-5 shadow-xl sm:p-8">
            <div className="flex gap-3">
                <ArrowLeft
                    strokeWidth={3}
                    className="mt-[5px] cursor-pointer"
                    onClick={() => navigation(-1)}
                />
            </div>
            <div className="px-2">
                <h1 className="text-2xl font-bold">Forgot your Password?</h1>
                <p className="text-sm mt-3 text-zinc-600 text-balance">
                    Enter your registered email below to receive password reset link
                </p>
                <img src={mailImg} alt="Verify Email" className="h-36 mx-auto my-8" />

                <form onSubmit={handleSubmit(forgotPassword)}>
                    <Input
                        placeholder={"example@gmail.com"}
                        type={"email"}
                        name={"email"}
                        register={register}
                        error={errors.email}
                    />

                    <Button
                        title={getButtonTitle()}
                        loading={loading}
                        loadingMessage={"Sending..."}
                        type="submit"
                        disabled={loading || isActive}
                    />
                </form>
            </div>
            </div>
        </div>
    )
}

export default ForgotPassword
