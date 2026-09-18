// Dipisah dari client/pages/InputKegiatan.tsx tanpa mengubah isinya.

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Link2, X, Lock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import useInputKegiatanStore from "@/stores/useInputKegiatanStore";
import { Dokumen } from "@shared/api";

/**
 * Dokumen dan catatan satu tahap.
 *
 * "Tambah Catatan" dulu hanya ada di Edit Kegiatan, sehingga catatan tahap baru
 * bisa ditulis SETELAH kegiatannya tersimpan. Sekarang disamakan: catatan bisa
 * langsung ditulis saat kegiatan dibuat, dan tampil paling atas seperti di
 * halaman Edit.
 */
export const DokumenContent = ({ tipe, title }: { tipe: Dokumen['tipe'], title: string }) => {
    const documents = useInputKegiatanStore(state => state.documents.filter(d => d.tipe === tipe));
    const { addDocumentLink, addCatatan, removeDocument, updateDocument } = useInputKegiatanStore.getState();
    const catatan = documents.filter(d => d.jenis === 'catatan');
    const dokumen = documents.filter(d => d.jenis !== 'catatan');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>Dokumen {title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addCatatan(tipe)} className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />Tambah Catatan
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addDocumentLink(tipe)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />Tambah Dokumen Pendukung
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {catatan.map(doc => (
                    <div key={doc.id} className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/40">
                        <MessageSquare className="w-5 h-5 text-yellow-700 dark:text-yellow-300 mt-1 flex-shrink-0" />
                        <div className="flex-grow space-y-1">
                            <Label className="font-semibold text-yellow-800 dark:text-yellow-300">Catatan</Label>
                            <Textarea
                                placeholder="Tulis catatan untuk tahap ini..."
                                value={doc.nama}
                                rows={3}
                                onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)}
                            />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} title="Hapus Catatan">
                            <X className="w-4 h-4 text-muted-foreground"/>
                        </Button>
                    </div>
                ))}
                {dokumen.map(doc => (
                    <div key={doc.id} className={cn("flex items-center gap-3 p-3 border rounded-lg", doc.isWajib ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" : "bg-muted/50")}>
                        <div className="flex-grow space-y-2">
                            {doc.isWajib ? <Label className="font-semibold">{doc.nama}</Label> : <Input placeholder="Nama Dokumen Pendukung" value={doc.nama} onChange={(e) => updateDocument(doc.id, 'nama', e.target.value)} />}
                            <div className="flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-muted-foreground"/>
                                <Input placeholder="https://drive.google.com/..." value={doc.link} onChange={(e) => updateDocument(doc.id, 'link', e.target.value)} />
                            </div>
                        </div>
                        {!doc.isWajib ? (<Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="self-center"><X className="w-4 h-4 text-muted-foreground"/></Button>) : (<div className="self-center p-2" title="Dokumen Wajib"><Lock className="w-4 h-4 text-muted-foreground"/></div>)}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
