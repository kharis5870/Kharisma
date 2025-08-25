import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Users, UserCheck, Search, ChevronUp, ChevronDown, Save, Shield, Crown, Eye, EyeOff } from "lucide-react";
import { UserData, KetuaTimData, PPLAdminData } from "@shared/api";

export default function ManajemenAdmin() {
  const {
    userList, addUser, removeUser, updateUser,
    ketuaTimList, addKetuaTim, removeKetuaTim, updateKetuaTim,
    pplAdminList, addPPLAdmin, removePPLAdmin, updatePPLAdmin,
    isLoading
  } = useAdmin();
  
  const [activeTab, setActiveTab] = useState("users");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // User States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [newUserData, setNewUserData] = useState<UserData>({ id: '', username: '', password: '', namaLengkap: '', role: 'user' });
  const [editUserData, setEditUserData] = useState<UserData | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSortConfig, setUserSortConfig] = useState<{ key: keyof UserData; direction: 'asc' | 'desc' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Ketua Tim States
  const [showAddKetuaTimModal, setShowAddKetuaTimModal] = useState(false);
  const [showEditKetuaTimModal, setShowEditKetuaTimModal] = useState(false);
  const [ketuaTimToDelete, setKetuaTimToDelete] = useState<KetuaTimData | null>(null);
  const [newKetuaTimData, setNewKetuaTimData] = useState<KetuaTimData>({ id: '', nama: '', nip: '' });
  const [editKetuaTimData, setEditKetuaTimData] = useState<KetuaTimData | null>(null);
  const [ketuaTimSearchTerm, setKetuaTimSearchTerm] = useState("");
  const [ketuaTimSortConfig, setKetuaTimSortConfig] = useState<{ key: keyof KetuaTimData; direction: 'asc' | 'desc' } | null>(null);

  // PPL States
  const [showAddPPLModal, setShowAddPPLModal] = useState(false);
  const [showEditPPLModal, setShowEditPPLModal] = useState(false);
  const [pplToDelete, setPPLToDelete] = useState<PPLAdminData | null>(null);
  const [newPPLData, setNewPPLData] = useState<Omit<PPLAdminData, 'totalKegiatan'>>({ id: '', namaPPL: '', alamat: '', noTelepon: '' });
  const [editPPLData, setEditPPLData] = useState<PPLAdminData | null>(null);
  const [pplSearchTerm, setPplSearchTerm] = useState("");
  const [pplSortConfig, setPplSortConfig] = useState<{ key: keyof PPLAdminData; direction: 'asc' | 'desc' } | null>(null);
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const handleAddUser = () => {
    addUser(newUserData);
    setShowAddUserModal(false);
    setNewUserData({ id: '', username: '', password: '', namaLengkap: '', role: 'user' });
    handleSuccess(`User "${newUserData.username}" berhasil ditambahkan.`);
  };
  const handleEditUser = () => {
    if (editUserData) {
      updateUser(editUserData.id, editUserData);
      setShowEditUserModal(false);
      handleSuccess(`User "${editUserData.username}" berhasil diperbarui.`);
    }
  };
  const handleDeleteUser = () => {
    if (userToDelete) {
      removeUser(userToDelete.id);
      setUserToDelete(null);
      handleSuccess(`User "${userToDelete.username}" berhasil dihapus.`);
    }
  };

  const handleAddKetuaTim = () => {
    addKetuaTim(newKetuaTimData);
    setShowAddKetuaTimModal(false);
    setNewKetuaTimData({ id: '', nama: '', nip: '' });
    handleSuccess(`Ketua Tim "${newKetuaTimData.nama}" berhasil ditambahkan.`);
  };
  const handleEditKetuaTim = () => {
    if (editKetuaTimData) {
      updateKetuaTim(editKetuaTimData.id, editKetuaTimData);
      setShowEditKetuaTimModal(false);
      handleSuccess(`Ketua Tim "${editKetuaTimData.nama}" berhasil diperbarui.`);
    }
  };
  const handleDeleteKetuaTim = () => {
    if (ketuaTimToDelete) {
      removeKetuaTim(ketuaTimToDelete.id);
      setKetuaTimToDelete(null);
      handleSuccess(`Ketua Tim "${ketuaTimToDelete.nama}" berhasil dihapus.`);
    }
  };

  const handleAddPPL = () => {
    addPPLAdmin({ ...newPPLData, totalKegiatan: 0 });
    setShowAddPPLModal(false);
    setNewPPLData({ id: '', namaPPL: '', alamat: '', noTelepon: '' });
    handleSuccess(`PPL "${newPPLData.namaPPL}" berhasil ditambahkan.`);
  };
  const handleEditPPL = () => {
    if (editPPLData) {
      updatePPLAdmin(editPPLData.id, editPPLData);
      setShowEditPPLModal(false);
      handleSuccess(`PPL "${editPPLData.namaPPL}" berhasil diperbarui.`);
    }
  };
  const handleDeletePPL = () => {
    if (pplToDelete) {
      removePPLAdmin(pplToDelete.id);
      setPPLToDelete(null);
      handleSuccess(`PPL "${pplToDelete.namaPPL}" berhasil dihapus.`);
    }
  };

  const filteredAndSortedUsers = useMemo(() => { return userList; }, [userList]);
  const filteredAndSortedKetuaTim = useMemo(() => { return ketuaTimList; }, [ketuaTimList]);
  const filteredAndSortedPPL = useMemo(() => { return pplAdminList; }, [pplAdminList]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin': return 'bg-red-600';
        case 'supervisor': return 'bg-blue-600';
        case 'user': return 'bg-green-600';
        default: return 'bg-gray-600';
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
        case 'admin': return <Shield className="w-3 h-3" />;
        case 'supervisor': return <Crown className="w-3 h-3" />;
        default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Admin</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna sistem, ketua tim, dan PPL</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Manajemen Users</TabsTrigger>
            <TabsTrigger value="ketua-tim">Manajemen Ketua Tim</TabsTrigger>
            <TabsTrigger value="ppl">Manajemen PPL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Daftar Users</CardTitle>
                        <Button onClick={() => setShowAddUserModal(true)}><Plus className="w-4 h-4 mr-2"/>Tambah User</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Nama Lengkap</TableHead><TableHead>Role</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredAndSortedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.namaLengkap}</TableCell>
                                    <TableCell><Badge className={getRoleBadgeColor(user.role)}>{getRoleIcon(user.role)} {user.role}</Badge></TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => {setEditUserData(user); setShowEditUserModal(true);}}><Edit className="w-4 h-4"/></Button>
                                        <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)}><Trash2 className="w-4 h-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ketua-tim" className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Daftar Ketua Tim</CardTitle>
                        <Button onClick={() => setShowAddKetuaTimModal(true)}><Plus className="w-4 h-4 mr-2"/>Tambah Ketua Tim</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>NIP</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredAndSortedKetuaTim.map(kt => (
                                <TableRow key={kt.id}>
                                    <TableCell>{kt.nama}</TableCell>
                                    <TableCell>{kt.nip}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => {setEditKetuaTimData(kt); setShowEditKetuaTimModal(true);}}><Edit className="w-4 h-4"/></Button>
                                        <Button variant="destructive" size="sm" onClick={() => setKetuaTimToDelete(kt)}><Trash2 className="w-4 h-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ppl" className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Daftar PPL</CardTitle>
                        <Button onClick={() => setShowAddPPLModal(true)}><Plus className="w-4 h-4 mr-2"/>Tambah PPL</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Nama PPL</TableHead><TableHead>Alamat</TableHead><TableHead>Telepon</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredAndSortedPPL.map(ppl => (
                                <TableRow key={ppl.id}>
                                    <TableCell>{ppl.namaPPL}</TableCell>
                                    <TableCell>{ppl.alamat}</TableCell>
                                    <TableCell>{ppl.noTelepon}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => {setEditPPLData(ppl); setShowEditPPLModal(true);}}><Edit className="w-4 h-4"/></Button>
                                        <Button variant="destructive" size="sm" onClick={() => setPPLToDelete(ppl)}><Trash2 className="w-4 h-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Berhasil!" description={successMessage} />
        <ConfirmationModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={handleDeleteUser} title="Hapus User?" description={`Yakin ingin menghapus user "${userToDelete?.username}"?`} variant="danger" />
        <ConfirmationModal isOpen={!!ketuaTimToDelete} onClose={() => setKetuaTimToDelete(null)} onConfirm={handleDeleteKetuaTim} title="Hapus Ketua Tim?" description={`Yakin ingin menghapus ketua tim "${ketuaTimToDelete?.nama}"?`} variant="danger" />
        <ConfirmationModal isOpen={!!pplToDelete} onClose={() => setPPLToDelete(null)} onConfirm={handleDeletePPL} title="Hapus PPL?" description={`Yakin ingin menghapus PPL "${pplToDelete?.namaPPL}"?`} variant="danger" />

      </div>
    </Layout>
  );
}
