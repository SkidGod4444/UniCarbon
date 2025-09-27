import Carousel from "@/components/animata/Carousel";
import ValueParameter from "@/components/custom/ValueParameter";
import ViewHighlight from "@/components/custom/ViewHighlight";
import {
  faCalendarDay,
  faChevronLeft,
  faChevronRight,
  faCircleInfo,
  faCopy,
  faRulerCombined,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRazorpay } from "react-razorpay";
import axios from "axios";
import { toast } from "sonner";
import KycForm from "@/components/custom/dashboard/sub-components/KycForm";
import { useKyc } from "@/hooks/KycContext";
import Project from "@/types/type";

// Simple in-memory cache for fetched properties
const propertyCache = new Map<string, Project>();

const PropertyView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Project | null>(null);
  const { user } = useAuth();
  const { kycStatus } = useKyc();
  const [showKycDialog, setShowKycDialog] = useState<boolean>(false);
  const [investObject, setInvestObject] = useState<{ amount: string }>({
    amount: "",
  });
  const [priceChange, setPriceChange] = useState<{
    direction: 'up' | 'down' | null;
    percentage: number | null;
  }>({ direction: null, percentage: null });
  const propertyId = window.location.pathname.split("/").pop();
  const { Razorpay } = useRazorpay();
  const currentRoute = useLocation();

  // Memoize propertyId to ensure it's stable
  const memoizedPropertyId = useMemo(() => propertyId, [propertyId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProjects = async () => {
      if (!memoizedPropertyId) return;

      if (propertyCache.has(memoizedPropertyId)) {
        if (!isCancelled) {
          setData(propertyCache.get(memoizedPropertyId) ?? null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("property_data")
          .select("*")
          .eq("id", memoizedPropertyId);

        if (error) {
          if (!isCancelled) toast.error("Error fetching property data");
          console.error(error);
          return;
        }

        if (data?.length) {
          if (!isCancelled) {
            setData(data[0] as Project);
            propertyCache.set(memoizedPropertyId, data[0]);
          }
        } else {
          if (!isCancelled) toast.error("No property found");
        }
      } catch (error) {
        if (!isCancelled) toast.error("Unexpected error occurred");
        console.error(error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      isCancelled = true;
    };
  }, [memoizedPropertyId]);

  // Real-time subscription for property updates
  useEffect(() => {
    if (!memoizedPropertyId) return;

    const propertyChannel = supabase
      .channel(`property_${memoizedPropertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_data',
          filter: `id=eq.${memoizedPropertyId}`,
        },
        (payload) => {

          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedProperty = payload.new as Project;
            setData(updatedProperty);
            propertyCache.set(memoizedPropertyId, updatedProperty);

            // Show toast notification for price changes
            if (payload.old && (payload.old as Project).price !== updatedProperty.price) {
              const oldPrice = (payload.old as Project).price;
              const newPrice = updatedProperty.price;

              if (oldPrice && newPrice) {
                const changePercent = ((newPrice - oldPrice) / oldPrice * 100);

                // Set price change state for visual indicator
                setPriceChange({
                  direction: newPrice > oldPrice ? 'up' : 'down',
                  percentage: changePercent
                });

                // Clear the price change indicator after 3 seconds
                setTimeout(() => {
                  setPriceChange({ direction: null, percentage: null });
                }, 3000);
              }
            }

            // Show toast notification for shares changes
            if (payload.old && (payload.old as Project).available_shares !== updatedProperty.available_shares) {
              const oldShares = (payload.old as Project).available_shares;
              const newShares = updatedProperty.available_shares;

              if (oldShares !== undefined && newShares !== undefined && oldShares !== null && newShares !== null) {
                const sharesSold = oldShares - newShares;
                if (sharesSold > 0) {
                  toast.success(
                    `🎉 ${sharesSold.toLocaleString()} shares sold! ${newShares.toLocaleString()} remaining.`,
                    {
                      duration: 5000,
                      position: 'top-right',
                      style: {
                        background: '#10b981',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      },
                    }
                  );
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(propertyChannel);
    };
  }, [memoizedPropertyId]);

  async function handleBuy() {
    console.log("buy btn clicked")
    if (!user) {
      toast.error("Please login to invest");
      return;
    }

    const { data: orderData } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
      {
        userId: user.id,
        propertyId,
        shares: parseInt(investObject.amount),
      }
    );

    if (!orderData || orderData.success === false) {
      toast.error("Failed to create order");
      return;
    }

    const razorpay = new Razorpay({
      name: "UniCarbon",
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: orderData.data.amount,
      currency: orderData.data.currency,
      description: "Payment for buying property shares",
      order_id: orderData.data.id,
      handler: async (res) => {
        try {
          toast.loading("Verifying payment...", {
            id: "razorpay",
          });
          console.log(res);
          const { data } = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/orders/verify`,
            {
              orderId: res.razorpay_order_id,
              userId: user.id,
              propertyId,
              shares: parseInt(investObject.amount),
              paymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            }
          );
          console.log(data);

          if (!data || data.success === false) {
            toast.error("Payment verification failed", {
              id: "razorpay",
            });
            return;
          }

          toast.success("Payment successful", {
            id: "razorpay",
          });
        } catch (error) {
          console.log(error);
        }
      },
    });

    razorpay.open();
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Access first item of attributes array
  const attributes = data?.attributes;

  return (
    <div className="flex min-w-full justify-center relative">
      <div className="container flex flex-col lg:flex-row items-center lg:items-start">
        {/* Left container */}
        <div className="p-6 text-left mb-16 w-4/5">
          <div className="flex flex-row items-center justify-between w-full">
            <div
              className="flex flex-row items-center px-6 py-2 mb-2 border-2 rounded-full border-alpha bg-alpha w-fit gap-x-3 hover:cursor-pointer bg-black text-white"
              onClick={() => navigate("/dashboard")}
            >
              <FontAwesomeIcon
                icon={faChevronLeft}
                color="#000000"
                className="text-beta text-white"
                size="sm"
              />
              <p className="text-sm text-beta">Back to Dashboard</p>
            </div>
            <div
              className="flex flex-row items-center px-6 py-2 mb-2 border-2 rounded-full border-alpha bg-alpha w-fit gap-x-3 hover:cursor-pointer bg-black text-white"
              onClick={() => navigate(`${currentRoute.pathname}/status`)}
            >
              <p className="text-sm text-beta">To Status</p>
              <FontAwesomeIcon
                icon={faChevronRight}
                color="#000000"
                className="text-beta text-white"
                size="sm"
              />
            </div>
          </div>
          {/* Name */}
          <h1 className="mb-1 text-6xl font-bold">{data?.name ?? "N/A"}</h1>
          {/* Description container */}
          <div className="flex flex-col">
            <p className="mt-2 mb-4 text-lg leading-tight text-black">
              {data?.description ?? "No description available"}
            </p>
            <div className="px-0 mx-0 divider divider-horizontal"></div>
            <div className="flex justify-start py-2 mb-6 gap-y-4 gap-x-4 w-fit">
              <div className="flex flex-row items-center w-40 p-2 pl-4 bg-white border border-black rounded-xl gap-x-4">
                <FontAwesomeIcon icon={faRulerCombined} size="xl" />
                <div className="flex flex-col leading-tight">
                  <p className="text-black text-md">Carbon Credits</p>
                  <p className="font-bold text-black text-md">
                    {attributes?.carbonCredits ?? "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center w-40 p-2 pl-4 bg-white border border-black rounded-xl gap-x-4">
                <FontAwesomeIcon icon={faCalendarDay} size="xl" />
                <div className="flex flex-col leading-tight">
                  <p className="text-black text-md">Date</p>
                  <p className="font-bold text-black text-md">
                    {data?.created_at
                      ? new Date(data.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Parameters */}
          <div className="flex flex-row items-center gap-x-2">
            <h2 className="mb-0 text-xl font-bold">Value Parameters</h2>
            <div
              className="tooltip tooltip-right"
              data-tip="Specific measurable factors related to property value, growth, or financial performance."
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
          </div>
          <div className="pt-3 pb-4 my-0 divider before:bg-black/10 after:bg-black/10"></div>
          {data?.value_parameters && data.value_parameters.length > 0 ? (
            <ValueParameter parameters={data.value_parameters} />
          ) : (
            <p className="text-lg text-gray-500">No value parameters available</p>
          )}
          {/* Highlights */}
          <div className="flex flex-row items-center mt-8 gap-x-2">
            <h2 className="mb-0 text-xl font-bold">Highlights</h2>
            <div
              className="tooltip tooltip-right"
              data-tip="Core, static features or amenities that define the property's attractiveness."
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
          </div>
          <div className="pt-3 pb-4 my-0 divider before:bg-black/10 after:bg-black/10"></div>
          {data?.Highlights && data.Highlights.length > 0 ? (
            <ViewHighlight highlights={data.Highlights} />
          ) : (
            <p className="text-lg text-gray-500">No highlights available</p>
          )}

          {/* Image Gallery */}
          <h2 className="mt-8 mb-0 text-xl font-bold">Image Gallery</h2>
          <div className="pt-3 pb-4 my-0 divider before:bg-black/10 after:bg-black/10"></div>
          <div className="mb-6 bg-gray-200 rounded-lg">
            <Carousel className="w-min-72 storybook-fix relative" />
          </div>

          {/* Documents */}
          <h2 className="mt-8 mb-0 text-xl font-bold">Documents</h2>
          <div className="pt-3 pb-4 my-0 divider before:bg-black/10 after:bg-black/10"></div>
          <div className="">
            <div className="grid grid-cols-2 gap-4 text-left">
              {(data?.Documents && data.Documents.length > 0
                ? data.Documents
                : ["No documents available"]
              ).map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-start p-2 px-6 text-lg text-center bg-gray-200 rounded-lg"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-left">{doc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right container */}
        <div className="w-full p-6 md:w-[40rem] md:sticky md:top-0 lg:h-screen flex flex-col gap-y-4 pb-20 lg:pb-0">
          <div className="flex flex-col items-start p-6 bg-white rounded-3xl justify-center invest-shadow shadow-2xl shadow-black">
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-bold">Token Metadata</p>
            </div>
            <div className="flex flex-col w-full mt-2 gap-y-0">
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-black text-md">Token Address</p>
                <div className="flex flex-row items-center text-sm gap-x-3">
                  <FontAwesomeIcon
                    icon={faCopy}
                    onClick={() => {
                      navigator.clipboard.writeText("Token Address");
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-black text-md">Owner Address</p>
                <div className="flex flex-row items-center text-sm gap-x-3">
                  <FontAwesomeIcon
                    icon={faCopy}
                    onClick={() => {
                      navigator.clipboard.writeText("Owner address");
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-black text-md">Current Status</p>
                <p className="text-black">{data?.status ?? "N/A"}</p>
              </div>
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-black text-md">NFT Symbol</p>
                <p className="text-black">{attributes?.nftSymbol ?? "Sunfar"}</p>
              </div>
            </div>
            <div className="py-3 my-0 divider before:bg-black/5 after:bg-black/5"></div>
            <div className="grid w-full grid-cols-4 mt-0 ">
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">Owners</p>
                <p className="text-xl font-semibold">{attributes?.owners ?? "N/A"}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">IRR</p>
                <p className="text-xl font-semibold">{attributes?.irr ?? "11.1%"}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">ARR</p>
                <p className="text-xl font-semibold">{attributes?.arr ?? "9%"}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">Share Per NFT</p>
                <p className="text-xl font-semibold">
                  {attributes?.sharePerNFT ? `${attributes.sharePerNFT}%` : "N/A"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">Total Shares</p>
                <p className="text-xl font-semibold">
                  {data?.totalShares ?? "N/A"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-black text-md">Share Price</p>
                <p className="text-xl font-semibold">
                  {data?.price ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="p-8 bg-white rounded-3xl invest-shadow shadow-2xl shadow-black">
            <div className="flex justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-left text-black">Available Value</p>
                </div>
                <p className={`text-xl font-bold transition-colors duration-300 ${priceChange.direction === 'up' ? 'text-green-600' :
                  priceChange.direction === 'down' ? 'text-red-600' :
                    'text-black'
                  }`}>
                  {data?.price && data?.available_shares
                    ? `$${(data.price * data.available_shares).toLocaleString(
                      "en-US"
                    )}`
                    : "$0"}
                  <span className="text-sm font-normal ml-0.5 text-black">USD</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg text-black">Total Value</p>
                <p className="text-xl font-bold">
                  {`$${((data?.totalShares ?? 0) * (data?.price ?? 0)).toLocaleString(
                    "en-US"
                  )}`}
                  <span className="text-sm font-normal ml-0.5 text-black">USD</span>
                </p>
              </div>
            </div>

            {/* Shares Distribution Bar */}
            <div className="p-3 mb-4 rounded-2xl bg-gray-50 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-black">Shares Distribution</h3>
                  {/* <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">LIVE</span>
                  </div> */}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Sold</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sold: {((data?.totalShares ?? 0) - (data?.available_shares ?? 0)).toLocaleString()}</span>
                  <span>Available: {(data?.available_shares ?? 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className="flex h-full">
                    {/* Sold shares (green) */}
                    <div
                      className="bg-green-500 h-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${data?.totalShares ? ((data.totalShares - (data.available_shares ?? 0)) / data.totalShares * 100) : 0}%`
                      }}
                    ></div>
                    {/* Available shares (blue) */}
                    <div
                      className="bg-blue-500 h-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${data?.totalShares ? ((data.available_shares ?? 0) / data.totalShares * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <p className="font-semibold text-green-600">
                    {data?.totalShares ? (((data.totalShares - (data.available_shares ?? 0)) / data.totalShares * 100)).toFixed(1) : 0}%
                  </p>
                  <p className="text-gray-500">Sold</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-blue-600">
                    {data?.totalShares ? (((data.available_shares ?? 0) / data.totalShares * 100)).toFixed(1) : 0}%
                  </p>
                  <p className="text-gray-500">Available</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-left text-black">Share Price</p>
                  {/* <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${priceChange.direction === 'up' ? 'bg-green-500 animate-pulse' : priceChange.direction === 'down' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-500">LIVE</span>
                  </div> */}
                </div>
                <div className="flex items-end justify-center gap-1">
                  <p className={`text-xl font-semibold`}>
                    {data?.price ? `$${data.price.toFixed(1)}` : "$0.00"}
                  </p>
                  {/* {priceChange.percentage && (
                    <span className={`text-sm font-medium ${priceChange.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {priceChange.direction === 'up' ? '+' : ''}{priceChange.percentage.toFixed(2)}%
                    </span>
                  )} */}
                  <p className="text-sm font-normal text-black"> USDC</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg text-black">Available Shares</p>
                <p className="text-xl font-semibold">{data?.available_shares ?? "N/A"}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="mb-1 text-lg text-black">Your Balance: 0 USDC</p>
              <input
                type="text"
                placeholder="Enter amount of shares to buy"
                className="w-full px-4 py-2 my-1 text-lg border rounded-lg outline-none bg-black/10"
                value={investObject.amount}
                onChange={(e) => {
                  setInvestObject({
                    ...investObject,
                    amount: e.target.value,
                  });
                }}
              />
            </div>
            {user ? (
              <>
                {loading ? (
                  <button
                    disabled
                    className="w-full py-2 mb-4 text-lg font-normal text-white bg-gray-400 border-2 border-gray-400 rounded-xl cursor-not-allowed"
                  >
                    <p>Checking KYC status...</p>
                  </button>
                ) : kycStatus === true ? (
                  <button
                    className="w-full py-2 mb-4 text-lg font-normal text-white bg-black border-2 border-black rounded-xl hover:bg-white hover:text-black"
                    onClick={async () => await handleBuy()}
                  >
                    <p>Invest Now with USDC</p>
                  </button>
                ) : kycStatus === false ? (
                  <button
                    disabled
                    className="w-full py-2 mb-4 text-lg font-normal text-white bg-green-500 border-2 border-green-500 rounded-xl cursor-not-allowed hover:bg-green-500/80"
                  >
                    <p>Your KYC is under process</p>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowKycDialog(true)}
                    className="w-full py-2 mb-4 text-lg font-normal text-white bg-red-500 border-2 border-red-500 rounded-xl hover:bg-red-500/80 hover:text-white hover:underline"
                  >
                    <p>Complete KYC to invest</p>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowKycDialog(true)}
                className="w-full py-2 mb-4 text-lg font-normal text-white bg-blue-500 border-2 border-blue-500 rounded-xl hover:bg-blue-500/80 hover:text-white hover:underline"
              >
                <p>Login to start investing</p>
              </button>
            )}
          </div>
        </div>
        <KycForm open={showKycDialog} onOpenChange={setShowKycDialog} />
      </div>
    </div>
  );
};

// Helper function to map location to coordinates
// const getCoordinates = (location: string): [number, number] => {
//   const locationMap: { [key: string]: [number, number] } = {
//     "Sydney, Australia": [-33.8688, 151.2093],
//     "Pune, Maharashtra": [18.5204, 73.8567],
//     "Mumbai": [19.0760, 72.8777],
//   };
//   return locationMap[location] || [18.5204, 73.8567]; // Default to Pune
// };

export default PropertyView;