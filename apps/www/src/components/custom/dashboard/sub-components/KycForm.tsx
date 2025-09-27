import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface KycFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormState = {
  fullName: '',
  phoneNumber: '',
  username: '',
  documentType: '',
  documentNumber: '',
  documentImage: ''
};

const initialErrors = {
  fullName: '',
  phoneNumber: '',
  username: '',
  documentType: '',
  documentNumber: '',
  documentImage: ''
};

const documentOptions = ['Aadhar', 'PAN', 'Driving Licence', 'Voter ID'];

const KycForm: React.FC<KycFormProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState(initialErrors);
  const [userId, setUserId] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<null | 'pending' | 'verified'>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    const checkUserKyc = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const id = authData?.user?.id;
      if (!id) return;

      setUserId(id);

      const { data: kycData } = await supabase
        .from('user_kyc')
        .select('status')
        .eq('user_id', id)
        .maybeSingle();

      if (kycData) {
        setKycStatus(kycData.status ? 'verified' : 'pending');
      } else {
        setKycStatus(null); // no KYC submitted
      }
    };

    checkUserKyc();
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `kyc/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('kycdocument')
      .upload(filePath, file);

    if (uploadError) {
      console.error('File upload failed:', uploadError.message);
      toast.error('Document upload failed.');
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('kycdocument')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      toast.error('Could not get document URL.');
      setIsUploading(false);
      return;
    }

    handleInputChange('documentImage', publicUrl);
    toast.success('Document uploaded successfully.');
    setIsUploading(false);
  };

  const validateForm = () => {
    const newErrors = { ...initialErrors };

    if (!formData.fullName.trim() || formData.fullName.length < 3)
      newErrors.fullName = 'Full name must be at least 3 characters.';

    if (!/^\d{10}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = 'Phone number must be 10 digits.';

    if (!formData.username.trim() || formData.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters.';

    if (!formData.documentType)
      newErrors.documentType = 'Please select a document type.';

    if (!formData.documentNumber.trim() || formData.documentNumber.length < 4)
      newErrors.documentNumber = `Enter a valid ${formData.documentType} number.`;

    if (!formData.documentImage)
      newErrors.documentImage = 'Please upload a document image.';

    setErrors(newErrors);

    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSubmit = async () => {
    if (!validateForm() || !userId || kycStatus !== null) return;

    const kycPayload = {
      user_id: userId,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      username: formData.username,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      documentImage: formData.documentImage
    };

    const { error } = await supabase.from('user_kyc').insert([kycPayload]);
    if (error) {
      toast.error('KYC submission failed. Try again');
      console.error(error.message);
      return;
    }

    await supabase.from('users').update({ kyc: true }).eq('id', userId);

    toast.success('KYC submitted successfully. Please wait for approval.');
    setKycStatus('pending');
    setFormData(initialFormState);
    onOpenChange(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>KYC Form</DialogTitle>
          <DialogDescription>
            {kycStatus === 'pending'
              ? 'Your KYC has been submitted and is under review.'
              : kycStatus === 'verified'
              ? 'Your KYC is verified.'
              : 'Fill the following form to complete your KYC.'}
          </DialogDescription>
        </DialogHeader>

        {kycStatus === null && (
          <div className="space-y-4">
            {/* Input fields */}
            {['fullName', 'phoneNumber', 'username'].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{field.replace(/([A-Z])/g, ' $1')}</Label>
                <Input
                  id={field}
                  type="text"
                  placeholder={`Enter ${field}`}
                  value={formData[field as keyof typeof formData] as string}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onKeyPress={(e) => {
                    if (field === 'phoneNumber' && !/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={field === 'phoneNumber' ? 10 : undefined}
                />
                {errors[field as keyof typeof errors] && (
                  <p className="text-red-500 text-sm">{errors[field as keyof typeof errors]}</p>
                )}
              </div>
            ))}

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => handleInputChange('documentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Document" />
                </SelectTrigger>
                <SelectContent>
                  {documentOptions.map((doc) => (
                    <SelectItem key={doc} value={doc}>
                      {doc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.documentType && <p className="text-red-500 text-sm">{errors.documentType}</p>}
            </div>

            {formData.documentType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">{formData.documentType} Number</Label>
                  <Input
                    id="documentNumber"
                    type="text"
                    placeholder={`Enter your ${formData.documentType} number`}
                    value={formData.documentNumber}
                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  />
                  {errors.documentNumber && (
                    <p className="text-red-500 text-sm">{errors.documentNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentImage">{formData.documentType} Image</Label>
                  <Input
                    id="documentImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {errors.documentImage && (
                    <p className="text-red-500 text-sm">{errors.documentImage}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="mt-6 p-6 border border-yellow-300 bg-yellow-50 rounded-xl text-center">
            <p className="text-lg font-medium text-yellow-800">⏳ KYC Under Review</p>
            <p className="text-sm text-yellow-700 mt-2">
              Your KYC documents have been submitted. Our team is reviewing them.<br />
              You will be notified once approved.
            </p>
          </div>
        )}

        {kycStatus === 'verified' && (
          <div className="mt-6 p-6 border border-green-300 bg-green-50 rounded-xl text-center">
            <p className="text-lg font-medium text-green-800">✅ KYC Verified</p>
            <p className="text-sm text-green-700 mt-2">
              You’ve already completed KYC. You’re good to go!
            </p>
          </div>
        )}

        <DialogFooter className="mt-6 flex justify-end gap-3">
          {
            kycStatus === 'pending' ? (
              <Button
                  className="mt-4 w-full"
                  onClick={handleCancel}
                >
                  OK
                </Button>
            ): (

          <Button variant="outline" onClick={handleCancel}>
            Close
          </Button>
            )
          }
          {kycStatus === null && (
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Submit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KycForm;
