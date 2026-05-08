using AutoMapper;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using System.Linq;

namespace SchoolAPI.Application.Mappings;

public class ProductProfile : Profile
{
    public ProductProfile()
    {
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.ProductName))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.CodeNumber, opt => opt.MapFrom(src => src.CodeNumber))
            
            // Map standard Lookups
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
            .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Brand != null ? src.Brand.Name : null))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
            .ForMember(dest => dest.Quality, opt => opt.MapFrom(src => src.Quality != null ? src.Quality.Name : null))
            
            // Map the Responsible Person
            .ForMember(dest => dest.ResponsiblePersonId, opt => opt.MapFrom(src => src.ResponsiblePersonId))
            .ForMember(dest => dest.ResponsiblePerson, opt => opt.MapFrom(src => src.ResponsiblePerson != null ? src.ResponsiblePerson.FullName : null))
            
            // Map Initial Quantity from Total Quantity
            .ForMember(dest => dest.InitialQuantity, opt => opt.MapFrom(src => src.TotalQuantity))
            
            // Dig into the deeply nested Acquisition / Purchase history using EF-Core-safe LINQ!
            .ForMember(dest => dest.PurchaseType, opt => opt.MapFrom(src => 
                src.PurchaseItems.Select(pi => pi.Purchase!.AcquisitionType).FirstOrDefault() ?? "None"))
                
            .ForMember(dest => dest.VoucherNumber, opt => opt.MapFrom(src => 
                src.PurchaseItems.Select(pi => pi.Purchase!.VoucherNumber).FirstOrDefault()))
                
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => 
                src.PurchaseItems.Select(pi => pi.Purchase!.Supplier!.Name).FirstOrDefault()))

            .ForMember(dest => dest.SupplierContactList, opt => opt.MapFrom(src => 
                src.PurchaseItems.Select(pi => pi.Purchase!.Supplier!.ContactInfo).FirstOrDefault()))
                
            .ForMember(dest => dest.DonorName, opt => opt.MapFrom(src => 
                src.PurchaseItems.Where(pi => pi.Purchase!.Notes != null && pi.Purchase!.Notes.StartsWith("Donor: "))
                                 .Select(pi => pi.Purchase!.Notes!.Substring(7))
                                 .FirstOrDefault()))
                
            .ForMember(dest => dest.InvoiceDate, opt => opt.MapFrom(src => 
                // Let AutoMapper handle the string conversion in memory, EF Core can't translate .ToString("format") to SQL
                src.PurchaseItems.Select(pi => (DateTime?)pi.Purchase!.InvoiceDate).FirstOrDefault()));
    }
}