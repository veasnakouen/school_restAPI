import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';
import {
  AssessmentRequestForm,
  MonthlyReportQueueResult,
  StudentAssessmentRequestForm
} from '../../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  constructor(private readonly api: ApiClientService) {}

  downloadMonthlyPdf(year: number, month: number) {
    return this.api.getBlob(`reports/monthly-transactions/${year}/${month}`);
  }

  downloadMonthlyExcel(year: number, month: number) {
    return this.api.getBlob(`reports/monthly-transactions/${year}/${month}/excel`);
  }

  enqueueMonthly(year: number, month: number) {
    return this.api.post<MonthlyReportQueueResult>(`reports/monthly-transactions/${year}/${month}/enqueue`, {});
  }

  assessmentPdf(request: AssessmentRequestForm) {
    return this.api.postBlob('assessment-reports/pdf', request);
  }

  assessmentExcel(request: AssessmentRequestForm) {
    return this.api.postBlob('assessment-reports/excel', request);
  }

  studentAssessmentPdf(request: StudentAssessmentRequestForm) {
    return this.api.postBlob('assessment-reports/student/pdf', request);
  }

  studentAssessmentExcel(request: StudentAssessmentRequestForm) {
    return this.api.postBlob('assessment-reports/student/excel', request);
  }
}
