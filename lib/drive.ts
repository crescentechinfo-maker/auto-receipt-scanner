import { google } from 'googleapis';
import { Readable } from 'stream';
import { ReceiptCategory, CATEGORY_FOLDER_MAP } from './types';

const DRIVE_ROOT_FOLDER_NAME = 'Receipts';

function getDriveClient() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

// Cache folder IDs for the session to avoid repeated API calls
const folderCache = new Map<string, string>();

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string
): Promise<string> {
  const cacheKey = `${parentId ?? 'root'}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  const query = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    const id = res.data.files[0].id!;
    folderCache.set(cacheKey, id);
    return id;
  }

  // Create the folder
  const folderMeta: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) folderMeta.parents = [parentId];

  const folder = await drive.files.create({
    requestBody: folderMeta,
    fields: 'id',
  });

  const newId = folder.data.id!;
  folderCache.set(cacheKey, newId);
  return newId;
}

export interface DriveUploadResult {
  fileId: string;
  fileLink: string;
  folderId: string;
  folderName: string;
}

export async function uploadToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  category: ReceiptCategory,
  monthLabel: string // e.g. "2026-05"
): Promise<DriveUploadResult> {
  const drive = getDriveClient();

  // Ensure /Receipts root exists
  const rootId = await findOrCreateFolder(drive, DRIVE_ROOT_FOLDER_NAME);

  // Ensure /Receipts/<Category> exists
  const categoryFolderName = CATEGORY_FOLDER_MAP[category];
  const categoryId = await findOrCreateFolder(drive, categoryFolderName, rootId);

  // Ensure /Receipts/<Category>/<YYYY-MM> exists
  const monthId = await findOrCreateFolder(drive, monthLabel, categoryId);

  // Upload file
  const stream = Readable.from(buffer);
  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [monthId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  });

  const fileId = uploaded.data.id!;
  const fileLink = uploaded.data.webViewLink!;

  // Make the file readable by anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId,
    fileLink,
    folderId: monthId,
    folderName: `Receipts/${categoryFolderName}/${monthLabel}`,
  };
}
