using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Controllers;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;
using System.Text.Json;


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
            .ForMember(dest => dest.PhoneNumberConfirmed, opt => opt.MapFrom(src => src.PhoneNumberConfirmed));
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
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.ProductName))
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Brand != null ? src.Brand.Name : null))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Image != null ? src.Image.Url : null))
            .ForMember(dest => dest.Quality, opt => opt.MapFrom(src => src.Quality != null ? src.Quality.Name : null))
            .ForMember(dest => dest.Attributes, opt => opt.MapFrom(src => src.Attributes));
        CreateMap<ProductDto, Product>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Attributes, opt => opt.Ignore())
            .ForMember(dest => dest.Quality, opt => opt.Ignore())
            .ForMember(dest => dest.PurchaseItems, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.Ignore())
            .ForMember(dest => dest.Brand, opt => opt.Ignore())
            .ForMember(dest => dest.Image, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CodeNumber, opt => opt.MapFrom(src => src.CodeNumber ?? string.Empty))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description ?? string.Empty));

        CreateMap<Transaction, TransactionDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : string.Empty))
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

        // Purchase mappings
        CreateMap<Purchase, PurchaseDto>()
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.PurchaseItems));

        CreateMap<PurchaseItem, PurchaseItemDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null));

        // ── Advanced Inventory Mappings ──────────────────────────────────
        CreateMap<Person, PersonDto>().ReverseMap();

        CreateMap<StockMovement, StockMovementDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null))
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Direction, opt => opt.MapFrom(src => src.Direction.ToString()));

        CreateMap<AssetAssignment, AssetAssignmentDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src => src.AssignedTo != null ? src.AssignedTo.FullName : null))
            .ForMember(dest => dest.AssignedByName, opt => opt.MapFrom(src => src.AssignedBy != null ? src.AssignedBy.FullName : null))
            .ForMember(dest => dest.ReturnedToName, opt => opt.MapFrom(src => src.ReturnedTo != null ? src.ReturnedTo.FullName : null));

        CreateMap<AssetTransfer, AssetTransferDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.FromPersonName, opt => opt.MapFrom(src => src.FromPerson != null ? src.FromPerson.FullName : null))
            .ForMember(dest => dest.ToPersonName, opt => opt.MapFrom(src => src.ToPerson != null ? src.ToPerson.FullName : null))
            .ForMember(dest => dest.InitiatedByName, opt => opt.MapFrom(src => src.InitiatedBy != null ? src.InitiatedBy.FullName : null))
            .ForMember(dest => dest.AcknowledgedByName, opt => opt.MapFrom(src => src.AcknowledgedBy != null ? src.AcknowledgedBy.FullName : null));

        CreateMap<MaintenanceRecord, MaintenanceRecordDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null))
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.TechnicianName, opt => opt.MapFrom(src => src.Technician != null ? src.Technician.FullName : null));

        CreateMap<WriteOff, WriteOffDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.ProductName : null))
            .ForMember(dest => dest.Reason, opt => opt.MapFrom(src => src.Reason.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedBy != null ? src.RequestedBy.FullName : null))
            .ForMember(dest => dest.ApprovedByName, opt => opt.MapFrom(src => src.ApprovedBy != null ? src.ApprovedBy.FullName : null));
    }
}
