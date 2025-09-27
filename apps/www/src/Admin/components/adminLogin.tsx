import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import AdminRegister from './adminRegister'

const AdminLogin = () => {
    const [showRegisterdialog, setShowRegisterDialog] = useState(false)
    return (
        <Dialog>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Login as admin
                    </DialogTitle>
                </DialogHeader>
                <div>
                    <Button onClick={() => setShowRegisterDialog(true)}>
                        register now
                    </Button>
                </div>
            </DialogContent>
            <AdminRegister open={showRegisterdialog} onOpenChange={setShowRegisterDialog} />
        </Dialog>
    )
}

export default AdminLogin
