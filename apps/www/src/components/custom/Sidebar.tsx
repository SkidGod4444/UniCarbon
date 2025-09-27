/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  faChartPie,
  faCoins,
  faHouse,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import KycForm from "./dashboard/sub-components/kycform";
import { useKyc } from "@/hooks/KycContext";

const Sidebar = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("All Projects");
  // const [kycStatus, setKycStatus] = useState<boolean | null>(null); // null = not submitted, false = pending, true = verified
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [showMainDialog, setShowMainDialog] = useState(false);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const { kycStatus } = useKyc();

  const menuItems = [
    { name: "All Projects", icon: faHouse, path: "/dashboard" },
  ];

  const accountItems = [
    { name: "Your Portfolio", icon: faChartPie, path: "/dashboard/portfolio" },
    { name: "Transaction History", icon: faRightLeft, path: "/dashboard/history" },
    { name: "Offset", icon: faCoins, path: "/offset" },
  ];

  const handleMenuClick = (item: any) => {
    const kycRequired = [
      "/dashboard/portfolio",
      "/dashboard/history",
      "/offset",
    ];

    if (kycRequired.includes(item.path)) {
      if (kycStatus === true) {
        setActiveMenu(item.name);
        navigate(item.path);
      } else if (kycStatus === false) {
        setShowMainDialog(true); // show pending dialog
      } else {
        setShowKycDialog(true); // prompt to start KYC
      }
    } else {
      setActiveMenu(item.name);
      navigate(item.path);
    }
  };

  return (
    <div className="left-0 z-20 relative h-full">
      {isSideBarOpen ? (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-1 -right-[31px] !size-8 rounded-l-none"
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
        >
          <X />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-1 -right-8 !size-8"
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
        >
          <Menu />
        </Button>
      )}

      <aside
        className={`${isSideBarOpen ? "w-[16rem]" : "hidden"} h-full bg-gray-100 border-r border-gray-200 flex flex-col justify-between`}
      >
        <div className="p-6">
          <Link
            to={"/"}
            className="mt-10 lg:mt-6 mb-12 text-center text-4xl text-black font-extrabold hover:!text-black"
          >
            Home
          </Link>

          <div className="space-y-6">
            <div className="flex flex-col items-start w-full">
              <h2 className="font-semibold text-gray-500 text-md mt-2">
                Marketplace
              </h2>
              <hr className="w-full h-[2px] bg-gray-200 mt-2" />
              <ul className="w-full space-y-2 mt-4">
                {menuItems.map((item) => (
                  <li
                    key={item.name}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${activeMenu === item.name
                      ? "bg-gray-200 font-semibold"
                      : "hover:bg-gray-200"
                      }`}
                    onClick={() => {
                      setActiveMenu(item.name);
                      navigate(item.path);
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                    <span className="text-black">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-start w-full pt-">
              <h2 className="font-semibold text-gray-500 text-md mb-">
                Your Account
              </h2>
              <hr className="w-full h-[2px] bg-gray-200 mt-2" />

              <ul className="w-full space-y-2 mt-4">
                {accountItems.map((item) => (
                  <li
                    key={item.name}
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${activeMenu === item.name
                      ? "bg-gray-200 font-semibold"
                      : "hover:bg-gray-200"
                      }`}
                    onClick={() => handleMenuClick(item)}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                    <span className="text-black">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button
            className="w-full text-lg"
            variant="default"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Dialog: Alert for completing KYC */}
      <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your KYC</DialogTitle>
            <DialogDescription>
              You need to complete and verify your KYC to access this feature.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setShowKycDialog(false);
              setShowMainDialog(true);
            }}
          >
            Complete KYC Now
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={kycStatus === false && showMainDialog} onOpenChange={setShowMainDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>KYC Under Review</DialogTitle>
            <DialogDescription>
              <div className="mt-6 p-6 border border-yellow-300 bg-yellow-50 rounded-xl text-center">
                <p className="text-lg font-medium text-yellow-800">⏳ KYC Under Review</p>
                <p className="text-sm text-yellow-700 mt-2">
                  Your KYC documents have been submitted. Our team is reviewing them.<br />
                  You will be notified once approved.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-4 w-full"
            onClick={() => setShowMainDialog(false)}
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>

      {/* KYC Form Dialog */}
      <KycForm open={showMainDialog} onOpenChange={setShowMainDialog} />
    </div>
  );
};

export default Sidebar;
