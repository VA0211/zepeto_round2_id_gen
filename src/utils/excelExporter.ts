import { utils, writeFile } from 'xlsx';
import { ProcessedData } from '../types/excel';

export const exportToExcel = (results: ProcessedData[]) => {
  // Convert results to a flat array for Excel
  const excelData = results.flatMap(result => 
    result.itemIds.map(itemId => ({
      Reviewer: result.reviewer,
      'Item ID': itemId
    }))
  );

  // Create workbook and worksheet
  const worksheet = utils.json_to_sheet(excelData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Assignments');

  // Generate and download file
  writeFile(workbook, 'round2.xlsx');
};