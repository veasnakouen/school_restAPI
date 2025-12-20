namespace SchoolAPI.DTOs;

public interface IEnrollmentRepository<T> where T : class
{
    Task<T> GetEnrollmentByIdAsync(Guid id);
    Task<List<T>> GetAllEnrollmentsAsync();
    Task AddEnrollmentAsync(T t);
    Task UpdateEnrollmentAsync(T enrollment);
    Task DeleteEnrollmentAsync(Guid id);
}

public interface IEnrollmentsRepository
{
    Task<EnrollmentDto> GetEnrollmentByIdAsync(int id);
    Task<List<EnrollmentDto>> GetAllEnrollmentsAsync();
    Task<CreateAttendanceDto> AddEnrollmentAsync(CreateEnrollmentDto enrollmentDto);
    Task<UpdateEnrollmentDto> UpdateEnrollmentAsync(int id, UpdateEnrollmentDto enrollmentDto);
    Task<UpdateEnrollmentDto> PartialUpdateEnrollmentAsync(int id, PartialUpdateEnrollmentDto enrollmentDto);
    Task<EnrollmentDto> DeleteEnrollmentAsync(int id);
}