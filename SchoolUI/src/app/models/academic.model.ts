export type Gender = 'Female' | 'Male' | 'Other';

export interface AttendanceDto {
  studentId?: string;
  classId?: string;
  date?: string;
  status?: string;
}

export interface StudentDto {
  id: string;
  khLastName: string;
  khFirstName: string;
  engLastName: string;
  engFirstName: string;
  gender: Gender;
  dateOfBirth: string;
  age?: number | null;
  classId?: string | null;
  outReachId?: string | null;
  attendances: AttendanceDto[];
}

export interface ClassDto {
  id: string;
  className: string;
  students: StudentDto[];
}

export interface OutReachDto {
  id: string;
  firstName: string;
  lastName: string;
  nickName?: string | null;
  contact?: string | null;
  students: StudentDto[];
}
