import { ProjectUpdate } from "@/types/type";
import { faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface ViewPageUpdatesProps {
  updates: ProjectUpdate[];
}

const ViewPageUpdates: React.FC<ViewPageUpdatesProps> = ({ updates }) => {
  return (
    <div className="grid grid-cols-1 mb-6 gap-y-3">
      {updates.map((item) => (
        <div
          key={item.id}
          className="flex flex-row items-start w-full border border-black bg-gamma rounded-xl p-4"
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full mr-4">
            <FontAwesomeIcon icon={faAnglesUp} size="sm" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col">
            <time className="text-xs text-gray-500">{item.date}</time>
            <p className="text-sm md:text-base text-black leading-snug mt-1">
              {item.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ViewPageUpdates;
