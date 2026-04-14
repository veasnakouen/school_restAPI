using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Controllers;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;


namespace SchoolAPI.RequestHelper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Class mappings
        CreateMap<ClassRoom, ClassDto>()
            .ForMember(dest => dest.Students, opt => opt.MapFrom(src => src.Students));
        CreateMap<ClassDto, ClassRoom>()
            .ForMember(dest => dest.Students, opt => opt.Ignore());

        // Student mappings
        CreateMap<Student, StudentDto>()
            .ForMember(dest => dest.Age, opt => opt.MapFrom(src => src.Age))
            .ForMember(dest => dest.ClassId, opt => opt.MapFrom(src => src.ClassId))
            .ForMember(dest => dest.OutReachId, opt => opt.MapFrom(src => src.OutReachId))
            .ForMember(dest => dest.Attendances, opt => opt.MapFrom(src => src.Attendances));

        CreateMap<StudentDto, Student>()
            .ForMember(dest => dest.Class, opt => opt.Ignore())
            .ForMember(dest => dest.OutReach, opt => opt.Ignore())
            .ForMember(dest => dest.Attendances, opt => opt.Ignore());

        // Attendance mappings
        CreateMap<Attendance, AttendanceDto>();
        CreateMap<AttendanceDto, Attendance>()
            .ForMember(dest => dest.Student, opt => opt.Ignore());

        // OutReach mappings
        CreateMap<OutReach, OutReachDto>()
            .ForMember(dest => dest.Students, opt => opt.MapFrom(src => src.Students));
        CreateMap<OutReachDto, OutReach>()
            .ForMember(dest => dest.Students, opt => opt.Ignore());

        // Auth mappings
        CreateMap<AppUser, AuthResponse>();
        CreateMap<RegisterRequest, AppUser>();
        CreateMap<AppUser, UserDetail>()
            .ForMember(dest => dest.Roles, opt => opt.Ignore())
            .ForMember(dest => dest.PhoneNumberConfirm, opt => opt.MapFrom(src => src.PhoneNumberConfirmed));
        CreateMap<AppUser, UserListItemDto>();
        CreateMap<Brand, BrandDto>();
        CreateMap<BrandDto, Brand>();
        CreateMap<Category, CategoryDto>();
        CreateMap<CategoryDto, Category>();
        CreateMap<Department, DepartmentDto>();
        CreateMap<DepartmentDto, Department>();
        CreateMap<Donor, DonorDto>();
        CreateMap<DonorDto, Donor>();
        CreateMap<Responser, ResponserDto>();
        CreateMap<ResponserDto, Responser>();
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Brand != null ? src.Brand.Name : null))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Image != null ? src.Image.Url : null));
        CreateMap<ProductDto, Product>()
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Brand, opt => opt.Ignore())
            .ForMember(dest => dest.Image, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdateDate, opt => opt.Ignore())
            .ForMember(dest => dest.CodeNumber, opt => opt.MapFrom(src => src.CodeNumber ?? string.Empty))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description ?? string.Empty))
            .ForMember(dest => dest.Quality, opt => opt.MapFrom(src => src.Quality ?? string.Empty))
            .ForMember(dest => dest.VoucherNumber, opt => opt.MapFrom(src => src.VoucherNumber ?? string.Empty));

        CreateMap<Transaction, TransactionDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : string.Empty))
            .ForMember(dest => dest.DonorName, opt => opt.MapFrom(src => src.Donor != null ? src.Donor.Name : string.Empty))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : string.Empty))
            .ForMember(dest => dest.ResponserName, opt => opt.MapFrom(src => src.Responser != null ? src.Responser.Name : string.Empty))
            .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.CreatedDate ?? DateTime.UtcNow))
            .ForMember(dest => dest.UpdateDate, opt => opt.MapFrom(src => src.UpdateDate ?? DateTime.UtcNow));
        CreateMap<TransactionDto, Transaction>()
            .ForMember(dest => dest.Product, opt => opt.Ignore())
            .ForMember(dest => dest.Donor, opt => opt.Ignore())
            .ForMember(dest => dest.Department, opt => opt.Ignore())
            .ForMember(dest => dest.Responser, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdateDate, opt => opt.Ignore());
    }
}

