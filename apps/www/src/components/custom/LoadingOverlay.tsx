import React from "react";
import { useLoadingStore } from "../../state-management/store";
import loadingAnimation from "../../assets/svg/loading.svg";

const LoadingOverlay: React.FC = () => {
  const { loadingMessage } = useLoadingStore();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-[999]">
      <div className="flex flex-col items-center justify-center gap-y-4">
        <img src={loadingAnimation} alt="Loading" className="w-40 h-40" />
        <div>
          <p className="text-2xl font-bold text-black">Please wait...</p>
          {/* <p className="text-lg text-black">{loadingMessage}</p> */}
          <p className="text-lg text-black">
            {loadingMessage ? loadingMessage : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
