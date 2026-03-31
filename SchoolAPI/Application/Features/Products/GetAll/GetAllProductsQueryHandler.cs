using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetAll;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, Result<List<ProductDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllProductsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<ProductDto>>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .OrderByDescending(p => p.CreatedDate)
            .ToListAsync(cancellationToken);

        return Result<List<ProductDto>>.Success(_mapper.Map<List<ProductDto>>(products));
    }
}
