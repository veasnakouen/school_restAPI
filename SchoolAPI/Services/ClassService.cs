using System.Linq.Expressions;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Data;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Services;

public class ClassService
{
    private const string AcademicsCacheScope = "academics";
    private readonly SchoolDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheStore _cacheStore;
    private readonly ICacheVersionService _cacheVersionService;
    private readonly IPhotoService _photoService;

    public ClassService(SchoolDbContext context, IMapper mapper, ICacheStore cacheStore, ICacheVersionService cacheVersionService, IPhotoService photoService)
    {
        _context = context;
        _mapper = mapper;
        _cacheStore = cacheStore;
        _cacheVersionService = cacheVersionService;
        _photoService = photoService;
    }

    // --- Class CRUD ---
    public async Task<ClassDto> CreateClassAsync(ClassDto classDto)
    {
        if (string.IsNullOrWhiteSpace(classDto.ClassName))
        {
            throw new ArgumentException("Class name is required.");
        }

        var classEntity = _mapper.Map<ClassRoom>(classDto);
        classEntity.Id = Guid.NewGuid();

        _context.Classes.Add(classEntity);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();

        return _mapper.Map<ClassDto>(classEntity);

    }


    public async Task<ActionResult<ClassDto>> GetClassAsync(Guid classId)
    {
        var classEntity = await _context.Classes
            .Include(c => c.Students)
            .FirstOrDefaultAsync(c => c.Id == classId);
        return classEntity == null ? null : _mapper.Map<ClassDto>(classEntity);
    }

    //..../filterOn=Name&filterQuery=Math
    public async Task<PagedResult<ClassDto>> GetAllClasses(
        string? filterOn = null,
        string? filterQuery = null,
        string? sortBy = null,
        bool isAscending = true,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var cacheVersion = _cacheVersionService.GetVersion(AcademicsCacheScope);
        var cacheKey = CacheKeyBuilder.BuildAcademicListKey("classes", cacheVersion, filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
        var cachedResult = await _cacheStore.GetAsync<PagedResult<ClassDto>>(cacheKey);
        if (cachedResult != null)
        {
            return cachedResult;
        }

        var classesQuery = _context.Classes.Include(c => c.Students).AsNoTracking().AsQueryable();

        if (string.IsNullOrWhiteSpace(filterOn) == false && string.IsNullOrWhiteSpace(filterQuery) == false)
        {
            if (filterOn.Equals("ClassName", StringComparison.OrdinalIgnoreCase))
            {
                classesQuery = classesQuery.Where(x => x.ClassName.Contains(filterQuery));
            }
        }

        classesQuery = string.IsNullOrWhiteSpace(sortBy)
            ? classesQuery.OrderBy(x => x.ClassName)
            : sortBy.Equals("ClassName", StringComparison.OrdinalIgnoreCase)
                ? isAscending ? classesQuery.OrderBy(x => x.ClassName) : classesQuery.OrderByDescending(x => x.ClassName)
                : classesQuery.OrderBy(x => x.ClassName);

        var totalCount = await classesQuery.CountAsync();
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var classes = await classesQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<ClassDto>
        {
            Items = _mapper.Map<List<ClassDto>>(classes),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        await _cacheStore.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2));
        return result;
    }

    public async Task<List<ClassDto>> GetAllClassesAsync()
    {
        var classes = await _context.Classes
            .Include(c => c.Students)
            .ToListAsync();
        return _mapper.Map<List<ClassDto>>(classes);
    }

    public async Task<bool> UpdateClassAsync(Guid classId, ClassDto classDto)
    {
        if (classId != classDto.Id || string.IsNullOrWhiteSpace(classDto.ClassName))
        {
            return false;
        }

        var classEntity = await _context.Classes.FindAsync(classId);
        if (classEntity == null)
        {
            return false;
        }

        _mapper.Map(classDto, classEntity);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<bool> DeleteClassAsync(Guid classId)
    {
        // check class existed or not
        var classEntity = await _context.Classes.FindAsync(classId);
        // if null
        if (classEntity == null)
        {
            return false;
        }

        // do remove class from database
        _context.Classes.Remove(classEntity);

        // save change(async) after removing.
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();

        return true;

    }

    // --- Student CRUD ---
    public async Task<StudentDto> CreateStudentAsync(StudentDto studentDto)
    {
        if (string.IsNullOrWhiteSpace(studentDto.EngFirstName) || string.IsNullOrWhiteSpace(studentDto.EngLastName))
        {
            throw new ArgumentException("First and last names are required.");
        }

        var student = _mapper.Map<Student>(studentDto);
        student.Id = Guid.NewGuid();

        // 
        _context.Students.Add(student);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        // syntax : _mapper.Map<DestinationType>(source)
        return _mapper.Map<StudentDto>(student);

    }

    public async Task<StudentDto> GetStudentAsync(Guid studentId)
    {
        var student = await _context.Students
            .Include(s => s.Attendances)
            .FirstOrDefaultAsync(s => s.Id == studentId);
        return student == null ? null : _mapper.Map<StudentDto>(student);
    }

    public async Task<PagedResult<StudentDto>> GetAllStudentsAsync(
        string? filterOn = null,
        string? filterQuery = null,
        string? sortBy = null,
        bool isAscending = true,
        int pageNumber = 1,
        int pageSize = 10)
    {
        var cacheVersion = _cacheVersionService.GetVersion(AcademicsCacheScope);
        var cacheKey = CacheKeyBuilder.BuildAcademicListKey("students", cacheVersion, filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
        var cachedResult = await _cacheStore.GetAsync<PagedResult<StudentDto>>(cacheKey);
        if (cachedResult != null)
        {
            return cachedResult;
        }

        var query = _context.Students
            .Include(s => s.Attendances)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filterOn) && !string.IsNullOrWhiteSpace(filterQuery))
        {
            if (filterOn.Equals("engfirstname", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.EngFirstName.Contains(filterQuery));
            }
            else if (filterOn.Equals("englastname", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.EngLastName.Contains(filterQuery));
            }
            else if (filterOn.Equals("khfirstname", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.KhFirstName.Contains(filterQuery));
            }
            else if (filterOn.Equals("khlastname", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.KhLastName.Contains(filterQuery));
            }
        }

        query = string.IsNullOrWhiteSpace(sortBy)
            ? query.OrderBy(x => x.EngFirstName)
            : sortBy.Equals("engfirstname", StringComparison.OrdinalIgnoreCase)
                ? isAscending ? query.OrderBy(x => x.EngFirstName) : query.OrderByDescending(x => x.EngFirstName)
                : sortBy.Equals("englastname", StringComparison.OrdinalIgnoreCase)
                    ? isAscending ? query.OrderBy(x => x.EngLastName) : query.OrderByDescending(x => x.EngLastName)
                    : query.OrderBy(x => x.EngFirstName);

        var totalCount = await query.CountAsync();
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var students = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<StudentDto>
        {
            Items = _mapper.Map<List<StudentDto>>(students),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        await _cacheStore.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2));
        return result;
    }

    public async Task<bool> UpdateStudentAsync(Guid studentId, StudentDto studentDto)
    {
        if (studentId != studentDto.Id || string.IsNullOrWhiteSpace(studentDto.EngFirstName))
        {
            return false;
        }

        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
        {
            return false;
        }

        _mapper.Map(studentDto, student);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<bool> DeleteStudentAsync(Guid studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
        {
            return false;
        }

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    // --- OutReach CRUD ---
    public async Task<OutReachDto> CreateOutReachAsync(OutReachDto outReachDto)
    {
        if (string.IsNullOrWhiteSpace(outReachDto.FirstName) || string.IsNullOrWhiteSpace(outReachDto.LastName))
        {
            throw new ArgumentException("First and last names are required.");
        }

        var outReach = _mapper.Map<OutReach>(outReachDto);
        outReach.Id = Guid.NewGuid();
        _context.OutReaches.Add(outReach);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return _mapper.Map<OutReachDto>(outReach);
    }

    public async Task<OutReachDto> GetOutReachAsync(Guid outReachId)
    {
        var outReach = await _context.OutReaches
            .Include(o => o.Students)
            .FirstOrDefaultAsync(o => o.Id == outReachId);
        return outReach == null ? null : _mapper.Map<OutReachDto>(outReach);
    }

    public async Task<PagedResult<OutReachDto>> GetAllOutReachAsync(
        string? filterOn = null,
         string? filterQuery = null,
         string? sortBy = null,
          bool IsAscending = true,
           int pageNumber = 1,
            int pageSize = 3)
    {
        var cacheVersion = _cacheVersionService.GetVersion(AcademicsCacheScope);
        var cacheKey = CacheKeyBuilder.BuildAcademicListKey("outreaches", cacheVersion, filterOn, filterQuery, sortBy, IsAscending, pageNumber, pageSize);
        var cachedResult = await _cacheStore.GetAsync<PagedResult<OutReachDto>>(cacheKey);
        if (cachedResult != null)
        {
            return cachedResult;
        }

        var outreachQuery = _context.OutReaches.Include(o => o.Students).AsNoTracking().AsQueryable();
        //filter
        if (string.IsNullOrWhiteSpace(filterOn) == false && string.IsNullOrWhiteSpace(filterQuery) == false)
        {
            if (filterOn.Equals("firstname", StringComparison.OrdinalIgnoreCase))
            {
                outreachQuery = outreachQuery.Where(_ => _.FirstName.Contains(filterQuery));
            }
        }
        // sort
        if (string.IsNullOrWhiteSpace(sortBy) == false)
        {
            //just do filter with firstName field
            if (sortBy.Equals("firstname", StringComparison.OrdinalIgnoreCase))
            {
                outreachQuery = IsAscending ? outreachQuery.OrderBy(_ => _.FirstName) : outreachQuery.OrderByDescending(_ => _.FirstName);
            }
        }
        // pagination
        var skipResults = (pageNumber - 1) * pageSize;

        var totalCount = await outreachQuery.CountAsync();
        var outReaches = await outreachQuery.Skip(skipResults).Take(pageSize).ToListAsync();

        var result = new PagedResult<OutReachDto>
        {
            Items = _mapper.Map<List<OutReachDto>>(outReaches),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        await _cacheStore.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2));
        return result;
    }

    public async Task<bool> UpdateOutReachAsync(Guid outReachId, OutReachDto outReachDto)
    {
        if (outReachId != outReachDto.Id || string.IsNullOrWhiteSpace(outReachDto.FirstName))
        {
            return false;
        }

        var outReach = await _context.OutReaches.FindAsync(outReachId);
        if (outReach == null)
        {
            return false;
        }

        _mapper.Map(outReachDto, outReach);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<bool> DeleteOutReachAsync(Guid outReachId)
    {
        var outReach = await _context.OutReaches.FindAsync(outReachId);
        if (outReach == null)
        {
            return false;
        }

        _context.OutReaches.Remove(outReach);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<StudentDto> UploadStudentImageAsync(Guid studentId, IFormFile file)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
            return null;

        var uploadResult = await _photoService.UploadPhotoAsync(file);
        student.ImageUrl = uploadResult.Url.ToString();
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return _mapper.Map<StudentDto>(student);
    }

    public async Task<OutReachDto> UploadOutReachImageAsync(Guid outReachId, IFormFile file)
    {
        var outReach = await _context.OutReaches.FindAsync(outReachId);
        if (outReach == null)
            return null;

        var uploadResult = await _photoService.UploadPhotoAsync(file);
        outReach.ImageUrl = uploadResult.Url.ToString();
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return _mapper.Map<OutReachDto>(outReach);
    }

    // --- Existing Enrollment and Attendance Methods ---
    public async Task<bool> EnrollStudentAsync(Guid studentId, Guid classId)
    {
        var student = await _context.Students.FindAsync(studentId);
        var classEntity = await _context.Classes.FindAsync(classId);

        if (student == null || classEntity == null)
        {
            return false;
        }

        if (student.ClassId != null)
        {
            //return student.ClassId.Append(classId); 
            // if the properties of classId in student class store as array
            return false;
        }
        //if student's class id is an array of class(classId)
        // student.ClassId = classId[];
        student.ClassId = classId;
        student.Class = classEntity;
        classEntity.Students.Add(student);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<bool> RemoveStudentAsync(Guid studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null || student.ClassId == null)
        {
            return false;
        }

        student.ClassId = null;
        student.Class = null;
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<bool> MarkAttendanceAsync(AttendanceDto attendanceDto)
    {
        var student = await _context.Students.FindAsync(attendanceDto.StudentId);
        var classEntity = await _context.Classes.FindAsync(attendanceDto.ClassId);

        if (student == null || classEntity == null || student.ClassId != attendanceDto.ClassId)
        {
            return false;
        }

        if (await _context.Attendances.AnyAsync(a => a.StudentId == attendanceDto.StudentId
            && a.ClassId == attendanceDto.ClassId
            && a.Date == attendanceDto.Date.Date))
        {
            return false;
        }

        var attendance = _mapper.Map<Attendance>(attendanceDto);
        attendance.Id = Guid.NewGuid();
        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();
        InvalidateAcademicsCache();
        return true;
    }

    public async Task<List<AttendanceDto>> GetStudentAttendanceAsync(Guid studentId, Guid classId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Attendances
            .Where(a => a.StudentId == studentId && a.ClassId == classId);

        if (startDate.HasValue)
        {
            query = query.Where(a => a.Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.Date <= endDate.Value.Date);
        }

        var attendances = await query.ToListAsync();
        return _mapper.Map<List<AttendanceDto>>(attendances);

    }

    public async Task<List<AttendanceDto>> GetClassAttendanceAsync(Guid classId, DateTime date)
    {
        var attendances = await _context.Attendances
            .Where(a => a.ClassId == classId && a.Date == date.Date)
            .Include(a => a.Student)
            .ToListAsync();
        return _mapper.Map<List<AttendanceDto>>(attendances);
    }

    //Note  
    public async Task<bool> ExistClass(ClassRoom classEntity)
    {
        return await _context.Classes.AnyAsync(c => c.ClassName == classEntity.ClassName);
    }
    public async Task<bool> ExistingAsync<T>(Expression<Func<T, bool>> predicate) where T : class
    {
        return await _context.Set<T>().AnyAsync(predicate);
    }

    private void InvalidateAcademicsCache()
    {
        _cacheVersionService.Invalidate(AcademicsCacheScope);
    }

}


