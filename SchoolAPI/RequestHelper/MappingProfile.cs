using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;

namespace SchoolAPI.RequestHelper;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // syntax: CreateMap<Source, Destination>(); we create mapping from source to destination
        CreateMap<AuthResponse, UserManager<AppUser>>().ReverseMap();

        // Class mappings
        CreateMap<ClassRoom, ClassDto>()
            .ForMember(dest => dest.Students, opt => opt.MapFrom(src => src.Students));
        // .ForMember(dest => dest.Attendances, opt => opt.MapFrom(src => src.Attendances));
        CreateMap<ClassDto, ClassRoom>()
            .ForMember(dest => dest.Students, opt => opt.Ignore()); // Ignore navigation property when mapping back
                                                                    // .ForMember(dest => dest.Attendances, opt => opt.Ignore());

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
        // .ForMember(dest => dest.Class, opt => opt.Ignore());

        // OutReach mappings
        CreateMap<OutReach, OutReachDto>()
            .ForMember(dest => dest.Students, opt => opt.MapFrom(src => src.Students));
        CreateMap<OutReachDto, OutReach>()
            .ForMember(dest => dest.Students, opt => opt.Ignore());

        CreateMap<AppUser, AuthResponse>();
        CreateMap<AppUser, AuthResponse>();
        CreateMap<RegisterRequest, AppUser>();
        CreateMap<AppUser, UserDetail>()
            .ForMember(dest => dest.Roles, opt => opt.Ignore())
            .ForMember(dest => dest.PhoneNumberConfirm, opt => opt.MapFrom(src => src.PhoneNumberConfirmed));

    }
}

