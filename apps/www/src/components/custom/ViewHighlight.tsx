import React from "react";

interface Highlight {
  highlight: string;
}

interface ViewHighlightProps {
  highlights: Highlight[];
}

const ViewHighlight: React.FC<ViewHighlightProps> = ({ highlights }) => {
  return (
    <div className="grid grid-cols-2 mb-6 gap-x-4 gap-y-6">
      {highlights.map((item, index) => (
        <div
          key={index}
          className="flex flex-row bg-white border border-black rounded-xl"
        >
          {/* Vertical index bar */}
          <div className="flex items-center justify-center p-0 m-0 bg-black rounded-tl-xl rounded-bl-xl w-[4.5rem]">
            <p className="px-0 m-0 text-white transform -rotate-90 text-md font-bold tracking-wider">
              {String(index + 1).padStart(2, "0")}
            </p>
          </div>

          {/* Highlight text */}
          <p className="p-6 text-lg text-black">{item.highlight}</p>
        </div>
      ))}
    </div>
  );
};

export default ViewHighlight;
