/**
 * Local Media Cache (IndexedDB)
 * Menyimpan berkas video lokal secara permanen di perangkat pengguna
 * agar video yang baru saja diunggah SELALU bisa diputar langsung
 * tanpa bergantung pada masa kedaluwarsa URL blob dan tanpa terpengaruh kuota CDN.
 */

const DB_NAME = "karebata_media_store";
const DB_VERSION = 1;
const STORE_NAME = "video_blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB tidak didukung"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalVideoBlob(key: string, blobOrFile: Blob | File): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blobOrFile, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[MediaCache] Gagal menyimpan video ke IndexedDB:", err);
  }
}

export async function getLocalVideoBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[MediaCache] Gagal membaca video dari IndexedDB:", err);
    return null;
  }
}

export async function deleteLocalVideoBlob(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[MediaCache] Gagal menghapus video dari IndexedDB:", err);
  }
}
