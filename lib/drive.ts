import { google } from 'googleapis';
import { Readable } from 'stream';
import { ReceiptCategory, ReceiptGroup, CATEGORY_GROUP_MAP } from './types';

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
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN must be set in .env.local');
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/api/auth/callback');
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
}

const folderCache = new Map<string, string>();

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    const id = res.data.files[0].id!;
    folderCache.set(cacheKey, id);
    return id;
  }

  const folder = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
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
  group: ReceiptGroup;
}

export async function uploadToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  category: ReceiptCategory,
  monthLabel: string
): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const group = CATEGORY_GROUP_MAP[category];

  // Folder structure: <root>/<Group>/<Category>/<YYYY-MM>/
  const rootId = getRootFolderId();
  const groupId = await findOrCreateFolder(drive, group, rootId);
  const categoryId = await findOrCreateFolder(drive, category, groupId);
  const monthId = await findOrCreateFolder(drive, monthLabel, categoryId);

  const stream = Readable.from(buffer);
  const uploaded = await drive.files.create({
    requestBody: { name: fileName, parents: [monthId] },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  });

  const fileId = uploaded.data.id!;
  const fileLink = uploaded.data.webViewLink!;

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId,
    fileLink,
    folderId: monthId,
    folderName: `${group}/${category}/${monthLabel}`,
    group,
  };
}
