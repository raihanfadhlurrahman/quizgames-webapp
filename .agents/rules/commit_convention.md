# Git Commit & Release Versioning Rule

Setiap kali melakukan commit atau rilis kode pada repository ini, ikuti aturan versi berikut:

## Format Versi: `vX.Y` (misal: v1.0, v1.1, v2.0)

1. **Perubahan Banyak / Gede (Major Release)**:
   - Naikkan versi major **+1** (contoh: `v1.0` -> `v2.0`).
   - Berlaku untuk: Refactoring arsitektur besar, penambahan modul utama baru, overhaul sistem.

2. **Tambahan Fitur Kecil / Perubahan Kecil / Bug Fix (Minor Release)**:
   - Naikkan versi minor **+0.1** (contoh: `v1.0` -> `v1.1`, `v1.1` -> `v1.2`).
   - Berlaku untuk: Penyesuaian UI, perbaikan bug kecil, fitur opsional tambahan, perbaikan layout.

## Format Pesan Commit:
```bash
git commit -m "release vX.Y: [Deskripsi ringkas perubahan]"
git tag -a vX.Y -m "Release vX.Y: [Deskripsi ringkas]"
```
