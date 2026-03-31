using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetById;

public class GetTransactionByIdQueryHandler : IRequestHandler<GetTransactionByIdQuery, Result<TransactionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTransactionByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<TransactionDto>> Handle(GetTransactionByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TransactionId))
        {
            return Result<TransactionDto>.Failure("Invalid transaction ID.");
        }

        var transaction = await _context.Transactions
            .Include(x => x.Product)
            .Include(x => x.Donor)
            .Include(x => x.Department)
            .Include(x => x.Responser)
            .FirstOrDefaultAsync(x => x.Id == request.TransactionId, cancellationToken);

        if (transaction == null)
        {
            return Result<TransactionDto>.Failure("Transaction not found.");
        }

        return Result<TransactionDto>.Success(_mapper.Map<TransactionDto>(transaction));
    }
}
