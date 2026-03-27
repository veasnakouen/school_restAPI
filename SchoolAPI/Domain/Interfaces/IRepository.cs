using SchoolAPI.Domain.Entities;

namespace SchoolAPI.Domain.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<bool> ExistsAsync(Guid id);
}

public interface IUnitOfWork : IDisposable
{
    IRepository<ClassRoom> Classes { get; }
    IRepository<Student> Students { get; }
    IRepository<OutReach> OutReaches { get; }
    IRepository<Attendance> Attendances { get; }
    Task<int> SaveChangesAsync();
}
