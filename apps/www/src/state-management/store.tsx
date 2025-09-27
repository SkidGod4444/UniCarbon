/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
// import {
//   fetchAllDigitalAssetByOwner,
//   fetchDigitalAsset,
// } from "@metaplex-foundation/mpl-token-metadata";
// // import { on } from "events";

const supabase = createClient(
  "https://ubxuzhytajrlndftekqi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieHV6aHl0YWpybG5kZnRla3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5NjQ0NTIsImV4cCI6MjA0MTU0MDQ1Mn0.Jw7JEA_mAdDL1pRQTckT8FKc3O_G5bLK-JUBGV7ti8c"
);

// This is the initial Zustand store for your application using immer middleware.
// A store contains the state variables and functions to modify the state immutably.
interface BearStore {
  bears: number; // State variable to keep track of the bear population.
  increasePopulation: () => void; // Function to increase the number of bears.
  removeAllBears: () => void; // Function to reset the bear count.
  setBears: (newCount: number) => void; // Function to directly set the bear count.
  fetchBearsFromAPI: () => Promise<void>; // Function to fetch bear data from backend API.
}

// Create a Zustand store using immer for immutable state updates
export const useBearStore = create<BearStore>(
  immer((set) => ({
    bears: 0,

    // Increase the bear population by 1, using immer to mutate the state immutably.
    increasePopulation: () =>
      set((state) => {
        state.bears += 1;
      }),

    // Reset the bear population to 0.
    removeAllBears: () =>
      set((state) => {
        state.bears = 0;
      }),

    // Directly set the bear count to a specific number.
    setBears: (newCount: number) =>
      set((state) => {
        state.bears = newCount;
      }),

    // Fetch bear population from a backend API using Axios.
    fetchBearsFromAPI: async () => {
      try {
        const response = await axios.get("https://your-api-endpoint.com/bears");
        set((state) => {
          state.bears = response.data.bearCount;
        });
      } catch (error) {
        console.error("Error fetching bears:", error);
      }
    },
  }))
);

// Create another store for user authentication using immer.
interface UserStore {
  isAuthenticated: boolean; // State variable to track authentication status.
  login: () => void; // Function to log in the user.
  logout: () => void; // Function to log out the user.
}

// Create a User store using immer
export const useUserStore = create<UserStore>(
  immer((set) => ({
    isAuthenticated: false,
    userBalance: 0,
    setUserBalance: (newBalance: number) =>
      set((state) => {
        state.userBalance = newBalance;
      }),
    // Log in the user, setting `isAuthenticated` to true.
    login: () =>
      set((state) => {
        state.isAuthenticated = true;
      }),

    // Log out the user, setting `isAuthenticated` to false.
    logout: () =>
      set((state) => {
        state.isAuthenticated = false;
      }),
  }))
);

// write a store to display and hide a loading overlay
interface LoadingStore {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, loadingMessage: string) => void;
}

export const useLoadingStore = create<LoadingStore>(
  immer((set) => ({
    isLoading: false,
    loadingMessage: "",
    setLoading: (loading: boolean, loadingMessage: string) =>
      set((state) => {
        state.isLoading = loading;
        state.loadingMessage = loadingMessage;
      }),
  }))
);

// write a store to display and hide a wallet overlay modal
interface WalletOverlayStore {
  showWalletOverlay: boolean;
  setShowWalletOverlay: (show: boolean) => void;
}

export const useWalletOverlayStore = create<WalletOverlayStore>(
  immer((set) => ({
    showWalletOverlay: false,
    setShowWalletOverlay: (show: boolean) =>
      set((state) => {
        state.showWalletOverlay = show;
      }),
  }))
);

// Properties store (second store)
export const usePropertiesStore = create(
  immer((set) => ({
    properties: [],
    priceData: [],
    totalAssetValue: 0,
    sellOrderData: [],
    onChainMasterEditionData: [],
    currentProperty: null,
    launchpadData: null,
    userInvestments: null,
    userTransactions: [],
    sellOrdersForUser: [],
    sellOrdersForProperty: [],
    setTotalAssetValue: (newValue: number) =>
      set((state) => {
        state.totalAssetValue = newValue;
      }),
    fetchProperties: async () => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching properties...");

        const { data: properties_data, error } = await supabase
          .from("properties_data")
          .select("*");

        // const { price_data, error } = await supabase
        //   .from("PriceTracker")
        //   .select("*");

        // console.log("Price data:", price_data);

        if (error) {
          throw new Error("Error fetching properties data");
        }

        console.log("Properties data:", properties_data);

        // Fetch JSON data for all properties in parallel
        const propertiesWithJSONData = await Promise.all(
          properties_data.map(async (property) => {
            const JSONFile = property.JSONFile;
            try {
              const response = await axios.get(JSONFile);
              property.JSONData = response.data;
            } catch (jsonError) {
              console.error(
                `Error fetching JSON data for property ${property.UUID}:`,
                jsonError
              );
              property.JSONData = null; // Handle missing or erroneous JSON data
            }
            return property;
          })
        );

        // Update properties in the store, resetting any previous data
        set((state) => {
          state.properties = propertiesWithJSONData;
        });

        console.log("Properties from API:", propertiesWithJSONData);

        setLoading(false, ""); // Stop loading after fetching
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchPriceData: async () => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching price data...");
        const { data: PriceTracker, error } = await supabase
          .from("PriceTracker")
          .select("*");

        if (error) {
          throw new Error("Error fetching price data");
        }

        set((state) => {
          state.priceData = PriceTracker;
        });

        console.log("Price data:", PriceTracker);
      } catch (error) {
        console.error("Error fetching price data:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchSellOrders: async () => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching sell orders...");
        const { data: SellOrders, error } = await supabase
          .from("SellOrders")
          .select("*");

        if (error) {
          throw new Error("Error fetching sell orders");
        }

        // Aggregating the sell orders based on UUID
        const aggregatedData = SellOrders.reduce((acc, order) => {
          const {
            UUID,
            TokenAddress,
            SellerAddress,
            created_at,
            Quantity,
            PricePerShare,
            id,
          } = order;

          // If the UUID does not exist in the accumulator, initialize it
          if (!acc[UUID]) {
            acc[UUID] = {
              tokenAddress: TokenAddress,
              orders: [],
            };
          }

          // Add the sell order to the relevant UUID
          acc[UUID].orders.push({
            sellerAddress: SellerAddress,
            createdAt: created_at,
            quantity: Quantity,
            pricePerShare: PricePerShare,
            sellOrderId: id,
          });

          return acc;
        }, {});

        set((state) => {
          state.sellOrderData = aggregatedData; // Store the aggregated data in the store
        });

        console.log("Aggregated sell orders:", aggregatedData);
      } catch (error) {
        console.error("Error fetching sell orders:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchOnChainMasterEditionData: async (umi, properties) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching on-chain data...");

        if (properties.length === 0) {
          throw new Error("Properties data is empty. Fetch properties first.");
        }

        // Use Promise.all to handle async calls in parallel
        const tempCollMetadata = await Promise.all(
          properties.map(async (property) => {
            const { UUID, TokenAddress } = property;
            const collectionMetadata = await fetchDigitalAsset(
              umi,
              TokenAddress
            );
            return { UUID, TokenAddress, collectionMetadata };
          })
        );

        // Set the state after all async operations have completed
        set((state) => {
          state.onChainMasterEditionData = tempCollMetadata;
        });

        console.log("On-chain Collection Data:", tempCollMetadata);
      } catch (error) {
        console.error("Error fetching on-chain data:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchTxnsForProperty: async (uuid) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching transactions...");

        // Fetch transactions from the blockchain using the Metaplex SDK
        const { data, error } = await supabase
          .from("Transactions")
          .select("*")
          .eq("UUID", uuid);

        if (error) {
          throw new Error("Error fetching transactions");
        } else {
          console.log("Transactions for property:", data);
        }

        return data;

        console.log("Transactions for property:", transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchEverythingByUUID: async (umi, UUID) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching data... ");

        console.log("Fetching data for UUID:", UUID);

        let tempProperty = null;

        const { data: properties_data, error } = await supabase
          .from("properties_data")
          .select("*")
          .eq("UUID", UUID);

        if (error) {
          throw new Error("Error fetching properties data");
        }

        console.log("Properties data:", properties_data);

        tempProperty = properties_data[0];

        // Fetch JSON data for all properties in parallel
        const propertiesWithJSONData = await Promise.all(
          properties_data.map(async (property) => {
            const JSONFile = property.JSONFile;
            try {
              const response = await axios.get(JSONFile);
              property.JSONData = response.data;
            } catch (jsonError) {
              console.error(
                `Error fetching JSON data for property ${property.UUID}:`,
                jsonError
              );
              property.JSONData = null; // Handle missing or erroneous JSON data
            }
            return property;
          })
        );

        tempProperty.JSONData = propertiesWithJSONData[0].JSONData;

        // fetch price data
        const { data: PriceTracker, errorPrice } = await supabase
          .from("PriceTracker")
          .select("*")
          .eq("UUID", UUID);

        if (errorPrice) {
          throw new Error("Error fetching price data");
        }

        tempProperty.priceData = PriceTracker;

        // fetch on chain master edition data
        const collectionMetadata = await fetchDigitalAsset(
          umi,
          tempProperty.TokenAddress
        );

        tempProperty.collectionMetadata = collectionMetadata;

        // fetch sell orders
        const { data: SellOrders, errorSellOrders } = await supabase
          .from("SellOrders")
          .select("*")
          .eq("UUID", UUID);

        if (errorSellOrders) {
          throw new Error("Error fetching sell orders");
        }

        tempProperty.sellOrders = SellOrders;

        // fetch transactions
        const { data: Transactions, errorTransactions } = await supabase
          .from("Transactions")
          .select("*")
          .eq("UUID", UUID);

        if (errorTransactions) {
          throw new Error("Error fetching transactions");
        }

        tempProperty.transactions = Transactions;

        // fetch launchpad data\
        const { data: LaunchpadData, errorLaunchpad } = await supabase
          .from("Launchpad")
          .select("*")
          .eq("UUID", UUID);

        if (errorLaunchpad) {
          throw new Error("Error fetching launchpad data");
        }

        tempProperty.launchpadData = LaunchpadData;

        // Set the state after all async operations have completed
        set((state) => {
          state.currentProperty = tempProperty;
        });

        setLoading(false, ""); // Stop loading after fetching
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchLaunchpadDataForProperty: async (UUID) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Fetching launchpad data...");

        const { data: LaunchpadData, error } = await supabase
          .from("Launchpad")
          .select("*")
          .eq("UUID", UUID);

        if (error) {
          throw new Error("Error fetching launchpad data");
        }

        set((state) => {
          state.launchpadData = LaunchpadData;
        });

        console.log("Launchpad data:", LaunchpadData);
      } catch (error) {
        console.error("Error fetching launchpad data:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchUserProperties: async (umi, userAddress) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        console.log("Fetching user properties for address:", userAddress);

        setLoading(true, "Fetching user properties...", userAddress);

        const assetsByOwner = await fetchAllDigitalAssetByOwner(
          umi,
          userAddress
        );

        // loop through the assets and get the edition.parent address and mint.publicKey address and put them in an array of objects
        const UserProperties = assetsByOwner.map((asset) => {
          const { edition, mint } = asset;
          return {
            edition: edition.parent,
            mint: mint.publicKey,
          };
        });

        // Aggregate the data by edition.parent address
        const aggregatedData = UserProperties.reduce((acc, property) => {
          const { edition } = property;
          if (!acc[edition]) {
            acc[edition] = {
              parentAddress: edition,
              quantity: 1,
            };
          } else {
            acc[edition].quantity += 1;
          }
          return acc;
        }, {});

        // Convert the object to an array of objects for querying Supabase
        const aggregatedArray = Object.values(aggregatedData);

        // Initialize an array to hold the final results with UUID and TokenAddress
        const finalResult = [];

        // Fetch data from Supabase and update aggregatedArray with UUID and TokenAddress
        for (const property of aggregatedArray) {
          const { parentAddress } = property;

          // Query Supabase to match the parentAddress with the PublicKey column
          const { data, error } = await supabase
            .from("properties_data")
            .select(
              "UUID, TokenAddress, JSONFile, BaseValue, RentType, RentValue, Location"
            )
            .eq("PublicKey", parentAddress);

          if (error) {
            console.error(`Error fetching data for ${parentAddress}:`, error);
          } else if (data && data.length > 0) {
            // Add the UUID and TokenAddress to the property object
            finalResult.push({
              ...property,
              UUID: data[0].UUID,
              TokenAddress: data[0].TokenAddress,
              JSONFile: data[0].JSONFile,
              BaseValue: data[0].BaseValue,
              RentType: data[0].RentType,
              RentValue: data[0].RentValue,
              Location: data[0].Location,
            });
          } else {
            console.log(`No matching data found for ${parentAddress}`);
          }
        }

        // fetch JSON data for all properties
         
        const propertiesWithJSONData = await Promise.all(
          finalResult.map(async (property) => {
            const JSONFile = property.JSONFile;
            try {
              const response = await axios.get(JSONFile);
              property.JSONData = response.data;
            } catch (jsonError) {
              console.error(
                `Error fetching JSON data for property ${property.UUID}:`,
                jsonError
              );
              property.JSONData = null; // Handle missing or erroneous JSON data
            }
            return property;
          })
        );

        // get the price data for all properties
        const propertiesWithPriceData = await Promise.all(
          finalResult.map(async (property) => {
            const { UUID } = property;
            const { data: PriceTracker, error } = await supabase
              .from("PriceTracker")
              .select("*")
              .eq("UUID", UUID);

            if (error) {
              throw new Error("Error fetching price data");
            }

            property.priceData = PriceTracker;

            return property;
          })
        );

        const totalPropertiesHeld = finalResult.length;
        const totalSharesHeld = finalResult.reduce(
          (sum, property) => sum + property.quantity,
          0
        );

        // =================================================
        // Fetch the user's investments and calculate the total invested amount
        // =================================================
        const { data, error } = await supabase
          .from("Transactions")
          .select("UUID, Quantity, Price")
          .eq("To", userAddress); // Match only the 'To' field with userAddress

        if (error) {
          throw error;
        }

        // Reduce the data to aggregate by UUID
        const aggregatedInvData = data.reduce((acc, txn) => {
          const { UUID, Quantity, Price } = txn;

          if (!acc[UUID]) {
            // Initialize a new entry if the UUID is not yet in the accumulator
            acc[UUID] = {
              UUID,
              totalSharesBought: 0,
              totalInvestedAmount: 0,
            };
          }

          // Accumulate the shares bought and the invested amount
          acc[UUID].totalSharesBought += Quantity;
          acc[UUID].totalInvestedAmount += Quantity * Price;

          return acc;
        }, {});

        // Convert the result into an array of objects
        const investmentAggData = Object.values(aggregatedInvData);

        // =================================================
        // =================================================

        // calculate the total invested amount
        const totalInvestedAmount = investmentAggData.reduce(
          (sum, item) => sum + item.totalInvestedAmount,
          0
        );

        // calculate the current total value of the portfolio based on the latest price data
        const totalCurrentPortfolioValue = propertiesWithPriceData.reduce(
          (sum, property) =>
            sum + property.priceData[0].Price * property.quantity,
          0
        );

        const totalProfit = totalCurrentPortfolioValue - totalInvestedAmount;

        console.log(
          "Final aggregated data with UUID and TokenAddress:",
          finalResult
        );

        set((state) => {
          state.userInvestments = {
            properties: propertiesWithPriceData,
            totalPropertiesHeld,
            totalSharesHeld,
            totalInvestedAmount,
            totalCurrentPortfolioValue,
            totalProfit,
          };
        });

        return finalResult;
      } catch (error) {
        console.error("Error fetching user properties:", error);
      } finally {
        setLoading(false, "");
      }
    },
    fetchUserInvestments: async (userAddress) => {
      try {
        const { data, error } = await supabase
          .from("Transactions")
          .select("UUID, Quantity, Price")
          .eq("To", userAddress); // Match only the 'To' field with userAddress

        if (error) {
          throw error;
        }

        // Reduce the data to aggregate by UUID
        const aggregatedData = data.reduce((acc, txn) => {
          const { UUID, Quantity, Price } = txn;

          if (!acc[UUID]) {
            // Initialize a new entry if the UUID is not yet in the accumulator
            acc[UUID] = {
              UUID,
              totalSharesBought: 0,
              totalInvestedAmount: 0,
            };
          }

          // Accumulate the shares bought and the invested amount
          acc[UUID].totalSharesBought += Quantity;
          acc[UUID].totalInvestedAmount += Quantity * Price;

          return acc;
        }, {});

        // Convert the result into an array of objects
        const resultArray = Object.values(aggregatedData);

        console.log("User's investment per project:", resultArray);

        return resultArray;
      } catch (error) {
        console.error("Error fetching user investments:", error);
        return [];
      }
    },
    fetchUserTxns: async (userAddress) => {
      console.log("Fetching user transactions for address:", userAddress);
      try {
        // Query the Transactions table for records where the From or To field matches the userAddress
        const { data, error } = await supabase
          .from("Transactions")
          .select("*")
          .or(`From.eq.${userAddress},To.eq.${userAddress}`); // Match address in both 'From' and 'To' fields

        if (error) {
          throw error;
        }

        // Return the data if no errors occurred
        console.log("User transactions found:", data);

        // in each transaction object get the UUID and fetch the property data (Name, and Location) from properties_data and add it to the transaction object
        const transactionsWithPropertyData = await Promise.all(
          data.map(async (txn) => {
            const { UUID } = txn;

            const { data: propertyData, error: propError } = await supabase
              .from("properties_data")
              .select("Name, Location")
              .eq("UUID", UUID);

            if (propError) {
              console.error("Error fetching property data:", propError);
              return txn;
            }

            // Add the property data to the transaction object
            txn.propertyData = propertyData[0];

            return txn;
          })
        );

        set((state) => {
          state.userTransactions = data;
        });

        return data;
      } catch (error) {
        console.error("Error fetching user transactions:", error);
        return [];
      }
    },
    updateLaunchpadStatus: async (uuid, quantity) => {
      try {
        // Fetch the current state of the launchpad row first
        const { data: launchpadData, error: fetchError } = await supabase
          .from("Launchpad")
          .select("SharesAvailable, Raised, TargetValue")
          .eq("UUID", uuid)
          .eq("Status", true)
          .single(); // Fetch only one row with UUID

        // Check for errors in fetching data
        if (fetchError) {
          console.error("Error fetching launchpad data:", fetchError);
          return { success: false, error: fetchError };
        }

        // Calculate the new values
        const newSharesAvailable = launchpadData.SharesAvailable - quantity;
        const newRaised = launchpadData.Raised + quantity * 100;
        const statusUpdate =
          newRaised >= launchpadData.TargetValue ? false : true; // Close the status if the raised value reaches the target

        // Perform the update
        const { data: updatedLaunchpadData, error: launchpadError } =
          await supabase
            .from("Launchpad")
            .update({
              SharesAvailable: newSharesAvailable, // Decrease available shares
              Raised: newRaised, // Increase raised value
              Status: statusUpdate, // Change status if target is reached
            })
            .eq("UUID", uuid)
            .eq("Status", true) // Update only if the launchpad is active (status is true)
            .select(); // Return updated data

        // Check if there is an error in the update query
        if (launchpadError) {
          console.error("Error updating launchpad:", launchpadError);
          return { success: false, error: launchpadError };
        }

        // If raised amount equals or exceeds the target, set the property status to 'trading'
        if (newRaised >= launchpadData.TargetValue) {
          const { error: propertyError } = await supabase
            .from("properties_data")
            .update({ Status: "trading" }) // Update the status to 'trading'
            .eq("UUID", uuid); // Match the UUID in properties_data

          // Check for any errors in updating properties_data
          if (propertyError) {
            console.error("Error updating property status:", propertyError);
            return { success: false, error: propertyError };
          }
        }

        // Return success if everything was updated correctly
        return { success: true, data: updatedLaunchpadData };
      } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: err };
      }
    },
    addTransaction: async ({
      UUID,
      TokenAddress,
      TxnType,
      From,
      To,
      Quantity,
      Price,
      Hash,
    }) => {
      try {
        const { data, error } = await supabase
          .from("Transactions") // Your table name
          .insert([
            {
              UUID,
              TokenAddress,
              TxnType, // Assuming USER-DEFINED types work correctly here
              From,
              To,
              Quantity,
              Price,
              Hash,
            },
          ]);

        if (error) {
          console.error("Error inserting transaction:", error);
          return { success: false, error };
        }

        return { success: true, data };
      } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: err };
      }
    },
    fetchSellOrdersForAUser: async (userAddress) => {
      try {
        const { data, error } = await supabase
          .from("SellOrders")
          .select("*")
          .eq("SellerAddress", userAddress);

        if (error) {
          throw error;
        }

        // get the property data for each sell order
        const sellOrdersWithPropertyData = await Promise.all(
          data.map(async (order) => {
            const { UUID } = order;

            const { data: propertyData, error: propError } = await supabase
              .from("properties_data")
              .select("Name, Location")
              .eq("UUID", UUID);

            if (propError) {
              console.error("Error fetching property data:", propError);
              return order;
            }

            // Add the property data to the transaction object
            order.propertyData = propertyData[0];

            return order;
          })
        );

        console.log("Sell orders for user:", sellOrdersWithPropertyData);

        set((state) => {
          state.sellOrdersForUser = sellOrdersWithPropertyData;
        });

        return data;
      } catch (error) {
        console.error("Error fetching sell orders:", error);
        return [];
      }
    },
    fetchSellOrdersForAProperty: async (UUID) => {
      try {
        const { data, error } = await supabase
          .from("SellOrders")
          .select("*")
          .eq("UUID", UUID);

        if (error) {
          throw error;
        }

        set((state) => {
          state.sellOrdersForProperty = data;
        });

        console.log("Sell orders for property:", data, UUID);

        return data;
      } catch (error) {
        console.error("Error fetching sell orders:", error);
        return [];
      }
    },
    addSellOrder: async ({
      UUID,
      TokenAddress,
      SellerAddress,
      Quantity,
      PricePerShare,
    }) => {
      const { setLoading } = useLoadingStore.getState(); // Access setLoading from the loading store
      try {
        setLoading(true, "Creating sell order...");
        const { data, error } = await supabase.from("SellOrders").insert([
          {
            UUID,
            TokenAddress,
            SellerAddress,
            Quantity,
            PricePerShare,
          },
        ]);

        if (error) {
          console.error("Error inserting sell order:", error);
          return { success: false, error };
        }

        return { success: true, data };
      } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: err };
      } finally {
        setLoading(false, "");
      }
    },
    removeSellOrder: async (sellOrderId) => {
      const { setLoading } = useLoadingStore.getState();
      try {
        setLoading(true, "Withdrawing sell order...");
        const { data, error } = await supabase
          .from("SellOrders")
          .delete()
          .eq("id", sellOrderId);

        if (error) {
          console.error("Error deleting sell order:", error);
          return { success: false, error };
        }

        return { success: true, data };
      } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: err };
      } finally {
        setLoading(false, "");
      }
    },
  }))
);
