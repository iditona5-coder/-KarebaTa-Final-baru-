/**
 * ImageKit Integration Service
 * Endpoint: https://ik.imagekit.io/rdyi1j1sg
 */

export interface ImageKitUploadResult {
  url: string;
  thumbnailUrl: string;
  fileId: string;
  name: string;
}

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_AUTH_HEADER = 'Basic ' + btoa('private_Hfxv7O6OPu7fA8wOA03WgNaxMKY=:');

/**
 * Uploads media (File, Blob, or base64) directly to ImageKit CDN.
 * Bekerja langsung baik di localhost maupun di Firebase Hosting publik (https://kareba-ta-728d0.web.app).
 */
export function isVideoMedia(nameOrType: string): boolean {
  return (
    /\.(mp4|mov|webm|mkv|3gp|avi|m4v)(\?.*)?$/i.test(nameOrType) ||
    nameOrType.startsWith("video/") ||
    nameOrType.includes(".mp4")
  );
}

export function normalizeMediaUrl(url: string | undefined, isVideo = false): string {
  if (!url) return "";
  if (url.includes("ik.imagekit.io")) {
    const isVid = isVideo || isVideoMedia(url) || url.includes("/karebata/kareba_");
    if (isVid) {
      // Hapus query transformasi gambar (seperti ?tr=w-500) dan pastikan tr=orig-true aktif
      const clean = url.replace(/[?&]tr=[^&]*/g, "").replace(/\?$/, "");
      const separator = clean.includes("?") ? "&" : "?";
      return clean.includes("tr=orig-true") ? clean : `${clean}${separator}tr=orig-true`;
    }
  }
  return url;
}

/**
 * Uploads media (File, Blob, or base64) directly to ImageKit CDN.
 * Bekerja langsung baik di localhost maupun di Firebase Hosting publik.
 */
export async function uploadToImageKit(
  fileData: File | Blob | string,
  fileName?: string,
  folder = '/karebata'
): Promise<ImageKitUploadResult> {
  const isVideo =
    (typeof fileData !== "string" && (fileData as any).type?.startsWith("video/")) ||
    (fileName ? isVideoMedia(fileName) : false);

  const finalFileName =
    fileName ||
    `kareba_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${isVideo ? "mp4" : "jpg"}`;

  try {
    // 1. Langsung unggah ke ImageKit Cloud API (Mendukung upload langsung dari browser ke CDN)
    const formData = new FormData();
    if (typeof fileData === "string") {
      formData.append('file', fileData);
    } else {
      formData.append('file', fileData, finalFileName);
    }
    formData.append('fileName', finalFileName);
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'true');
    formData.append('tags', 'karebata,warga_feed');

    const directRes = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: IMAGEKIT_AUTH_HEADER,
      },
      body: formData,
    });

    if (directRes.ok) {
      const data = await directRes.json();
      console.log('[ImageKit] Berhasil diunggah ke CDN publik:', data.url);
      const isResultVideo = isVideo || data.fileType === "non-image" || isVideoMedia(data.name || finalFileName);
      const finalUrl = isResultVideo ? normalizeMediaUrl(data.url, true) : data.url;
      return {
        url: finalUrl,
        thumbnailUrl: !isResultVideo && data.url ? (data.thumbnailUrl || `${data.url}?tr=w-500,fo-auto`) : (data.thumbnailUrl || ''),
        fileId: data.fileId || '',
        name: data.name || finalFileName,
      };
    }

    console.warn('[ImageKit Direct] Status:', directRes.status, 'mencoba fallback server lokal...');
  } catch (directErr) {
    console.warn('[ImageKit Direct] Terjadi kendala jaringan:', directErr);
  }

  // 2. Fallback: Coba melalui rute server lokal (/api/upload) jika tersedia
  try {
    let payloadFile: string | undefined = undefined;
    if (typeof fileData === 'string') {
      payloadFile = fileData;
    } else if (fileData instanceof Blob) {
      // Ubah File/Blob ke base64 agar rute Express JSON dapat menerimanya
      payloadFile = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileData);
      });
    }

    if (payloadFile) {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: payloadFile,
          fileName: finalFileName,
          folder,
          tags: ['karebata', 'warga_feed'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const isResultVideo = isVideo || data.fileType === "non-image" || isVideoMedia(data.name || finalFileName);
        const finalUrl = isResultVideo ? normalizeMediaUrl(data.url, true) : data.url;
        return {
          url: finalUrl,
          thumbnailUrl: data.thumbnailUrl || (isResultVideo ? '' : finalUrl),
          fileId: data.fileId || '',
          name: data.name || finalFileName,
        };
      }
    }
  } catch (proxyErr) {
    console.warn('[ImageKit Proxy] Gagal:', proxyErr);
  }

  // 3. Fallback darurat lokal agar antarmuka tidak macet
  const fallbackUrl = typeof fileData === 'string' ? fileData : '';
  return {
    url: fallbackUrl,
    thumbnailUrl: fallbackUrl,
    fileId: `local-${Date.now()}`,
    name: finalFileName,
  };
}

/**
 * Menghapus file media dari ImageKit CDN
 */
export async function deleteFromImageKit(fileId?: string): Promise<boolean> {
  if (!fileId || fileId.startsWith('local-')) return false;

  try {
    const directRes = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: IMAGEKIT_AUTH_HEADER,
      },
    });

    if (directRes.ok || directRes.status === 204 || directRes.status === 200) {
      console.log(`[ImageKit] File ${fileId} berhasil dihapus dari ImageKit CDN`);
      return true;
    }
  } catch (err) {
    console.warn('[ImageKit Direct] Gagal menghapus file:', err);
  }

  // Fallback via server
  try {
    const res = await fetch(`/api/media/${fileId}`, { method: 'DELETE' });
    return res.ok;
  } catch (proxyErr) {
    return false;
  }
}
