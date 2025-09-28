import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { PinContainer } from "../aceternity/3DPin";

function HeroCards() {
  const cardData = [
    {
      sharesAvailable: "347,250",
      properties: "435",
      startingFrom: "$15",
      city: "Amazon Rainforest, Brazil",
      location: "Brazil",
    },
    {
      sharesAvailable: "236,864",
      properties: "289",
      startingFrom: "$5",
      city: "Congo Basin, Africa",
      location: "Central Africa",
    },
    {
      sharesAvailable: "410,488",
      properties: "239",
      startingFrom: "$10",
      city: "Siberian Forests, Russia",
      location: "Russia",
    },
  ];

  return (
    <div className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-28 ">
      {/* // <div className="flex flex-row flex-wrap justify-center gap-8"> */}
      {cardData.map((card, index) => (
        <PinContainer title={card.city} href="#">
          <div
            key={index}
            className="flex flex-col items-start p-10 text-black text-left rounded-2xl bg-gamma gap-y-6 w-[18rem] crypto-shadow"
          >
            {/* Shares Available */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-x-2">
                <FontAwesomeIcon icon={faArrowTrendUp} />
                <p className="text-2xl md:text-4xl">{card.sharesAvailable}</p>
              </div>
              <p className="text-base md:text-lg">Carbon Credits Available</p>
            </div>

            {/* Properties */}
            <div className="flex flex-col items-start">
              <p className="text-5xl font-bold md:text-7xl">
                {card.properties}
              </p>
              <p className="text-base md:text-lg">Carbon Credits Tokenized</p>
            </div>

            {/* Bottom Container */}
            <div className="w-full">
              <p className="text-lg md:text-2xl">
                Starting from{" "}
                <span className="font-bold">{card.startingFrom}</span>
              </p>
              <div className="h-[1px] bg-black/10 my-2"></div>
              {/* Location */}
              <div className="flex items-center gap-x-2">
                <FontAwesomeIcon icon={faLocationDot} />
                <p className="text-base md:text-lg">{card.location}</p>
              </div>
            </div>
          </div>
        </PinContainer>
      ))}
    </div>
  );
}

export default HeroCards;
