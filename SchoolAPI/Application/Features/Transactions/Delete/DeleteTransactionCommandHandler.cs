using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Transactions.Delete;

public class DeleteTransactionCommandHandler : IRequestHandler<DeleteTransactionCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheVersionService _cacheVersionService;

    public DeleteTransactionCommandHandler(IApplicationDbContext context, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result> Handle(DeleteTransactionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TransactionId))
        {
            return Result.Failure("Invalid transaction ID.");
        }

        var transaction = await _context.Transactions.FirstOrDefaultAsync(x => x.Id == request.TransactionId, cancellationToken);
        if (transaction == null)
        {
            return Result.Failure("Transaction not found.");
        }

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("transactions");

        return Result.Success();
    }
}
