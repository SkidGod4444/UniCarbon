import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Admin {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminRegister = ({ open, onOpenChange}: Admin) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    Register as admin 
                </DialogTitle>
            </DialogHeader>
        </DialogContent>
    </Dialog>
  )
}

export default AdminRegister
