// Dipisah dari client/pages/EditActivity.tsx tanpa mengubah isinya.

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageSquare } from "lucide-react";
import { Dokumen } from "@shared/api";
import { ClientDokumen, FormState } from "@/components/edit-kegiatan/tipeEditKegiatan";
import { DokumenItem } from "@/components/edit-kegiatan/DokumenItem";

/**
 * Daftar dokumen satu tahap.
 *
 * DIDEFINISIKAN DI LUAR `EditActivity`, dan itu bukan sekadar kerapian: saat ia
 * masih berada di dalam badan komponen, React melihat TIPE komponen yang baru
 * pada setiap render `EditActivity`, lalu memasang ulang seluruh subpohonnya.
 * Semua state baris dokumen tereset setiap kali `formData` berubah — itulah
 * sebabnya tombol "Selesai" dulu tampak tidak melakukan apa-apa: namanya
 * sebenarnya masuk, tapi barisnya langsung dipasang ulang ke keadaan awal.
 */
export const DokumenContent = ({ tipe, title, dokumen, setFormData, kegiatanId, onNoteClick }: {
    tipe: Dokumen['tipe'];
    title: string;
    dokumen: ClientDokumen[];
    setFormData: React.Dispatch<React.SetStateAction<Partial<FormState>>>;
    kegiatanId: number;
    onNoteClick: (doc: ClientDokumen) => void;
}) => {
    const documents = useMemo(
        () => (dokumen || []).filter(d => d.tipe === tipe).sort((a) => (a.jenis === 'catatan' ? -1 : 1)),
        [dokumen, tipe]);

    const [barusanDitambah, setBarusanDitambah] = useState<string | null>(null);
    useEffect(() => {
        if (!barusanDitambah) return;
        const timer = setTimeout(() => setBarusanDitambah(null), 2500);
        return () => clearTimeout(timer);
    }, [barusanDitambah]);

    /**
     * Penghapusan hanya dilakukan di state form. Barisnya baru benar-benar
     * hilang dari database saat "Simpan Perubahan" ditekan: `updateKegiatan`
     * membuang dokumen tidak wajib yang tidak lagi ikut terkirim.
     *
     * Dulu ini langsung memanggil DELETE, sehingga dokumen sudah lenyap
     * permanen sebelum pengguna sempat berubah pikiran — dan "Batalkan
     * Perubahan" tidak bisa mengembalikannya.
     */
    const removeDocument = (clientId: string) => {
        setFormData(prev => ({
            ...prev,
            dokumen: prev.dokumen?.filter(d => d.clientId !== clientId)
        }));
    };

    /**
     * Menggabung, bukan menimpa: tiap kotak isian menyetor bidangnya sendiri
     * saat ditinggalkan, jadi setoran nama tidak boleh mengembalikan link ke
     * nilai lama yang masih terbawa di props baris itu.
     */
    const handleDocumentSaved = (perubahan: Partial<Dokumen>, clientId: string) => {
        setFormData(prev => ({
            ...prev,
            dokumen: prev.dokumen?.map(d => d.clientId === clientId ? { ...d, ...perubahan } : d),
        }));
    };

    const addDocument = () => {
        const clientId = `new-doc-${Date.now()}`;
        const newDoc: ClientDokumen = {
            clientId,
            kegiatanId,
            tipe,
            nama: "", link: "", jenis: 'link', isWajib: false,
            status: 'Pending', uploadedAt: new Date().toISOString()
        };
        setFormData(prev => ({ ...prev, dokumen: [...(prev.dokumen || []), newDoc] }));
        setBarusanDitambah(clientId);
        // Barisnya baru ada di DOM setelah render berikutnya, jadi penggulirannya
        // ditunda satu tick. Fokus langsung ke kotak namanya: itu satu-satunya
        // bidang yang wajib diisi sebelum kegiatan bisa disimpan.
        setTimeout(() => {
            const baris = document.querySelector(`[data-doc-id="${clientId}"]`);
            baris?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            baris?.querySelector('input')?.focus({ preventScroll: true });
        }, 60);
    };

    const addNote = () => {
        const newNoteTemplate: ClientDokumen = {
            clientId: `new-note-${Date.now()}`,
            kegiatanId,
            tipe,
            nama: "", // Isi catatan akan diisi di modal
            link: "",
            jenis: 'catatan',
            isWajib: false,
            status: 'Pending',
            uploadedAt: new Date().toISOString()
        };
        // Langsung buka modal untuk catatan baru
        onNoteClick(newNoteTemplate);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={addNote} className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />Tambah Catatan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addDocument} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />Tambah Dokumen
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Konsekuensi dari penundaan: tanpa keterangan ini, tidak ada
                    apa pun di layar yang memberi tahu bahwa isian dokumen belum
                    tersimpan sampai tombol di bawah halaman ditekan. */}
                <p className="text-xs text-muted-foreground">
                    Penambahan, penghapusan, dan penyuntingan dokumen maupun catatan
                    di sini baru tersimpan setelah Anda menekan <strong>Simpan Perubahan</strong>
                    {' '}di bawah halaman.
                </p>
                {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada dokumen atau catatan.</p>}
                {documents.map(doc => (
                    <DokumenItem
                        key={doc.clientId}
                        doc={doc}
                        removeDocument={removeDocument}
                        onDocumentSaved={handleDocumentSaved}
                        onNoteClick={onNoteClick}
                        disorot={doc.clientId === barusanDitambah}
                    />
                ))}
            </CardContent>
        </Card>
    );
};
