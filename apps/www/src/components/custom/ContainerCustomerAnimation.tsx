"use client";
import { ContainerScroll } from "../aceternity/containerScrollAnimation";
import screenshot from "../../assets/img/screenshot.png";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Your Investment <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Your Control
              </span>
            </h1>
          </>
        }
      >
        <img
          src={screenshot}
          alt="hero"
          height={720}
          width={1400}
          className="object-cover object-left-top h-full mx-auto rounded-2xl"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
