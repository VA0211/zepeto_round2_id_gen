import { read, utils } from 'xlsx';
import { ReviewData, ProcessedData } from '../types/excel';

export interface ProcessingResult {
  processedData: ProcessedData[];
  totalItems: number;
  uniqueItems: number;
}

export const processExcelFile = async (file: File, percentage: number): Promise<ProcessingResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json<ReviewData>(worksheet);

        // Get total items count
        const totalItems = jsonData.length;

        // Filter reviewers ending with snowcorp.com
        const validReviewers = [...new Set(
          jsonData
            .filter(row => row.Reviewer.toLowerCase().endsWith('snowcorp.com'))
            .map(row => row.Reviewer)
        )];

        // Get unique Item IDs
        const uniqueItemIds = [...new Set(jsonData.map(row => row['Item ID'].toString()))];
        
        // Calculate items per reviewer based on percentage
        const totalItemsToSelect = Math.floor(uniqueItemIds.length * (percentage / 100));
        const itemsPerReviewer = Math.floor(totalItemsToSelect / validReviewers.length);
        
        // Shuffle array
        const shuffledItems = [...uniqueItemIds].sort(() => Math.random() - 0.5);
        
        // Distribute items among reviewers
        const processedData: ProcessedData[] = validReviewers.map((reviewer, index) => ({
          reviewer,
          itemIds: shuffledItems.slice(
            index * itemsPerReviewer,
            (index + 1) * itemsPerReviewer
          )
        }));

        resolve({
          processedData,
          totalItems,
          uniqueItems: uniqueItemIds.length
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
};