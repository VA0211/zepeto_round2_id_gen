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
        // Read the Excel file and convert to JSON
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json<ReviewData>(worksheet);

        // Get total number of items in the original file
        const totalItems = jsonData.length;

        // Filter valid reviewers (ending with snowcorp.com)
        // and remove duplicates using Set
        const validReviewers = [...new Set(
          jsonData
            .filter(row => row.Reviewer.toLowerCase().endsWith('snowcorp.com'))
            .map(row => row.Reviewer)
        )];

        // Get unique Item IDs to ensure no duplicates
        const uniqueItemIds = [...new Set(jsonData.map(row => row['Item ID'].toString()))];
        
        // Calculate distribution
        // - First, determine how many total items to select based on percentage
        // - Then, calculate how many items each reviewer should get
        const totalItemsToSelect = Math.floor(uniqueItemIds.length * (percentage / 100));
        const itemsPerReviewer = Math.floor(totalItemsToSelect / validReviewers.length);
        
        // Randomly shuffle all items for fair distribution
        // Using Fisher-Yates shuffle algorithm via sort with random comparison
        const shuffledItems = [...uniqueItemIds].sort(() => Math.random() - 0.5);
        
        // Distribute items among reviewers
        // Each reviewer gets an equal slice of the shuffled array
        // This ensures random but fair distribution with no overlaps
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