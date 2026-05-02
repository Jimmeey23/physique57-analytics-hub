/**
 * Google Drive Service — disabled in this deployment.
 *
 * Popover content is stored in the notes API instead.
 * Google Drive access requires server-side OAuth (not exposed to the browser).
 */
import { createLogger } from '@/utils/logger';

const logger = createLogger('googleDriveService');

interface PopoverContent {
  [key: string]: {
    [locationId: string]: string;
  };
}

class GoogleDriveService {
  async loadContent(): Promise<PopoverContent> {
    logger.warn('Google Drive popover storage is not available in this deployment.');
    return {};
  }

  async saveContent(_content: PopoverContent): Promise<boolean> {
    logger.warn('Google Drive popover storage is not available in this deployment.');
    return false;
  }

  async getPopoverContent(_context: string, _locationId: string): Promise<string | null> {
    return null;
  }

  async updatePopoverContent(_context: string, _locationId: string, _content: string): Promise<boolean> {
    logger.warn('Google Drive popover storage is not available in this deployment.');
    return false;
  }

  async deletePopoverContent(_context: string, _locationId: string): Promise<boolean> {
    return true;
  }
}

export const googleDriveService = new GoogleDriveService();
