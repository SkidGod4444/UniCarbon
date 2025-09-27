// import {
//   faChartPie,
//   faCoins,
//   faHouse,
//   faRightLeft,
// } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Menu, X } from "lucide-react";
// import { useAuth } from "@/hooks/AuthContext";

// const AdminSideBar = () => {
//   const [isSideBarOpen, setIsSideBarOpen] = useState(true);
//   const { handleLogout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const menuItems = [
//     { name: "All Projects", icon: faHouse, path: "/admin" },
//   ];

//   const accountItems = [
//     { name: "Users", icon: faChartPie, path: "/admin/users" },
//     { name: "Create Property", icon: faRightLeft, path: "/admin/create" },
//     { name: "Manage Property", icon: faCoins, path: "/admin/manage" },
//   ];

//   const handleMenuClick = (item: { path: string }) => {
//     navigate(item.path);
//   };

//   const isActive = (path: string) => location.pathname === path;

//   return (
//     <div className="relative h-full">
//       {isSideBarOpen ? (
//         <Button
//           variant="outline"
//           size="sm"
//           className="absolute top-1 -right-[31px] !size-8 rounded-l-none"
//           onClick={() => setIsSideBarOpen(false)}
//         >
//           <X />
//         </Button>
//       ) : (
//         <Button
//           variant="outline"
//           size="icon"
//           className="absolute top-1 -right-8 !size-8"
//           onClick={() => setIsSideBarOpen(true)}
//         >
//           <Menu />
//         </Button>
//       )}

//       <aside
//         className={`${
//           isSideBarOpen ? "w-[16rem]" : "hidden"
//         } h-full bg-gray-100 border-r border-gray-200 flex flex-col justify-between`}
//       >
//         <div className="p-6">
//           <Link
//             to="/admin"
//             className="mt-6 mb-12 text-center text-3xl font-extrabold text-black hover:text-black"
//           >
//             NextCarbon Admin
//           </Link>

//           <div className="space-y-6">
//             <div>
//               <h2 className="font-semibold text-gray-500 text-md mt-2">Menu</h2>
//               <hr className="w-full h-[2px] bg-gray-200 mt-2 mb-3" />
//               <ul className="space-y-2">
//                 {menuItems.map((item) => (
//                   <li
//                     key={item.name}
//                     className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
//                       isActive(item.path)
//                         ? "bg-gray-200 font-semibold"
//                         : "hover:bg-gray-200"
//                     }`}
//                     onClick={() => handleMenuClick(item)}
//                   >
//                     <FontAwesomeIcon icon={item.icon} />
//                     <span className="text-black">{item.name}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h2 className="font-semibold text-gray-500 text-md mt-4">
//                 Admin Access
//               </h2>
//               <hr className="w-full h-[2px] bg-gray-200 mt-2 mb-3" />
//               <ul className="space-y-2">
//                 {accountItems.map((item) => (
//                   <li
//                     key={item.name}
//                     className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
//                       isActive(item.path)
//                         ? "bg-gray-200 font-semibold"
//                         : "hover:bg-gray-200"
//                     }`}
//                     onClick={() => handleMenuClick(item)}
//                   >
//                     <FontAwesomeIcon icon={item.icon} />
//                     <span className="text-black">{item.name}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//         </div>

//         <div className="p-4">
//           <Button className="w-full text-lg" variant="default" onClick={handleLogout}>
//             Logout
//           </Button>
//         </div>
//       </aside>
//     </div>
//   );
// };

// export default AdminSideBar;


/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  faChartPie,
  faCoins,
  faHouse,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/authcontext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import KycForm from "@/components/custom/dashboard/sub-components/kycform";

const AdminSideBar = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("All Projects");
  const [isKyc, setIsKyc] = useState(false);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [showMainDialog, setShowMainDialog] = useState(false);
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: "All Projects", icon: faHouse, path: "/admin" },
  ];

  const accountItems = [
    { name: "Users", icon: faChartPie, path: "/admin/users" },
    { name: "Create Property", icon: faRightLeft, path: "/admin/create" },
    { name: "Manage Property", icon: faCoins, path: "/admin/manage" },
  ];

  useEffect(() => {
    const checkUserKyc = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("user_kyc")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setIsKyc(true);
      } else {
        setIsKyc(false);
      }
    };

    checkUserKyc();
  }, [user]);

  const handleMenuClick = (item: any) => {
    const kycRequired = [
      "/dashboard/portfolio",
      "/dashboard/history",
      "/offset",
    ];

    if (kycRequired.includes(item.path) && !isKyc) {
      setShowKycDialog(true);
      setShowMainDialog(false);
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
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
                      activeMenu === item.name
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
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
                      activeMenu === item.name
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
              You need to complete your KYC to access this feature.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setShowKycDialog(false);
              setShowMainDialog(true); // Open KYC form
            }}
          >
            Complete KYC Now
          </Button>
        </DialogContent>
      </Dialog>

      {/* KYC Form Dialog */}
      <KycForm open={showMainDialog} onOpenChange={setShowMainDialog} />
    </div>
  );
};

export default AdminSideBar;
