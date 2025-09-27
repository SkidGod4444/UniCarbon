import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from "@nextui-org/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserKyc {
  id: string;
  fullName?: string;
  username?: string;
  phoneNumber?: string;
  documentType?: string;
  documentNumber?: string;
  documentImage?: string;
  user_id?: string;
  status?: boolean;
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserKyc[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserKyc[]>([]);
  const [, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [filterKyc, setFilterKyc] = useState<'all' | 'kyc' | 'nonkyc'>('all');
  const [selectedUser, setSelectedUser] = useState<UserKyc | null>(null);


  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_kyc')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    } else {
      toast.error("Failed to fetch users");
      console.error(error);
    }
    setLoading(false);
  };

  const handleKycToggle = async (kycId: string, currentStatus: boolean | null | undefined, user_id: string) => {
    const { error } = await supabase
      .from('user_kyc')
      .update({ status: !currentStatus })
      .eq('id', kycId);

    if (!error) {
      await supabase
        .from('users')
        .update({ kyc: !currentStatus })
        .eq('id', user_id);
      toast.success('KYC status updated');
      fetchUsers();
    } else {
      toast.error('Failed to update KYC');
    }
  };

  const handleDelete = async (kycId: string) => {
    const { error } = await supabase
      .from('user_kyc')
      .delete()
      .eq('id', kycId);

    if (!error) {
      toast.success('User KYC deleted');
      fetchUsers();
    } else {
      toast.error('Failed to delete KYC');
    }
  };

  // const handleEdit = (kycId: string) => {
  //   toast.info('Edit user feature coming soon.');
  // };

  const handleFilterChange = (value: 'all' | 'kyc' | 'nonkyc') => {
    setFilterKyc(value);
    let filtered = [...users];

    if (value === 'kyc') {
      filtered = users.filter(u => u.status);
    } else if (value === 'nonkyc') {
      filtered = users.filter(u => !u.status);
    }

    if (search) {
      filtered = filtered.filter(u =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    handleFilterChange(filterKyc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, search, filterKyc]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">All KYC Entries ({filteredUsers.length})</h2>

      <div className="flex gap-4 mb-4 items-center">
        <Input
          placeholder="Search by full name or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Button variant={filterKyc === 'all' ? "default" : "outline"} onClick={() => handleFilterChange('all')}>All</Button>
        <Button variant={filterKyc === 'kyc' ? "default" : "outline"} onClick={() => handleFilterChange('kyc')}>KYC Approved</Button>
        <Button variant={filterKyc === 'nonkyc' ? "default" : "outline"} onClick={() => handleFilterChange('nonkyc')}>KYC Pending</Button>
      </div>

      <Table aria-label="Users Table" className="border rounded-2xl overflow-hidden">
        <TableHeader>
          <TableColumn>Full Name</TableColumn>
          <TableColumn>Username</TableColumn>
          <TableColumn>Phone</TableColumn>
          <TableColumn>Document</TableColumn>
          <TableColumn>Document IMG</TableColumn>
          <TableColumn>KYC</TableColumn>
          <TableColumn>Created At</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>

        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.fullName || '-'}</TableCell>
              <TableCell>{user.username || '-'}</TableCell>
              <TableCell>{user.phoneNumber || '-'}</TableCell>
              <TableCell>{user.documentType || '-'}</TableCell>
              <TableCell>{<>
                <img src={user.documentImage} alt="doc img" className='w-10 h-10' />
              </> || '-'}</TableCell>

              <TableCell>
                <Badge variant={user.status ? "default" : "secondary"}>
                  {user.status ? 'Approved' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="flex gap-2 items-center">
                <Switch
                  checked={!!user.status}
                  onCheckedChange={() => user.user_id && handleKycToggle(user.id, user.status, user.user_id)}
                  className="data-[state=checked]:bg-blue-500"
                />
                {/* <Button size="icon" variant="ghost" className="p-2" onClick={() => handleEdit(user.id)}>
                  <Pencil size={12} />
                </Button> */}
                {/* onClick={() => handleDelete(user.id)} */}
                <Dialog open={open} onOpenChange={setOpen} >
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="p-2"
                      onClick={() => {
                        setSelectedUser(user);
                        setOpen(true);
                      }}
                    >
                      <Trash size={12} />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className=''>
                    <DialogHeader
                    >
                      <DialogTitle>
                        Are you sure you want to delete this {selectedUser?.fullName || selectedUser?.username || 'userrrr'}?
                      </DialogTitle>
                    </DialogHeader>

                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (selectedUser) {
                            handleDelete(selectedUser.id);
                            setSelectedUser(null);
                            setOpen(false);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
