using System.Linq.Expressions;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Data;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;

public class ClassService
{
    private readonly SchoolDbContext _context;
    private readonly IMapper _mapper;

    public ClassService(SchoolDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
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

        return _mapper.Map<ClassDto>(classEntity);

    }


    public async Task<ActionResult<ClassDto>> GetClassAsync(Guid classId)
    {
        var classEntity = await _context.Classes
            .Include(c => c.Students)
            .FirstOrDefaultAsync(c => c.Id == classId);
        return classEntity == null ? null : _mapper.Map<ClassDto>(classEntity);
    }

    public async Task<IEnumerable<ClassDto>> GetAllClasses()
    {
        // get all classes with students included
        var classes = await _context.Classes
            .Include(c => c.Students)
            .ToListAsync();

        return _mapper.Map<List<ClassDto>>(classes);
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

    public async Task<List<StudentDto>> GetAllStudentsAsync()
    {
        var students = await _context.Students
            .Include(s => s.Attendances)
            // .AsNoTracking()
            .ToListAsync();
        return _mapper.Map<List<StudentDto>>(students);
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
        _context.OutReach.Add(outReach);
        await _context.SaveChangesAsync();
        return _mapper.Map<OutReachDto>(outReach);
    }

    public async Task<OutReachDto> GetOutReachAsync(Guid outReachId)
    {
        var outReach = await _context.OutReach
            .Include(o => o.Students)
            .FirstOrDefaultAsync(o => o.Id == outReachId);
        return outReach == null ? null : _mapper.Map<OutReachDto>(outReach);
    }

    public async Task<List<OutReachDto>> GetAllOutReachAsync()
    {
        var outReaches = await _context.OutReach
            .Include(o => o.Students)
            .ToListAsync();
        return _mapper.Map<List<OutReachDto>>(outReaches);
    }

    public async Task<bool> UpdateOutReachAsync(Guid outReachId, OutReachDto outReachDto)
    {
        if (outReachId != outReachDto.Id || string.IsNullOrWhiteSpace(outReachDto.FirstName))
        {
            return false;
        }

        var outReach = await _context.OutReach.FindAsync(outReachId);
        if (outReach == null)
        {
            return false;
        }

        _mapper.Map(outReachDto, outReach);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteOutReachAsync(Guid outReachId)
    {
        var outReach = await _context.OutReach.FindAsync(outReachId);
        if (outReach == null)
        {
            return false;
        }

        _context.OutReach.Remove(outReach);
        await _context.SaveChangesAsync();
        return true;
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
        var existing = _context.Classes.AnyAsync(c => c.ClassName == classEntity.ClassName);
        // var existing2 =  _context.Classes.AnyAsync(c => c.Id == classEntity.Id);
        // var result =  Task.WhenAll(existing, existing2);
        // return result.Result.Any(r => r == true);
        return existing.Result;

    }
    public async Task<bool> ExistingAsync<T>(Expression<Func<T, bool>> predicate) where T : class
    {
        return await _context.Set<T>().AnyAsync(predicate);
    }

}


