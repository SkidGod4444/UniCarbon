/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/authcontext";
import { MoveRight } from "lucide-react";
import KycForm from "./dashboard/sub-components/kycform";
import { useKyc } from "@/hooks/kyccontext";

function Navbar() {
    // State for managing mobile menu visibility
    const [menuOpen, setMenuOpen] = useState(false);
    const {kycDetails, kycStatus} = useKyc()

    // const [kycDetails, setKycDetails] = useState<KycDetailsType>(null);
    const [showKycDialog, setShowKycDialog] = useState(false);
    //Auth Hook 
    const { user, handleLogout } = useAuth()
    // Access location and navigate for routing
    const location = useLocation();
    const navigate = useNavigate();


    // Handle the navigation to the app
    // const handleGoToApp = () => {
    //     navigate("/dashboard");
    // }


    // Handle navigation and close menu for mobile
    const handleNavigate = (path: string) => {
        navigate(path);
        setMenuOpen(false); // Close menu on selection
    };
    return (
        <nav className="relative min-w-full flex items-center flex-col">
            {/* Left container: Logo */}
            <div className="flex container items-center justify-between w-full px-4 py-4 md:py-4">
                <button className="text-3xl font-black bg-transparent md:text-5xl p-0" onClick={() => (navigate('/'))}>UniCarbon</button>

                {/* Mobile menu button */}
                <div className="flex items-center md:hidden">
                    <Button size={"icon"}
                        className="swap-rotate "
                        onClick={() => {
                            setMenuOpen(!menuOpen);
                        }}
                    >
                        {/* Hamburger icon */}
                        {!menuOpen ? (
                            <svg
                                className="fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 512 512"
                            >
                                <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                            </svg>
                        ) : (
                            /* Close icon */
                            <svg
                                className="fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 512 512"
                            >
                                <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                            </svg>
                        )}
                    </Button>
                </div>

                {/* Right container: Navigation and buttons */}
                <div
                    className={`${menuOpen ? "flex" : "hidden"
                        } flex-col md:flex md:flex-row items-center md:gap-4 absolute md:relative top-full left-0 w-full md:w-auto bg-white md:bg-transparent z-10 p-4 md:p-0 md:space-x-4 `}
                >
                    {/* Navigation links */}
                    <div className="flex flex-col gap-4 md:flex-row md:gap-8 md:mr-2">
                        {["Home"].map((item, index) => (
                            <span key={index}
                                className={`text-base md:text-md hover:cursor-pointer hover:underline hover:underline-offset-2 ${location.pathname ===
                                    `/${item.toLowerCase().replace(/\s+/g, "-")}`
                                    ? "underline"
                                    : ""
                                    }`}
                                onClick={() => {
                                    if (item === "Home") {
                                        handleNavigate("/");
                                    } else {
                                        handleNavigate(`/${item.toLowerCase().replace(/\s+/g, "-")}`);
                                    }
                                }}>
                                {item}
                            </span>
                        ))}
                    </div>

                    {/* kyc, Wallet and App buttons */}
                    <div className="flex flex-col items-center gap-4 mt-4 md:flex-row md:mt-0">
                        {user ? <>
                            <button onClick={handleLogout} className="flex flex-row bg-black items-center gap-x-3 px-4 py-2 !rounded-[10px] h-[40px] font-semibold text-white">
                                <p>Sign out</p>
                            </button>

                            {/* // kyc status update */}
                            {kycDetails ? (
                               kycStatus === false ? (
                                    <div>
                                        <Button
                                            onClick={() => setShowKycDialog(true)}
                                            className="flex flex-row items-center gap-x-3 px-4 py-2 !rounded-[10px] h-[40px] font-semibold bg-green-500 hover:bg-green-500/80 text-white justify-center hover:underline underline-offset-2 transition-all duration-300 text-md"
                                        >
                                            Your KYC is in Process <MoveRight />
                                        </Button>
                                    </div>
                                ) : null
                            ) : (
                                <div className="hover:underline-offset-4">
                                    <Button
                                        onClick={() => setShowKycDialog(true)}
                                        variant="destructive"
                                        className="flex flex-row items-center gap-x-3 px-4 py-2 !rounded-[10px] h-[40px] font-semibold text-white justify-center hover:underline underline-offset-2 transition-all duration-300 text-md"
                                    >
                                        Complete your KYC <MoveRight />
                                    </Button>
                                </div>
                            )}


                        </> : <>

                            <button onClick={() => navigate('/login')}
                                className="flex flex-row bg-black items-center gap-x-3 px-4 py-2 !rounded-[10px] h-[40px] font-semibold text-white"
                            >
                                <p>Sign in</p>
                            </button>
                        </>}
                        {/* Conditionally render "Exira App" button */}
                        {!location.pathname.includes("/dashboard") && (
                            <>
                                {user ? (
                                    <button onClick={() => navigate('/dashboard')}
                                        className="flex flex-row bg-black items-center gap-x-3 px-4 py-2 !rounded-[10px] h-[40px] font-semibold text-white"
                                    >
                                        <p>App</p>
                                        <FontAwesomeIcon icon={faChevronRight} size="2xs" />
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>
                    <KycForm open={showKycDialog} onOpenChange={setShowKycDialog} />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;