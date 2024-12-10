import { read, utils } from 'xlsx';
import { ReviewData, ProcessedData } from '../types/excel';

export interface ProcessingResult {
  processedData: ProcessedData[];
  totalItems: number;
  uniqueItems: number;
}

export const processExcelFile = async (
  file: File,
  percentage: number
): Promise<ProcessingResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // Read the Excel file and convert to JSON
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json<ReviewData>(worksheet);

        // Get total number of items in the original file
        const totalItems = jsonData.length;

        // Filter valid reviewers (ending with snowcorp.com)
        const validReviewers = [
          ...new Set(
            jsonData
              .filter((row) => row.Reviewer.toLowerCase().endsWith('snowcorp.com'))
              .map((row) => row.Reviewer)
          ),
        ];

        // Group items by reviewer
        const itemsByReviewer: Record<string, string[]> = validReviewers.reduce((acc, reviewer) => {
          acc[reviewer] = jsonData
            .filter((row) => row.Reviewer === reviewer)
            .map((row) => row['Item ID'].toString());
          return acc;
        }, {} as Record<string, string[]>);

        // Calculate the total items to select for each reviewer
        const processedData: ProcessedData[] = [];
        let uniqueItems = 0;

        validReviewers.forEach((reviewer) => {
          const items = itemsByReviewer[reviewer] || [];
          uniqueItems += items.length;

          // Shuffle the items
          const shuffledItems = items.sort(() => Math.random() - 0.5);

          // Determine how many items to select for this reviewer based on percentage
          const itemsToSelect = Math.floor(shuffledItems.length * (percentage / 100));

          // Add to processed data
          processedData.push({
            reviewer,
            itemIds: shuffledItems.slice(0, itemsToSelect),
          });
        });

        resolve({
          processedData,
          totalItems,
          uniqueItems,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
};
