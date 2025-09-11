// client/pages/ManajemenAdmin.tsx

import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAdmin } from "@/contexts/AdminContext";
import { UserData, KetuaTimData, PPLAdminData, Kecamatan, Desa } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem 
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  UserCheck,
  Search,
  ChevronUp,
  ChevronDown,
  Save,
  Shield,
  Crown,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query"; 
import { apiClient } from "@/lib/apiClient";

const fetchKecamatan = async (): Promise<Kecamatan[]> => apiClient.get('/alamat/kecamatan');
const fetchDesa = async (kecamatanId: string): Promise<Desa[]> => apiClient.get(`/alamat/desa?kecamatanId=${kecamatanId}`);

export default function ManajemenAdmin() {
  const {
    userList,
    addUser,
    removeUser,
    updateUser,
    ketuaTimList,
    addKetuaTim,
    removeKetuaTim,
    updateKetuaTim,
    pplAdminList,
    addPPLAdmin,
    removePPLAdmin,
    updatePPLAdmin
  } = useAdmin();
  
  const { data: kecamatanList = [] } = useQuery({ queryKey: ['kecamatan'], queryFn: fetchKecamatan });
  const [desaOptions, setDesaOptions] = useState<Desa[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showAddKetuaTimModal, setShowAddKetuaTimModal] = useState(false);
  const [showAddPPLModal, setShowAddPPLModal] = useState(false);
  const [showEditPPLModal, setShowEditPPLModal] = useState(false);
  const [showDeletePPLModal, setShowDeletePPLModal] = useState(false);
  const [showEditKetuaTimModal, setShowEditKetuaTimModal] = useState(false);
  const [showDeleteKetuaTimModal, setShowDeleteKetuaTimModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formError, setFormError] = useState<string | null>(null);

  const [newUserData, setNewUserData] = useState<UserData>({
    id: "",
    username: "",
    password: "",
    namaLengkap: "",
    role: "user" as const,
    isPML: false
  });
  const [editUserData, setEditUserData] = useState<UserData | null>(null);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  
  const [newKetuaTimData, setNewKetuaTimData] = useState<KetuaTimData>({
    id: "",
    nama: "",
    nip: ""
  });
  const [editKetuaTimData, setEditKetuaTimData] = useState<KetuaTimData | null>(null);
  const [deleteKetuaTimId, setDeleteKetuaTimId] = useState("");
  const [deleteKetuaTimName, setDeleteKetuaTimName] = useState("");

  const [newPPLData, setNewPPLData] = useState<PPLAdminData>({
    id: "",
    namaPPL: "",
    posisi: "Pendataan",
    totalKegiatan: 0,
    alamat: "",
    noTelepon: "",
    kegiatanDetails: []
  });
  const [editPPLData, setEditPPLData] = useState<PPLAdminData | null>(null);
  const [deletePPLId, setDeletePPLId] = useState("");
  const [deletePPLName, setDeletePPLName] = useState("");
  
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [ketuaTimSearchTerm, setKetuaTimSearchTerm] = useState("");
  const [pplSearchTerm, setPplSearchTerm] = useState("");
  const [userSortConfig, setUserSortConfig] = useState<{ key: keyof UserData; direction: 'asc' | 'desc'; } | null>(null);
  const [ketuaTimSortConfig, setKetuaTimSortConfig] = useState<{ key: keyof KetuaTimData; direction: 'asc' | 'desc'; } | null>(null);
  const [pplSortConfig, setPplSortConfig] = useState<{ key: keyof PPLAdminData; direction: 'asc' | 'desc'; } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [setShowEditPassword] = useState(false);
  
  // PERBAIKAN: State paginasi untuk setiap tab
  const [pagination, setPagination] = useState({
      users: { currentPage: 1, rowsPerPage: 10 },
      ketuaTim: { currentPage: 1, rowsPerPage: 10 },
      ppl: { currentPage: 1, rowsPerPage: 10 },
  });

  useEffect(() => {
        // Jika ada PPL yang sedang diedit dan PPL tersebut punya kecamatanId
        if (editPPLData?.kecamatanId) {
            // Ambil daftar desa untuk kecamatan tersebut
            fetchDesa(editPPLData.kecamatanId.toString()).then(setDesaOptions);
        } else {
            // Jika tidak, kosongkan pilihan desa
            setDesaOptions([]);
        }
    }, [editPPLData]); 

  const isValidUserId = (id: string) => id.trim().length >= 1;
  const isValidUsername = (username: string) => username.trim().length >= 3;
  const isValidPassword = (password?: string) => !password || password.trim().length >= 6;
  const isValidNamaLengkap = (nama: string) => nama.trim().length >= 2;
  const isValidNip = (nip: string) => nip.trim().length >= 10;
  const isValidTelepon = (telepon: string) => /^\d{10,}$/.test(telepon.trim());
  const isValidAlamat = (alamat: string) => alamat.trim().length >= 5;
  
  const isDuplicateUserId = (id: string, excludeId?: string) => userList.some(user => user.id.toLowerCase() === id.toLowerCase() && user.id !== excludeId);
  const isDuplicateUsername = (username: string, excludeId?: string) => userList.some(user => user.username.toLowerCase() === username.toLowerCase() && user.id !== excludeId);
  const isDuplicateKetuaTimId = (id: string, excludeId?: string) => ketuaTimList.some(kt => kt.id.toLowerCase() === id.toLowerCase() && kt.id !== excludeId);
  const isDuplicateNip = (nip: string, excludeId?: string) => ketuaTimList.some(kt => kt.nip === nip && kt.id !== excludeId);
  const isDuplicatePPLId = (id: string, excludeId?: string) => pplAdminList.some(ppl => ppl.id.toLowerCase() === id.toLowerCase() && ppl.id !== excludeId);
  const isDuplicatePPLTelepon = (telepon: string, excludeId?: string) => pplAdminList.some(ppl => ppl.noTelepon === telepon && ppl.id !== excludeId);
  
  const handleAddUser = () => {
    setFormError(null);
    const { id, username, password, namaLengkap, role, isPML } = newUserData;
    if (!isValidUserId(id)) { setFormError("ID User harus diisi!"); return; }
    if (!isValidUsername(username)) { setFormError("Username harus minimal 3 karakter!"); return; }
    if (!password || !isValidPassword(password)) { setFormError("Password harus minimal 6 karakter!"); return; }
    if (!isValidNamaLengkap(namaLengkap)) { setFormError("Nama lengkap harus minimal 2 karakter!"); return; }
    if (isDuplicateUserId(id)) { setFormError("ID User sudah ada!"); return; }
    if (isDuplicateUsername(username)) { setFormError("Username sudah ada!"); return; }
    
    addUser({ id: id.trim(), username: username.trim(), password, namaLengkap: namaLengkap.trim(), role, isPML });
    setNewUserData({ id: "", username: "", password: "", namaLengkap: "", role: "user", isPML: false });
    setShowAddUserModal(false);
    setSuccessMessage(`User "${username}" berhasil ditambahkan!`);
    setShowSuccessModal(true);
  };
  
  const handleEditUser = () => {
    setFormError(null);
    if (!editUserData) return;
    const { username, password, namaLengkap } = editUserData;
    if (!isValidUsername(username)) { setFormError("Username harus minimal 3 karakter!"); return; }
    if (!isValidPassword(password)) { setFormError("Password baru harus minimal 6 karakter!"); return; }
    if (!isValidNamaLengkap(namaLengkap)) { setFormError("Nama lengkap harus minimal 2 karakter!"); return; }
    if (isDuplicateUsername(username, editUserData.id)) { setFormError("Username sudah ada!"); return; }
    
    updateUser(editUserData.id, { ...editUserData, username: username.trim(), namaLengkap: namaLengkap.trim() });
    setShowEditUserModal(false);
    setSuccessMessage(`User "${username}" berhasil diperbarui!`);
    setShowSuccessModal(true);
  };
  
  const handleDeleteUser = () => { removeUser(deleteUserId); setShowDeleteUserModal(false); setSuccessMessage(`User "${deleteUserName}" berhasil dihapus!`); setShowSuccessModal(true); };
  
  const handleAddKetuaTim = () => {
    setFormError(null);
    const { id, nama, nip } = newKetuaTimData;
    if (!isValidUserId(id)) { setFormError("ID Ketua Tim harus diisi!"); return; }
    if (!isValidNamaLengkap(nama)) { setFormError("Nama harus minimal 2 karakter!"); return; }
    if (!isValidNip(nip)) { setFormError("NIP harus minimal 10 karakter!"); return; }
    if (isDuplicateKetuaTimId(id)) { setFormError("ID Ketua Tim sudah ada!"); return; }
    if (isDuplicateNip(nip)) { setFormError("NIP sudah ada!"); return; }
    
    addKetuaTim({ id: id.trim(), nama: nama.trim(), nip: nip.trim() });
    setNewKetuaTimData({ id: "", nama: "", nip: "" });
    setShowAddKetuaTimModal(false);
    setSuccessMessage(`Ketua Tim "${nama}" berhasil ditambahkan!`);
    setShowSuccessModal(true);
  };
  
  const handleEditKetuaTim = () => {
    setFormError(null);
    if (!editKetuaTimData) return;
    const { nama, nip } = editKetuaTimData;
    
    if (!isValidNamaLengkap(nama)) { setFormError("Nama harus minimal 2 karakter!"); return; }
    if (!isValidNip(nip)) { setFormError("NIP harus minimal 10 karakter!"); return; }
    if (isDuplicateNip(nip, editKetuaTimData.id)) { setFormError("NIP sudah ada!"); return; }
    
    updateKetuaTim(editKetuaTimData.id, { ...editKetuaTimData, nama: nama.trim(), nip: nip.trim() });
    setShowEditKetuaTimModal(false);
    setSuccessMessage(`Ketua Tim "${nama}" berhasil diperbarui!`);
    setShowSuccessModal(true);
  };
  
  const handleDeleteKetuaTim = () => {
    removeKetuaTim(deleteKetuaTimId);
    setShowDeleteKetuaTimModal(false);
    setSuccessMessage(`Ketua Tim "${deleteKetuaTimName}" berhasil dihapus!`);
    setShowSuccessModal(true);
  };

  const handleAddPPL = () => {
    setFormError(null);
    const { id, namaPPL, alamat, noTelepon } = newPPLData;

    if (!isValidUserId(id)) { setFormError("ID PPL harus diisi!"); return; }
    if (!isValidNamaLengkap(namaPPL)) { setFormError("Nama PPL harus minimal 2 karakter!"); return; }
    if (!isValidAlamat(alamat)) { setFormError("Alamat harus minimal 5 karakter!"); return; }
    if (!isValidTelepon(noTelepon)) { setFormError("No. telepon harus berisi minimal 10 angka!"); return; }
    if (isDuplicatePPLId(id)) { setFormError("ID PPL sudah ada!"); return; }
    if (isDuplicatePPLTelepon(noTelepon)) { setFormError("No. telepon sudah ada!"); return; }

    addPPLAdmin({
      ...newPPLData,
      id: id.trim(),
      namaPPL: namaPPL.trim(),
      alamat: alamat.trim(),
      noTelepon: noTelepon.trim()
    });
    setNewPPLData({ 
        id: "", 
        namaPPL: "", 
        posisi: "Pendataan", 
        totalKegiatan: 0, 
        alamat: "", 
        noTelepon: "", 
        kegiatanDetails: [] 
    });
    setShowAddPPLModal(false);
    setSuccessMessage(`PPL "${namaPPL}" berhasil ditambahkan!`);
    setShowSuccessModal(true);
  };

  const handleEditPPL = () => {
    setFormError(null);
    if (!editPPLData) return;
    const { namaPPL, alamat, noTelepon } = editPPLData;
    
    if (!isValidNamaLengkap(namaPPL)) { setFormError("Nama PPL harus minimal 2 karakter!"); return; }
    if (!isValidAlamat(alamat)) { setFormError("Alamat harus minimal 5 karakter!"); return; }
    if (!isValidTelepon(noTelepon)) { setFormError("No. telepon harus berisi minimal 10 angka!"); return; }
    if (isDuplicatePPLTelepon(noTelepon, editPPLData.id)) { setFormError("No. telepon sudah ada!"); return; }

    updatePPLAdmin(editPPLData.id, { ...editPPLData, namaPPL: namaPPL.trim(), alamat: alamat.trim(), noTelepon: noTelepon.trim() });
    setShowEditPPLModal(false);
    setSuccessMessage(`PPL "${namaPPL}" berhasil diperbarui!`);
    setShowSuccessModal(true);
  };
  
  const handleDeletePPL = () => {
    removePPLAdmin(deletePPLId);
    setShowDeletePPLModal(false);
    setSuccessMessage(`PPL "${deletePPLName}" berhasil dihapus!`);
    setShowSuccessModal(true);
  };

  const openAddUserModal = () => { setFormError(null); setShowAddUserModal(true); };
  const openEditUserModal = (user: UserData) => { setFormError(null); setEditUserData({...user, password: ''}); setShowEditUserModal(true); };
  const openDeleteUserModal = (user: UserData) => { setDeleteUserId(user.id); setDeleteUserName(user.username); setShowDeleteUserModal(true); };
  const openAddKetuaTimModal = () => { setFormError(null); setShowAddKetuaTimModal(true); };
  const openEditKetuaTimModal = (ketuaTim: KetuaTimData) => { setFormError(null); setEditKetuaTimData(ketuaTim); setShowEditKetuaTimModal(true); };
  const openDeleteKetuaTimModal = (ketuaTim: KetuaTimData) => { setDeleteKetuaTimId(ketuaTim.id); setDeleteKetuaTimName(ketuaTim.nama); setShowDeleteKetuaTimModal(true); };
  const openAddPPLModal = () => { setFormError(null); setShowAddPPLModal(true); };
  const openEditPPLModal = (ppl: PPLAdminData) => { setFormError(null); setEditPPLData(ppl); setShowEditPPLModal(true); };
  const openDeletePPLModal = (ppl: PPLAdminData) => { setDeletePPLId(ppl.id); setDeletePPLName(ppl.namaPPL); setShowDeletePPLModal(true); };

  const handleUserSort = (key: keyof UserData) => { let direction: 'asc' | 'desc' = 'asc'; if (userSortConfig?.key === key && userSortConfig.direction === 'asc') { direction = 'desc'; } setUserSortConfig({ key, direction }); };
  const handleKetuaTimSort = (key: keyof KetuaTimData) => { let direction: 'asc' | 'desc' = 'asc'; if (ketuaTimSortConfig?.key === key && ketuaTimSortConfig.direction === 'asc') { direction = 'desc'; } setKetuaTimSortConfig({ key, direction }); };
  const handlePPLSort = (key: keyof PPLAdminData) => { let direction: 'asc' | 'desc' = 'asc'; if (pplSortConfig?.key === key && pplSortConfig.direction === 'asc') { direction = 'desc'; } setPplSortConfig({ key, direction }); };
  
  const getSortIcon = (columnKey: string, sortConfig: any) => {
    if (!sortConfig || sortConfig.key !== columnKey) { return <ChevronUp className="w-4 h-4 text-gray-300" />; }
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };
  
  const filteredAndSortedUsers = useMemo(() => userList.filter(user => user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || user.namaLengkap.toLowerCase().includes(userSearchTerm.toLowerCase())).sort((a, b) => { if (!userSortConfig) return 0; const { key, direction } = userSortConfig; let aValue = a[key] as any; let bValue = b[key] as any; if (typeof aValue === 'string') aValue = aValue.toLowerCase(); if (typeof bValue === 'string') bValue = bValue.toLowerCase(); if (aValue < bValue) return direction === 'asc' ? -1 : 1; if (aValue > bValue) return direction === 'asc' ? 1 : -1; return 0; }), [userList, userSearchTerm, userSortConfig]);
  const filteredAndSortedKetuaTim = useMemo(() => ketuaTimList.filter(kt => kt.nama.toLowerCase().includes(ketuaTimSearchTerm.toLowerCase()) || kt.nip.includes(ketuaTimSearchTerm)).sort((a, b) => { if (!ketuaTimSortConfig) return 0; const { key, direction } = ketuaTimSortConfig; let aValue = a[key] as any; let bValue = b[key] as any; if (typeof aValue === 'string') aValue = aValue.toLowerCase(); if (typeof bValue === 'string') bValue = bValue.toLowerCase(); if (aValue < bValue) return direction === 'asc' ? -1 : 1; if (aValue > bValue) return direction === 'asc' ? 1 : -1; return 0; }), [ketuaTimList, ketuaTimSearchTerm, ketuaTimSortConfig]);
  const filteredAndSortedPPL = useMemo(() => pplAdminList.filter(ppl => ppl.namaPPL.toLowerCase().includes(pplSearchTerm.toLowerCase()) || ppl.id.toLowerCase().includes(pplSearchTerm.toLowerCase()) || ppl.alamat.toLowerCase().includes(pplSearchTerm.toLowerCase()) || ppl.noTelepon.includes(pplSearchTerm)).sort((a, b) => { if (!pplSortConfig) return 0; const { key, direction } = pplSortConfig; let aValue = a[key] as any; let bValue = b[key] as any; if (typeof aValue === 'string') aValue = aValue.toLowerCase(); if (typeof bValue === 'string') bValue = bValue.toLowerCase(); if (aValue < bValue) return direction === 'asc' ? -1 : 1; if (aValue > bValue) return direction === 'asc' ? 1 : -1; return 0; }), [pplAdminList, pplSearchTerm, pplSortConfig]);

  const getRoleBadgeColor = (role: string) => { switch (role) { case 'admin': return 'bg-red-600'; case 'supervisor': return 'bg-blue-600'; case 'user': return 'bg-green-600'; default: return 'bg-gray-600'; } };
  const getRoleIcon = (role: string) => { switch (role) { case 'admin': return <Shield className="w-3 h-3" />; case 'supervisor': return <Crown className="w-3 h-3" />; default: return <Users className="w-3 h-3" />; } };
  
  const userStats = useMemo(() => ({ totalUsers: userList.length, adminUsers: userList.filter(u => u.role === 'admin').length, supervisorUsers: userList.filter(u => u.role === 'supervisor').length, regularUsers: userList.filter(u => u.role === 'user').length }), [userList]);
  const ketuaTimStats = useMemo(() => ({ totalKetuaTim: ketuaTimList.length }), [ketuaTimList]);
  const pplStats = useMemo(() => ({ totalPPL: pplAdminList.length }), [pplAdminList]);


  // PERBAIKAN: Logika paginasi untuk setiap tab
  const paginatedUsers = useMemo(() => {
    const { currentPage, rowsPerPage } = pagination.users;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedUsers, pagination.users]);
  const totalUserPages = Math.ceil(filteredAndSortedUsers.length / pagination.users.rowsPerPage);

  const paginatedKetuaTim = useMemo(() => {
    const { currentPage, rowsPerPage } = pagination.ketuaTim;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedKetuaTim.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedKetuaTim, pagination.ketuaTim]);
  const totalKetuaTimPages = Math.ceil(filteredAndSortedKetuaTim.length / pagination.ketuaTim.rowsPerPage);
  
  const paginatedPPL = useMemo(() => {
    const { currentPage, rowsPerPage } = pagination.ppl;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedPPL.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedPPL, pagination.ppl]);
  const totalPPLPages = Math.ceil(filteredAndSortedPPL.length / pagination.ppl.rowsPerPage);

  const handlePageChange = (tab: 'users' | 'ketuaTim' | 'ppl', newPage: number) => {
    setPagination(prev => ({ ...prev, [tab]: { ...prev[tab], currentPage: newPage } }));
  };

  const handleRowsPerPageChange = (tab: 'users' | 'ketuaTim' | 'ppl', newSize: number) => {
    setPagination(prev => ({ ...prev, [tab]: { currentPage: 1, rowsPerPage: newSize } }));
  };

  const FormError = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{message}</p>
        </div>
    );
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Admin</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna sistem, ketua tim, dan PPL</p>
        </div>

        <Tabs defaultValue="users" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Manajemen Users</TabsTrigger>
            <TabsTrigger value="ketua-tim">Manajemen Ketua Tim</TabsTrigger>
            <TabsTrigger value="ppl">Manajemen PPL</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Users</p><p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
              <Card className="border-l-4 border-l-red-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Admin</p><p className="text-2xl font-bold text-gray-900">{userStats.adminUsers}</p></div><Shield className="w-8 h-8 text-red-500" /></div></CardContent></Card>
              <Card className="border-l-4 border-l-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Supervisor</p><p className="text-2xl font-bold text-gray-900">{userStats.supervisorUsers}</p></div><Crown className="w-8 h-8 text-blue-500" /></div></CardContent></Card>
              <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">User Biasa</p><p className="text-2xl font-bold text-gray-900">{userStats.regularUsers}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Daftar Users</CardTitle>
                  <div className="flex gap-4">
                    <div className="sm:w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input type="text" placeholder="Cari username atau nama..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="pl-10"/></div></div>
                    <Button onClick={openAddUserModal} className="bg-bps-green-600 hover:bg-bps-green-700"><Plus className="w-4 h-4 mr-2" />Tambah User</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[15%]"><button onClick={() => handleUserSort('id')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">ID User{getSortIcon('id', userSortConfig)}</button></TableHead>
                        <TableHead className="w-[20%]"><button onClick={() => handleUserSort('username')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Username{getSortIcon('username', userSortConfig)}</button></TableHead>
                        <TableHead className="w-[30%]"><button onClick={() => handleUserSort('namaLengkap')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Nama Lengkap{getSortIcon('namaLengkap', userSortConfig)}</button></TableHead>
                        <TableHead className="w-[20%]"><button onClick={() => handleUserSort('role')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Role{getSortIcon('role', userSortConfig)}</button></TableHead>
                        <TableHead className="w-[10%]"><button onClick={() => handleUserSort('isPML')} className="flex items-center gap-1">PML{getSortIcon('isPML', userSortConfig)}</button></TableHead>
                        <TableHead className="w-[15%]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{userSearchTerm ? `Tidak ada user yang cocok dengan "${userSearchTerm}"` : 'Belum ada data user'}</TableCell></TableRow>) : (paginatedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium truncate">{user.id}</TableCell>
                            <TableCell className="font-medium truncate">{user.username}</TableCell>
                            <TableCell className="truncate">{user.namaLengkap}</TableCell>
                            <TableCell><Badge variant="default" className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit`}>{getRoleIcon(user.role)}{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></TableCell>
                            <TableCell> 
        {user.isPML ? <Badge>Ya</Badge> : <Badge variant="secondary">Tidak</Badge>}
      </TableCell>
                            <TableCell><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEditUserModal(user)} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4" /></Button><Button variant="outline" size="sm" onClick={() => openDeleteUserModal(user)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">Menampilkan <strong>{paginatedUsers.length}</strong> dari <strong>{filteredAndSortedUsers.length}</strong> data</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><span className="text-sm">Baris per halaman:</span><Select value={String(pagination.users.rowsPerPage)} onValueChange={value => handleRowsPerPageChange('users', Number(value))}><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent></Select></div>
                        <Pagination><PaginationContent><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('users', pagination.users.currentPage - 1)} disabled={pagination.users.currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button></PaginationItem><PaginationItem className="text-sm font-medium px-3">{pagination.users.currentPage} / {totalUserPages}</PaginationItem><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('users', pagination.users.currentPage + 1)} disabled={pagination.users.currentPage === totalUserPages}><ChevronRight className="w-4 h-4" /></Button></PaginationItem></PaginationContent></Pagination>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ketua-tim" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total Ketua Tim</p><p className="text-2xl font-bold text-gray-900">{ketuaTimStats.totalKetuaTim}</p></div><Crown className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
                <Card className="border-l-4 border-l-bps-green-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Ketua Tim Aktif</p><p className="text-2xl font-bold text-gray-900">{ketuaTimStats.totalKetuaTim}</p></div><UserCheck className="w-8 h-8 text-bps-green-500" /></div></CardContent></Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Daftar Ketua Tim</CardTitle>
                        <div className="flex gap-4">
                            <div className="sm:w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input type="text" placeholder="Cari nama atau NIP..." value={ketuaTimSearchTerm} onChange={(e) => setKetuaTimSearchTerm(e.target.value)} className="pl-10"/></div></div>
                            <Button onClick={openAddKetuaTimModal} className="bg-bps-green-600 hover:bg-bps-green-700"><Plus className="w-4 h-4 mr-2"/>Tambah Ketua Tim</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[15%]"><button onClick={() => handleKetuaTimSort('id')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">ID{getSortIcon('id', ketuaTimSortConfig)}</button></TableHead>
                                    <TableHead className="w-[35%]"><button onClick={() => handleKetuaTimSort('nama')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">Nama{getSortIcon('nama', ketuaTimSortConfig)}</button></TableHead>
                                    <TableHead className="w-[25%]"><button onClick={() => handleKetuaTimSort('nip')} className="flex items-center gap-1 hover:bg-gray-100 p-1 rounded -ml-1">NIP{getSortIcon('nip', ketuaTimSortConfig)}</button></TableHead>
                                    <TableHead className="w-[15%]">Status</TableHead>
                                    <TableHead className="w-[10%]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedKetuaTim.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">{ketuaTimSearchTerm ? `Tidak ada ketua tim yang cocok dengan "${ketuaTimSearchTerm}"` : 'Belum ada data ketua tim'}</TableCell></TableRow>) : (paginatedKetuaTim.map((ketuaTim) => (
                                    <TableRow key={ketuaTim.id}>
                                        <TableCell className="font-medium truncate">{ketuaTim.id}</TableCell>
                                        <TableCell className="font-medium truncate">{ketuaTim.nama}</TableCell>
                                        <TableCell className="truncate">{ketuaTim.nip}</TableCell>
                                        <TableCell><Badge variant="default" className="bg-bps-green-600">Aktif</Badge></TableCell>
                                        <TableCell><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEditKetuaTimModal(ketuaTim)} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></Button><Button variant="outline" size="sm" onClick={() => openDeleteKetuaTimModal(ketuaTim)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></Button></div></TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">Menampilkan <strong>{paginatedKetuaTim.length}</strong> dari <strong>{filteredAndSortedKetuaTim.length}</strong> data</div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><span className="text-sm">Baris per halaman:</span><Select value={String(pagination.ketuaTim.rowsPerPage)} onValueChange={value => handleRowsPerPageChange('ketuaTim', Number(value))}><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent></Select></div>
                            <Pagination><PaginationContent><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('ketuaTim', pagination.ketuaTim.currentPage - 1)} disabled={pagination.ketuaTim.currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button></PaginationItem><PaginationItem className="text-sm font-medium px-3">{pagination.ketuaTim.currentPage} / {totalKetuaTimPages}</PaginationItem><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('ketuaTim', pagination.ketuaTim.currentPage + 1)} disabled={pagination.ketuaTim.currentPage === totalKetuaTimPages}><ChevronRight className="w-4 h-4" /></Button></PaginationItem></PaginationContent></Pagination>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          
           <TabsContent value="ppl" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                <Card className="border-l-4 border-l-bps-blue-500"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Total PPL</p><p className="text-2xl font-bold text-gray-900">{pplStats.totalPPL}</p></div><Users className="w-8 h-8 text-bps-blue-500" /></div></CardContent></Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Daftar PPL</CardTitle>
                        <div className="flex gap-4">
                            <div className="sm:w-64"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><Input type="text" placeholder="Cari PPL..." value={pplSearchTerm} onChange={(e) => setPplSearchTerm(e.target.value)} className="pl-10"/></div></div>
                            <Button onClick={openAddPPLModal} className="bg-bps-green-600 hover:bg-bps-green-700"><Plus className="w-4 h-4 mr-2"/>Tambah PPL</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[15%]"><button onClick={() => handlePPLSort('id')} className="flex items-center gap-1">ID{getSortIcon('id', pplSortConfig)}</button></TableHead>
                                    <TableHead className="w-[25%]"><button onClick={() => handlePPLSort('namaPPL')} className="flex items-center gap-1">Nama{getSortIcon('namaPPL', pplSortConfig)}</button></TableHead>
                                    <TableHead className="w-[20%]"><button onClick={() => handlePPLSort('posisi')} className="flex items-center gap-1">Posisi{getSortIcon('posisi', pplSortConfig)}</button></TableHead>
                                    <TableHead className="w-[30%]"><button onClick={() => handlePPLSort('alamat')} className="flex items-center gap-1">Alamat{getSortIcon('alamat', pplSortConfig)}</button></TableHead>
                                    <TableHead className="w-[20%]"><button onClick={() => handlePPLSort('noTelepon')} className="flex items-center gap-1">Telepon{getSortIcon('noTelepon', pplSortConfig)}</button></TableHead>
                                    <TableHead className="w-[10%]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPPL.map(ppl => (
                                    <TableRow key={ppl.id}>
                                        <TableCell className="font-medium truncate">{ppl.id}</TableCell>
                                        <TableCell className="font-medium truncate">{ppl.namaPPL}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                ppl.posisi === 'Pendataan' ? 'default' :
                                                ppl.posisi === 'Pengolahan' ? 'secondary' :
                                                'outline'
                                            }>{ppl.posisi}</Badge>
                                        </TableCell>
                                        <TableCell className="truncate">{ppl.alamat}</TableCell>
                                        <TableCell className="truncate">{ppl.noTelepon}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditPPLModal(ppl)} className="text-blue-600 hover:text-blue-700"><Edit className="w-4 h-4"/></Button>
                                            <Button variant="outline" size="sm" onClick={() => openDeletePPLModal(ppl)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">Menampilkan <strong>{paginatedPPL.length}</strong> dari <strong>{filteredAndSortedPPL.length}</strong> data</div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><span className="text-sm">Baris per halaman:</span><Select value={String(pagination.ppl.rowsPerPage)} onValueChange={value => handleRowsPerPageChange('ppl', Number(value))}><SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}</SelectContent></Select></div>
                            <Pagination><PaginationContent><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('ppl', pagination.ppl.currentPage - 1)} disabled={pagination.ppl.currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button></PaginationItem><PaginationItem className="text-sm font-medium px-3">{pagination.ppl.currentPage} / {totalPPLPages}</PaginationItem><PaginationItem><Button variant="outline" size="sm" onClick={() => handlePageChange('ppl', pagination.ppl.currentPage + 1)} disabled={pagination.ppl.currentPage === totalPPLPages}><ChevronRight className="w-4 h-4" /></Button></PaginationItem></PaginationContent></Pagination>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        
        <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Berhasil!" description={successMessage} actionLabel="OK" onAction={() => setShowSuccessModal(false)} />
        <ConfirmationModal isOpen={showDeleteUserModal} onClose={() => setShowDeleteUserModal(false)} onConfirm={handleDeleteUser} title="Konfirmasi Hapus User" description={`Apakah Anda yakin ingin menghapus user "${deleteUserName}"? Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Ya, Hapus" cancelLabel="Batal" variant="danger" icon={<Trash2 className="w-6 h-6" />}/>
        <ConfirmationModal isOpen={showDeleteKetuaTimModal} onClose={() => setShowDeleteKetuaTimModal(false)} onConfirm={handleDeleteKetuaTim} title="Konfirmasi Hapus Ketua Tim" description={`Apakah Anda yakin ingin menghapus ketua tim "${deleteKetuaTimName}"? Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Ya, Hapus" cancelLabel="Batal" variant="danger" icon={<Trash2 className="w-6 h-6" />}/>
        <ConfirmationModal isOpen={showDeletePPLModal} onClose={() => setShowDeletePPLModal(false)} onConfirm={handleDeletePPL} title="Konfirmasi Hapus PPL" description={`Apakah Anda yakin ingin menghapus PPL "${deletePPLName}"? Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Ya, Hapus" cancelLabel="Batal" variant="danger" icon={<Trash2 className="w-6 h-6" />}/>
        
        {showAddUserModal && <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader><div className="space-y-4 py-4"><FormError message={formError} /><div className="space-y-2"><Label htmlFor="newUserId">ID User *</Label><Input id="newUserId" value={newUserData.id} onChange={(e) => setNewUserData(prev => ({ ...prev, id: e.target.value }))} placeholder="Masukkan ID User (contoh: USR001)"/></div><div className="space-y-2"><Label htmlFor="newUsername">Username *</Label><Input id="newUsername" value={newUserData.username} onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))} placeholder="Masukkan username"/></div><div className="space-y-2"><Label htmlFor="newPassword">Password *</Label><div className="relative"><Input id="newPassword" type={showPassword ? "text" : "password"} value={newUserData.password} onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))} placeholder="Masukkan password (minimal 6 karakter)"/><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div><div className="space-y-2"><Label htmlFor="newNamaLengkap">Nama Lengkap *</Label><Input id="newNamaLengkap" value={newUserData.namaLengkap} onChange={(e) => setNewUserData(prev => ({ ...prev, namaLengkap: e.target.value }))} placeholder="Masukkan nama lengkap"/></div><div className="space-y-2"><Label htmlFor="newRole">Role *</Label><Select value={newUserData.role} onValueChange={(value: 'admin' | 'user' | 'supervisor') => setNewUserData(prev => ({ ...prev, role: value }))}><SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="supervisor">Supervisor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
  <div className="space-y-0.5">
    <Label htmlFor="isPML-new">Status PML</Label>
    <p className="text-[0.8rem] text-muted-foreground">Aktifkan jika user ini adalah seorang PML.</p>
  </div>
  <Switch
    id="isPML-new"
    checked={newUserData.isPML}
    onCheckedChange={(checked) => setNewUserData(prev => ({ ...prev, isPML: checked }))}
  />
</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddUserModal(false)}>Batal</Button><Button onClick={handleAddUser} className="bg-bps-green-600 hover:bg-bps-green-700"><Save className="w-4 h-4 mr-2" />Simpan</Button></div></div></DialogContent></Dialog>}
        {showAddKetuaTimModal && <Dialog open={showAddKetuaTimModal} onOpenChange={setShowAddKetuaTimModal}><DialogContent><DialogHeader><DialogTitle>Tambah Ketua Tim Baru</DialogTitle></DialogHeader><div className="space-y-4 py-4"><FormError message={formError} /><div className="space-y-2"><Label htmlFor="newKetuaTimId">ID Ketua Tim *</Label><Input id="newKetuaTimId" value={newKetuaTimData.id} onChange={(e) => setNewKetuaTimData(prev => ({ ...prev, id: e.target.value }))} placeholder="Masukkan ID Ketua Tim (contoh: KT001)"/></div><div className="space-y-2"><Label htmlFor="newKetuaTimNama">Nama *</Label><Input id="newKetuaTimNama" value={newKetuaTimData.nama} onChange={(e) => setNewKetuaTimData(prev => ({ ...prev, nama: e.target.value }))} placeholder="Masukkan nama ketua tim"/></div><div className="space-y-2"><Label htmlFor="newKetuaTimNip">NIP *</Label><Input id="newKetuaTimNip" value={newKetuaTimData.nip} onChange={(e) => setNewKetuaTimData(prev => ({ ...prev, nip: e.target.value }))} placeholder="Masukkan NIP (minimal 10 karakter)"/></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddKetuaTimModal(false)}>Batal</Button><Button onClick={handleAddKetuaTim} className="bg-bps-green-600 hover:bg-bps-green-700"><Save className="w-4 h-4 mr-2" />Simpan</Button></div></div></DialogContent></Dialog>}
        {showAddPPLModal && <Dialog open={showAddPPLModal} onOpenChange={setShowAddPPLModal}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Tambah PPL Baru</DialogTitle>
        </DialogHeader>
        {/* Konten form dipindahkan kembali ke sini */}
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            {/* ✔️ Pemanggilan FormError yang benar */}
            <FormError message={formError} />

            <div className="space-y-2">
                <Label htmlFor="newPPLId">ID PPL *</Label>
                <Input id="newPPLId" value={newPPLData.id} onChange={(e) => setNewPPLData(prev => ({ ...prev, id: e.target.value }))} placeholder="Contoh: PPL001"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPPLNama">Nama PPL *</Label>
                <Input id="newPPLNama" value={newPPLData.namaPPL} onChange={(e) => setNewPPLData(prev => ({ ...prev, namaPPL: e.target.value }))} placeholder="Masukkan nama PPL"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPPLPosisi">Posisi *</Label>
                <Select value={newPPLData.posisi} onValueChange={(value: PPLAdminData['posisi']) => setNewPPLData(prev => ({ ...prev, posisi: value }))}>
                    <SelectTrigger id="newPPLPosisi"><SelectValue placeholder="Pilih posisi PPL" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pendataan">Pendataan</SelectItem>
                        <SelectItem value="Pengolahan">Pengolahan</SelectItem>
                        <SelectItem value="Pendataan/Pengolahan">Pendataan/Pengolahan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPPLAlamat">Alamat *</Label>
                <Input id="newPPLAlamat" value={newPPLData.alamat} onChange={(e) => setNewPPLData(prev => ({ ...prev, alamat: e.target.value }))} placeholder="Masukkan alamat"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPPLTelepon">No. Telepon *</Label>
                <Input id="newPPLTelepon" value={newPPLData.noTelepon} onChange={(e) => setNewPPLData(prev => ({ ...prev, noTelepon: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="Masukkan no. telepon"/>
            </div>
            
            {/* Dropdown Kecamatan & Desa */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor="newPplKecamatan">Kecamatan</Label>
                    <Select onValueChange={(kecId) => {
                        setNewPPLData(prev => ({ ...prev, kecamatanId: parseInt(kecId), desaId: undefined }));
                        fetchDesa(kecId).then(setDesaOptions);
                    }}>
                        <SelectTrigger><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger>
                        <SelectContent position="popper">{kecamatanList.map(kec => <SelectItem key={kec.id} value={kec.id.toString()}>{kec.nama}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPplDesa">Desa</Label>
                    <Select 
                        value={newPPLData.desaId?.toString()} 
                        onValueChange={(desaId) => setNewPPLData(prev => ({ ...prev, desaId: parseInt(desaId) }))} 
                        disabled={!newPPLData.kecamatanId}
                    >
                        <SelectTrigger><SelectValue placeholder="Pilih desa" /></SelectTrigger>
                        <SelectContent position="popper">{desaOptions.map(desa => <SelectItem key={desa.id} value={desa.id.toString()}>{desa.nama}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddPPLModal(false)}>Batal</Button>
            <Button onClick={handleAddPPL} className="bg-bps-green-600 hover:bg-bps-green-700"><Save className="w-4 h-4 mr-2" />Simpan</Button>
        </div>
    </DialogContent>
</Dialog>}
        
        {editUserData && <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}><DialogContent><DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader><div className="space-y-4 py-4"><FormError message={formError} /><div className="space-y-2"><Label htmlFor="editUsername">Username *</Label><Input id="editUsername" value={editUserData.username} onChange={e => setEditUserData({...editUserData, username: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="editNamaLengkap">Nama Lengkap *</Label><Input id="editNamaLengkap" value={editUserData.namaLengkap} onChange={e => setEditUserData({...editUserData, namaLengkap: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="editPassword">Password (kosongkan jika tidak diubah)</Label><Input id="editPassword" type="password" onChange={e => setEditUserData({...editUserData, password: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="editRole">Role *</Label><Select value={editUserData.role} onValueChange={(value: 'admin' | 'user' | 'supervisor') => setEditUserData({...editUserData, role: value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="supervisor">Supervisor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div><div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
  <div className="space-y-0.5">
    <Label htmlFor="isPML-edit">Status PML</Label>
    <p className="text-[0.8rem] text-muted-foreground">Aktifkan jika user ini adalah seorang PML.</p>
  </div>
  <Switch
    id="isPML-edit"
    checked={editUserData.isPML}
    onCheckedChange={(checked) => setEditUserData({...editUserData, isPML: checked})}
  />
</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowEditUserModal(false)}>Batal</Button><Button onClick={handleEditUser}>Simpan</Button></div></div></DialogContent></Dialog>}
        {editKetuaTimData && <Dialog open={showEditKetuaTimModal} onOpenChange={setShowEditKetuaTimModal}><DialogContent><DialogHeader><DialogTitle>Edit Ketua Tim</DialogTitle></DialogHeader><div className="space-y-4 py-4"><FormError message={formError} /><div className="space-y-2"><Label htmlFor="editKtNama">Nama *</Label><Input id="editKtNama" value={editKetuaTimData.nama} onChange={e => setEditKetuaTimData({...editKetuaTimData, nama: e.target.value})} /></div><div className="space-y-2"><Label htmlFor="editKtNip">NIP *</Label><Input id="editKtNip" value={editKetuaTimData.nip} onChange={e => setEditKetuaTimData({...editKetuaTimData, nip: e.target.value})} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowEditKetuaTimModal(false)}>Batal</Button><Button onClick={handleEditKetuaTim}>Simpan</Button></div></div></DialogContent></Dialog>}
        {editPPLData && <Dialog open={showEditPPLModal} onOpenChange={setShowEditPPLModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit PPL</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4"><FormError message={formError} />
            <div className="space-y-2">
              <Label htmlFor="editPplNama">Nama PPL *</Label>
              <Input id="editPplNama" value={editPPLData.namaPPL} onChange={e => setEditPPLData({...editPPLData, namaPPL: e.target.value})} /></div>
              <div className="space-y-2"><Label htmlFor="editPplAlamat">Alamat *</Label>
              <Input id="editPplAlamat" value={editPPLData.alamat} onChange={e => setEditPPLData({...editPPLData, alamat: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPPLPosisi">Posisi *</Label>
                <Select 
                    value={editPPLData.posisi} 
                    onValueChange={(value: PPLAdminData['posisi']) => setEditPPLData({...editPPLData, posisi: value})}
                >
                    <SelectTrigger id="editPPLPosisi">
                        <SelectValue placeholder="Pilih posisi PPL" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pendataan">Pendataan</SelectItem>
                        <SelectItem value="Pengolahan">Pengolahan</SelectItem>
                        <SelectItem value="Pendataan/Pengolahan">Pendataan/Pengolahan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
              <div className="space-y-2"><Label htmlFor="editPplTelepon">No. Telepon *</Label><Input id="editPplTelepon" value={editPPLData.noTelepon} onChange={e => setEditPPLData({...editPPLData, noTelepon: e.target.value.replace(/[^0-9]/g, '')})} /></div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor="editPplKecamatan">Kecamatan</Label>
                    <Select 
                        value={editPPLData.kecamatanId?.toString()}
                        onValueChange={(kecId) => {
                            setEditPPLData(prev => prev ? {...prev, kecamatanId: parseInt(kecId), desaId: undefined } : null);
                            fetchDesa(kecId).then(setDesaOptions);
                        }}
                    >
                        <SelectTrigger><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger>
                        <SelectContent>{kecamatanList.map(kec => <SelectItem key={kec.id} value={kec.id.toString()}>{kec.nama}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="editPplDesa">Desa</Label>
                    <Select 
                        value={editPPLData.desaId?.toString()} 
                        onValueChange={(desaId) => setEditPPLData(prev => prev ? {...prev, desaId: parseInt(desaId)} : null)}
                        disabled={!editPPLData.kecamatanId}
                        // Muat opsi desa saat modal pertama kali dibuka
                        onOpenChange={(isOpen) => {
                            if (isOpen && editPPLData.kecamatanId && desaOptions.length === 0) {
                                fetchDesa(editPPLData.kecamatanId.toString()).then(setDesaOptions);
                            }
                        }}
                    >
                        <SelectTrigger><SelectValue placeholder="Pilih desa" /></SelectTrigger>
                        <SelectContent>{desaOptions.map(desa => <SelectItem key={desa.id} value={desa.id.toString()}>{desa.nama}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowEditPPLModal(false)}>Batal</Button><Button onClick={handleEditPPL}>Simpan</Button></div></div></DialogContent></Dialog>}
      </div>
    </Layout>
  );
}