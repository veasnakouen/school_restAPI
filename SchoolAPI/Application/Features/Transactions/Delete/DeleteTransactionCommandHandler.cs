using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Transactions.Delete;

public class DeleteTransactionCommandHandler : IRequestHandler<DeleteTransactionCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteTransactionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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

        return Result.Success();
    }
}
