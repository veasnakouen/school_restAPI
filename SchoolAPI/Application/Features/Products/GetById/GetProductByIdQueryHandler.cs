using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.GetById;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheStore _cacheStore;
    private readonly ICacheVersionService _cacheVersionService;

    public GetProductByIdQueryHandler(IApplicationDbContext context, IMapper mapper, ICacheStore cacheStore, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _mapper = mapper;
        _cacheStore = cacheStore;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result<ProductDto>.Failure("Invalid product ID.");
        }

        var cacheVersion = _cacheVersionService.GetVersion("products");
        var cacheKey = CacheKeyBuilder.BuildProductByIdKey(cacheVersion, request.ProductId);
        var cachedResult = await _cacheStore.GetAsync<ProductDto>(cacheKey, cancellationToken);
        if (cachedResult != null)
        {
            return Result<ProductDto>.Success(cachedResult);
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        var result = Result<ProductDto>.Success(_mapper.Map<ProductDto>(product));

        await _cacheStore.SetAsync(cacheKey, result.Data, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2), cancellationToken);

        return result;
    }
}
