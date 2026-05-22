import { google } from 'googleapis';
import { Readable } from 'stream';
import { ReceiptCategory, CATEGORY_FOLDER_MAP } from './types';

const DRIVE_ROOT_FOLDER_NAME = 'Receipts';

function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id || id.startsWith('PASTE_')) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in .env.local');
  return id;
}

function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken || refreshToken.startsWith('PASTE_')) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN must be set in .env.local. Run: node scripts/get-token.mjs'
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/api/auth/callback');
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
}

// Cache folder IDs for the session to avoid repeated API calls
const folderCache = new Map<string, string>();

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    const id = res.data.files[0].id!;
    folderCache.set(cacheKey, id);
    return id;
  }

  // Create the folder inside the parent
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
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

  // Root folder = user-owned folder shared with service account
  const sharedRootId = getRootFolderId();

  // Ensure /Receipts folder exists inside the shared root
  const rootId = await findOrCreateFolder(drive, DRIVE_ROOT_FOLDER_NAME, sharedRootId);

  // Ensure /Receipts/<Category> exists
  const categoryFolderName = CATEGORY_FOLDER_MAP[category];
  const categoryId = await findOrCreateFolder(drive, categoryFolderName, rootId);

  // Ensure /Receipts/<Category>/<YYYY-MM> exists
  const monthId = await findOrCreateFolder(drive, monthLabel, categoryId);

  // Upload file into the month folder (inside user's Drive)
  const stream = Readable.from(buffer);
  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [monthId],
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  const fileId = uploaded.data.id!;
  const fileLink = uploaded.data.webViewLink!;

  // Make the file readable by anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  return {
    fileId,
    fileLink,
    folderId: monthId,
    folderName: `Receipts/${categoryFolderName}/${monthLabel}`,
  };
}
