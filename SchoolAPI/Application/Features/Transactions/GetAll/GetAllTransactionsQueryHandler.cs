using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public class GetAllTransactionsQueryHandler : IRequestHandler<GetAllTransactionsQuery, Result<List<TransactionDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllTransactionsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<TransactionDto>>> Handle(GetAllTransactionsQuery request, CancellationToken cancellationToken)
    {
        var transactions = await _context.Transactions
            .Include(x => x.Product)
            .Include(x => x.Donor)
            .Include(x => x.Department)
            .Include(x => x.Responser)
            .OrderByDescending(x => x.CreatedDate)
            .ToListAsync(cancellationToken);

        return Result<List<TransactionDto>>.Success(_mapper.Map<List<TransactionDto>>(transactions));
    }
}
