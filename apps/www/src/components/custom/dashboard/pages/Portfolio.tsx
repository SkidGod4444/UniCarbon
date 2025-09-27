import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import Mapbox from "../sub-components/Mapbox";
import YourPropertiesTable from "../sub-components/properties.table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/AuthContext";
import { Button } from "@/components/ui/button";

interface Property {
  name: string;
  id: number;
  type: string;
  price: number;
  status: string;
  available_shares: number;
  totalShares: number;
  propertyName: string;
  location: string;
  yourShares: number;
  latitude?: number;
  longitude?: number;
}

function Portfolio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Property[]>([]);
  const [metadata, setMetadata] = useState({
    totalProfit: 0,
    totalCurrentPortfolioValue: 0,
    totalPropertiesHeld: 0,
    totalSharesHeld: 0,
  });

  const tempUser = useAuth();
  const user = tempUser.user?.id;

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) {
        console.log("User ID not available yet");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("owners")
          .select("credits, property_data!inner(*)")
          .eq("user_id", user);

        if (error) {
          console.error("Error fetching user projects:", error);
          alert("Error fetching user projects");
          return;
        }

        if (!data) {
          console.error("No data returned from Supabase.");
          return;
        }
        let credits:number;
        const formattedProjects = data.flatMap((row) => {
          const properties = Array.isArray(row.property_data)
            ? row.property_data
            : [row.property_data];
               credits = row.credits || 0;

          return properties.map((property: Property) => ({
            id: property.id,
            name: property.name,
            type: property.type,
            location: property.location,
            price: property.price,
            status: property.status,
            available_shares: property.available_shares ?? 0,
            totalShares: property.totalShares ?? 0,
            propertyName: property.name,
            yourShares: credits,
            latitude: property.latitude ?? 0,
            longitude: property.longitude ?? 0,
          }));
        });
        // console.log("formatedProjects are : ", formattedProjects);
        // console.log("Fetched credits:", credits);
        setProjects(formattedProjects);

        const totalShares = formattedProjects.reduce(
          (sum, p) => sum + p.yourShares,
          0
        );
        const totalSharesFormatted = totalShares.toFixed(2);
        const totalPortfolioValue = formattedProjects.reduce(
          (sum, p) => sum + p.price * p.yourShares,
          0
        );

        const totalPortfolioValueFormatted = totalPortfolioValue.toFixed(2);

        setMetadata({
          totalProfit: 0,
          totalCurrentPortfolioValue: parseFloat(totalPortfolioValueFormatted),
          totalPropertiesHeld: formattedProjects.length,
          totalSharesHeld: parseFloat(totalSharesFormatted),
        });
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchUserProjects();
  }, [user]);

  return (
    <div className="flex flex-col w-full max-w-full px-4 mx-auto">
      <div className="flex flex-row space-x-6">
        <div className="w-full">
          <div className="text-left">
            <p className="text-2xl font-semibold">Portfolio Stats</p>
          </div>
          <hr className="h-[2px] bg-black/5 my-2" />
          <div className="grid grid-cols-2 gap-6 p-4 mb-6 text-center">
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-black/10 rounded-2xl min-w-0 max-w-full">
              <p className="text-5xl font-bold text-black ">
                ${metadata.totalCurrentPortfolioValue}
              </p>
              <p className="text-2xl">Your Portfolio</p>
            </div>

            <div className="flex flex-col items-center justify-center py-8 bg-black/10 rounded-2xl">
              <p className="text-5xl font-bold text-black">
                ${metadata.totalProfit}
              </p>
              <p className="text-2xl">Total Profit</p>
            </div>
            <div className="flex flex-col items-center justify-center py-10 bg-black/10 rounded-2xl">
              <p className="text-5xl font-bold text-black">
                {metadata.totalPropertiesHeld}
              </p>
              <p className="text-2xl">Total Projects Owned</p>
            </div>
            <div className="flex flex-col items-center justify-center py-8 bg-black/10 rounded-2xl">
              <p className="text-5xl font-bold text-black">
                {metadata.totalSharesHeld}
              </p>
              <p className="text-2xl">Total Shares Held</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              className="w-full py-3 mx-4 text-lg text-white bg-black border-2 border-black rounded-xl hover:bg-white hover:text-black"
              onClick={() => navigate("/dashboard")}
            >
              Invest More
            </Button>
          </div>
        </div>

      </div>
      <div className="pt-8 text-left md:px-4">
        <p className="text-2xl font-semibold">Your Projects</p>
      </div>
      <div className="py-0 my-0 divider before:bg-black/5 after:bg-black/5"></div>
      <YourPropertiesTable properties={projects} />
    </div>
  );
}

export default Portfolio;
