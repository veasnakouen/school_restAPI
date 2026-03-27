using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Azure;

namespace SchoolAPI.Interfaces;

public interface IGenericInterface<T> where T : class
{
    Task<Response> CreateAsync(T entity);
    Task<Response> UpdateAsync(T entity);
    Task<Response> DeleteAsync(T entity);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> FindByIdAsync(int id);
    Task<T> GetByAsync(Expression<Func<T, bool>> predicate);
}
