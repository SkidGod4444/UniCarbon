import { useEffect, useState } from "react";
import YourTransactionTable from "../sub-components/transaction.table";
import { useAuth } from "@/hooks/AuthContext";
import { supabase } from "@/lib/supabase";

type Transaction = {
  amount: number;
  currency: string;
  order_id: string;
  created_at: string;
  status: string;
  shares: number;
  property_name: string;
};

type RawTransaction = {
  amount: number;
  currency: string;
  order_id: string;
  created_at: string;
  status: string;
  shares: number;
  property_data?: { name?: string }[];
};

const Transaction_History = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const tempUser = useAuth();
  const user = tempUser.user?.id;

  useEffect(() => {
    const fetchUserTransactions = async () => {
      if (!user) {
        console.log("User ID not available yet");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("payments")
          .select(
            `
            amount,
            currency,
            order_id,
            created_at,
            status,
            shares,
            property_data (
              name
            )
          `
          )
          .eq("user_id", user);

        if (error) {
          console.error("Error fetching user transactions:", error);
          alert("Error fetching user transactions");
          return;
        }

        if (!data) {
          console.error("No data returned from Supabase.");
          return;
        }

        const formattedTransactions: Transaction[] = data.flatMap(
          (row: RawTransaction) => {
            // Ensure `property_data` is always an array, even if it’s not
            const properties = Array.isArray(row.property_data)
              ? row.property_data
              : [row.property_data];

            return properties.map((property) => ({
              amount: row.amount,
              currency: row.currency,
              order_id: row.order_id,
              created_at: row.created_at,
              status: row.status,
              shares: row.shares,
              property_name: property?.name || "Unknown", // Access name for each property
            }));
          }
        );

        console.log("Fetched transactions:", formattedTransactions);
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchUserTransactions();
  }, [user]);

  return (
    <div>
      <YourTransactionTable transactions={transactions} />
    </div>
  );
};

export default Transaction_History;
