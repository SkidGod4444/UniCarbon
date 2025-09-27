import { supabase } from "@/lib/supabase";
import { createContext, useContext, useEffect, useState } from "react";

type KycDetailsType = {
  id: string;
  full_name: string;
  phonenumber: number;
  document_type: string;
  document_number: string;
  status: boolean;
} | null;

type KycContextType = {
  kycStatus: boolean | null;
  kycDetails: KycDetailsType;
  loading: boolean;
  refreshKyc: () => Promise<void>;
};

const KycContext = createContext<KycContextType>({
  kycStatus: null,
  kycDetails: null,
  loading: true,
  refreshKyc: async () => {},
});

export const KycProvider = ({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) => {
  const [kycStatus, setKycStatus] = useState<boolean | null>(null);
  const [kycDetails, setKycDetails] = useState<KycDetailsType>(null);
  const [loading, setLoading] = useState(true);

  const fetchKyc = async () => {
    if (!user?.id) {
      setKycStatus(null);
      setKycDetails(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_kyc")
      .select("id, fullName, phoneNumber, documentType, documentNumber, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setKycDetails({
        id: data.id,
        full_name: data.fullName,
        phonenumber: data.phoneNumber,
        document_type: data.documentType,
        document_number: data.documentNumber,
        status: data.status,
      });
      setKycStatus(data.status);
    } else {
      setKycDetails(null);
      setKycStatus(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchKyc();
  }, [user]);

  return (
    <KycContext.Provider
      value={{ kycStatus, kycDetails, loading, refreshKyc: fetchKyc }}
    >
      {children}
    </KycContext.Provider>
  );
};

export const useKyc = () => useContext(KycContext);
