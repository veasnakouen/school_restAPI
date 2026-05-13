using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace SchoolAPI.Interfaces;

public interface IGenericInterface<T> where T : class
{
    Task<bool> CreateAsync(T entity);
    Task<bool> UpdateAsync(T entity);
    Task<bool> DeleteAsync(T entity);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> FindByIdAsync(Guid id);
    Task<T> GetByAsync(Expression<Func<T, bool>> predicate);
}
