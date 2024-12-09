export interface ReviewData {
  'Review ID': string | number;
  'Item ID': string | number;
  'Reviewer': string;
}

export interface ProcessedData {
  reviewer: string;
  itemIds: string[];
}