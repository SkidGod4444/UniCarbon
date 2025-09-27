/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "@/components/custom/Sidebar";

export const Dashboard = ({ children }: any) => {

  return (
    <div className="flex h-screen border-t min-w-full flex-1">
      <Sidebar />
        <main className=" flex py-8 overflow-y-auto overflow-x-hidden justify-center w-full">
          <div className="container mx-4 md:mx-5">{children}</div>
        </main>
    </div>
  );
};
