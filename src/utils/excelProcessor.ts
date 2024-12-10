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

        // Step 1: Filter out duplicate Item IDs by keeping only the newest record
        const newestItems = jsonData.reduce((acc, row) => {
          const itemId = row['Item ID'].toString();
          const reviewDate = new Date(row['Review Updated At']);

          if (!acc[itemId] || new Date(acc[itemId]['Review Updated At']) < reviewDate) {
            acc[itemId] = row; // Keep the newest record
          }

          return acc;
        }, {} as Record<string, ReviewData>);

        const filteredData = Object.values(newestItems);

        // Get unique number of items
        const uniqueItems = filteredData.length;

        // Step 3: Filter valid reviewers (ending with snowcorp.com)
        const validReviewers = [
          ...new Set(
            filteredData
              .filter((row) => row.Reviewer.toLowerCase().endsWith('snowcorp.com'))
              .map((row) => row.Reviewer)
          ),
        ];

        // Step 4: Group items by reviewer
        const itemsByReviewer: Record<string, string[]> = validReviewers.reduce((acc, reviewer) => {
          acc[reviewer] = filteredData
            .filter((row) => row.Reviewer === reviewer)
            .map((row) => row['Item ID'].toString());
          return acc;
        }, {} as Record<string, string[]>);

        // Step 5: Calculate the total items to select for each reviewer
        const processedData: ProcessedData[] = [];

        validReviewers.forEach((reviewer) => {
          const items = itemsByReviewer[reviewer] || [];

          // Shuffle the items
          const shuffledItems = items.sort(() => Math.random() - 0.5);

          // Determine how many items to select for this reviewer based on percentage
          const itemsToSelect = Math.floor((filteredData.length * (percentage / 100))/validReviewers.length);

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
