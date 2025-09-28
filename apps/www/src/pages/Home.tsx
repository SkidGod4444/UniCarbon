import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import HeroCards from "../components/custom/hero.cards";
import {
  faArrowUpRightDots,
  faFolderOpen,
  faHandHoldingDollar,
  faShieldHalved,
  faUserCheck,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import PriceBar from "../components/animata/PriceBar";
import Footer from "../components/custom/Footer";
import { useState } from "react";
import CustomGlobe from "../components/CustomGlobe";
import WordRotate from "../components/magic/TextRotate";
import { HeroScrollDemo } from "../components/custom/container.animation";
import {
  CardContainer,
  CardBody,
  CardItem,
} from "../components/aceternity/3DCard";

import { useNavigate } from "react-router-dom";
import { TextGenerateEffect } from "../components/aceternity/text-generate-effect";

function Home() {
  const [currency, setCurrency] = useState("USD");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Top hero container */}
      <div className="container flex flex-col-reverse items-center justify-center px-4 mx-auto space-y-8 lg:flex-row lg:space-x-4 lg:space-y-0">
        {/* Left container */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-y-5 w-full lg:w-[55rem]">
          {/* Text container */}
          <div className="flex flex-col items-center justify-center lg:items-start mt-5">
            <div className="mb-3 text-3xl lg:text-3xl">
              The New Age De-Fi Protocol for sustainability projects
            </div>
            <div className="flex flex-col font-bold text-5xl gap-y-3 lg:text-[5rem]">
              <TextGenerateEffect words="Own Carbon Credit Tokens" />
            </div>
            <div className="flex flex-col text-5xl font-bold gap-y-3 lg:text-[5rem]">
              <TextGenerateEffect words="Own the Sustainable Future" />
            </div>
            <div className="mt-4 text-3xl lg:text-[3rem]">
              <p className="lg:leading-[3.5rem] justify-center flex flex-col items-center lg:items-start">
                <div className="flex flex-row items-center gap-x-3">
                  <WordRotate
                    className=""
                    words={["Invest", "Earn", "Borrow", "Lend"]}
                  />
                  <p className="text-left w-full">cross-sector Projects</p>
                </div>
                <p className="">Across the globe.</p>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center mt-1 text-xl md:flex-row lg:text-xl md:gap-x-3 gap-y-3 lg:gap-y-0">
            <FontAwesomeIcon icon={faCircleCheck} className="" />
            <p>Safe, Secure, and Verified Assets</p>
          </div>
        </div>

        {/* Right container */}
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          <CustomGlobe />
        </div>
      </div>

      {/* Bottom container */}
      <div className="flex flex-col items-center justify-center w-full px-4 mt-16 mb-10">
        <HeroCards />
      </div>

      {/* Secure choice container */}
      <div className="container flex flex-col items-center justify-center gap-8 mx-auto lg:flex-row my-28 lg:gap-x-20">
        {/* Left container */}
        <div className="flex flex-col items-start text-center lg:text-left">
          <p className="text-4xl font-bold">
            {" "}
            Carbon Credits: A Sustainable Choice
          </p>
          <p className="max-w-lg text-lg">
            Invest in verified carbon credit projects to drive real
            environmental impact and offset your carbon footprint, contributing
            to a cleaner, greener future.
          </p>
        </div>
        {/* Right container */}
        <div className="flex flex-col items-center justify-center gap-y-4">
          {[
            {
              icon: faUserCheck,
              text: "Fractional Ownership, Full Potential",
            },
            {
              icon: faShieldHalved,
              text: "Verified and Impactful Projects",
            },
            {
              icon: faFolderOpen,
              text: "Diversify with Ease",
            },
            {
              icon: faHandHoldingDollar,
              text: "Flexible for Every Investor",
            },
            {
              icon: faArrowUpRightDots,
              text: "Stable Growth, Less Risk",
            },
          ].map((item, index) => (
            <CardContainer key={index} className="inter-var">
              <CardBody className="relative group/card w-full sm:w-[30rem] h-auto rounded-xl">
                <CardItem translateZ="100" className="w-full">
                  <div className="flex flex-row items-center justify-between w-full sm:w-[30rem] p-6 md:px-8 gap-x-4 md:gap-x-20 rounded-2xl bg-gamma">
                    <div className="flex flex-row items-center gap-x-4 min-w-[70vw] lg:w-auto">
                      <FontAwesomeIcon icon={item.icon} size="xl" />
                      <p className="text-md md:text-xl">{item.text}</p>
                    </div>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>

      {/* Crypto for everyone container */}
      <div className="container flex flex-col justify-center mx-auto lg:flex-row gap-x-10 mt-28">
        {/* Left container */}
        <div className="flex flex-col px-6 gap-y-3 lg:px-0 lg:w-1/2">
          <div className="flex flex-col items-center gap-y-2 lg:items-start">
            <p className="text-4xl font-bold text-center lg:text-left">
              Seamless Crypto for Everyone
            </p>
            <p className="max-w-lg text-lg leading-tight text-center lg:text-left">
              No more worries about wallet, lost private key, gas and so on.
              Provest fully abstracts the complexity and gives you a seamless
              crypto experience in a secure way. It’s your wallet, your crypto,
              your shares.
            </p>
          </div>
          <div className="flex flex-col py-6 px-14 lg:px-0 mt-3 lg:py-0 gap-y-3 lg:items-start">
            {[
              "Fully Self-Custodial",
              "Recoverable Wallets",
              "Exportable Private Key",
            ].map((item, index) => (
              <div key={index} className="flex flex-row items-center  gap-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
                  <p className="text-sm font-bold text-white">{index + 1}</p>
                </div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right container */}
        <div className="flex flex-col items-center justify-center mt-8">
          <ul className="relative">
            {[
              "Connect your Wallet",
              "Select Project to Invest",
              "Invest with Crypto",
              "Carbon Credit Received",
            ].map((item, index) => (
              <li key={index} className="relative pl-6 pb-8 last:pb-0">
                {/* Connector Line */}
                {index !== 4 - 1 && (
                  <div className="absolute left-[-2px] top-6 w-1 h-full bg-gray-200"></div>
                )}

                {/* Icon */}
                <div className="absolute left-[-10px] top-6 flex items-center justify-center bg-white rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Content Box */}
                <div
                  className={`w-full flex flex-col items-center justify-center min-w-[60px]`}
                >
                  <div className="w-full connection-shadow rounded-2xl px-16 py-5">
                    <p className="text-xl">{item}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats container */}
      <div className="container flex flex-col items-center justify-center mx-auto">
        <HeroScrollDemo />
      </div>

      {/* Properties for everyone container */}
      <div className="container flex flex-col items-center justify-center mx-auto mb-28">
        <div className="flex flex-col mb-4 text-center gap-y-0">
          <p className="text-4xl font-bold">Sustainable project for Everyone</p>
          {/* Sub heading container */}
          <div className="flex flex-col items-center justify-center my-4">
            <p className="text-md">Show prices in</p>
            <div className="mt-2">
              <PriceBar
                tabs={["USD", "SOL", "ETH"]}
                setCurrency={setCurrency}
              />
            </div>
          </div>
        </div>

        {/* Cards container */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              price: 28,
              shares: 1566,
              title: "As low as,",
            },
            {
              price: 89,
              shares: 9455,
              title: "Average of,",
            },
            {
              price: 163,
              shares: 566,
              title: "As high as,",
            },
          ].map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-6 px-12 gap-y-3 rounded-3xl bg-gamma"
            >
              <p className="text-2xl">{_.title}</p>
              <div className="leading-none">
                <p className="text-6xl font-bold">
                  {currency === "USD" ? (
                    "$" + _.price
                  ) : currency === "SOL" ? (
                    <>
                      {(_.price * 0.999).toFixed(2)}
                      <span className="text-sm">&nbsp;SOL</span>
                    </>
                  ) : (
                    <>
                      {(_.price * 0.00037).toFixed(2)}
                      <span className="text-sm">&nbsp;ETH</span>
                    </>
                  )}
                </p>
                <p className="text-lg">per share</p>
              </div>
              <div className="flex flex-col mt-2 gap-y-0">
                <p className="text-3xl">
                  {_.shares.toLocaleString("en-US")}{" "}
                  <span className="text-md">Shares</span>
                </p>
                <p className="text-md">Shares Available</p>
              </div>
              <button
                className="p-2 px-8 py-3 mt-3 text-white bg-black border-2 rounded-full hover:bg-white hover:border-black hover:text-black"
                onClick={() => {
                  navigate("/dashboard");
                }}
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
