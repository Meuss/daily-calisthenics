import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareBackup(fileName: string, contents: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this phone.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export backup' });
}

/** Some Android file providers report JSON as text or octet-stream, so accept any file and let parseBackup judge it. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).textSync();
}
