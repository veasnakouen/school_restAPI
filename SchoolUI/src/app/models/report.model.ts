export interface AssessmentLineItem {
  description: string;
  quantity: number;
  price: number;
}

export interface AssessmentRequestForm {
  assessmentNo: string;
  assessmentDate: string;
  refToTicketNo: string;
  itemCode: string;
  subject: string;
  issueDescription: string;
  userName: string;
  departmentName: string;
  brandName: string;
  modelName: string;
  checkedBy: string;
  checkedDate?: string | null;
  items: AssessmentLineItem[];
}

export interface StudentAssessmentRequestForm {
  assessmentNo: string;
  assessmentDate: string;
  studentName: string;
  className: string;
  gender: string;
  dateOfBirth?: string | null;
  requestBy: string;
  departmentName: string;
  subject: string;
  issueDescription: string;
  checkedBy: string;
  checkedDate?: string | null;
  items: AssessmentLineItem[];
}

export interface MonthlyReportQueueResult {
  jobId: string;
  year: number;
  month: number;
  message: string;
}
