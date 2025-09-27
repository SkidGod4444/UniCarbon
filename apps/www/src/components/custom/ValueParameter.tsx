import { ValueParameter as APIValueParameter } from "@/types/type";
import React from "react";

interface ValueParameterProps {
  parameters: APIValueParameter[]; // accept API format
}

const ValueParameter: React.FC<ValueParameterProps> = ({ parameters }) => {
  if (!parameters || parameters.length === 0) return null;

  const entries = Object.entries(parameters[0]); // take first object

  return (
    <div className="grid grid-cols-1 mb-6 gap-y-2">
      {entries.map(([key, val], index) => (
        <div
          key={index}
          className="flex flex-row items-center justify-between w-full h-full bg-white border border-black rounded-xl"
        >
          <p className="p-4 text-lg text-black">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </p>
          <p className="flex items-center justify-center w-40 h-full p-4 font-bold text-center bg-alpha text-beta rounded-e-xl">
            {typeof val === "string"
              ? val.charAt(0).toUpperCase() + val.slice(1)
              : val}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ValueParameter;
