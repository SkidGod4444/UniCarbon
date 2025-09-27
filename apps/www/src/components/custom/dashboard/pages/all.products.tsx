

import { ProjectsTable } from "@/components/ProjectsTable";

const AllProducts = () => {

  return (
    <div className="min-w-full px-4 mx-auto pb-10">
      <div className="sm:flex items-center justify-between mb-6">
        <div className="flex flex-col text-center sm:items-start">
          <h2 className="text-2xl font-normal">Explore Projects</h2>
          <h1 className="text-5xl font-bold">Your Next Investment</h1>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-2xl">Total Asset Value</p>
          <p className="text-5xl font-bold">$14,081,000</p>
        </div>
      </div>
      <ProjectsTable />
    </div>
  );
};

export default AllProducts;
