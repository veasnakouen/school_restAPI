using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Transactions.Update;

public class UpdateTransactionCommandHandler : IRequestHandler<UpdateTransactionCommand, Result<TransactionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateTransactionCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<TransactionDto>> Handle(UpdateTransactionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TransactionId))
        {
            return Result<TransactionDto>.Failure("Invalid transaction ID.");
        }

        if (request.Transaction == null)
        {
            return Result<TransactionDto>.Failure("Transaction data is required.");
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

        var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == request.Transaction.ProductId, cancellationToken);
        if (product == null)
        {
            return Result<TransactionDto>.Failure("Product not found.");
        }

        Donor donor = null;
        if (!string.IsNullOrWhiteSpace(request.Transaction.DonorId))
        {
            donor = await _context.Donors.FirstOrDefaultAsync(x => x.Id == request.Transaction.DonorId, cancellationToken);
            if (donor == null)
            {
                return Result<TransactionDto>.Failure("Donor not found.");
            }
        }

        Department department = null;
        if (!string.IsNullOrWhiteSpace(request.Transaction.DepartmentId))
        {
            department = await _context.Departments.FirstOrDefaultAsync(x => x.Id == request.Transaction.DepartmentId, cancellationToken);
            if (department == null)
            {
                return Result<TransactionDto>.Failure("Department not found.");
            }
        }

        Responser responser = null;
        if (!string.IsNullOrWhiteSpace(request.Transaction.ResponserId))
        {
            responser = await _context.Responsers.FirstOrDefaultAsync(x => x.Id == request.Transaction.ResponserId, cancellationToken);
            if (responser == null)
            {
                return Result<TransactionDto>.Failure("Responser not found.");
            }
        }

        if (request.Transaction.TransactionType == TransactionType.Purchase && string.IsNullOrWhiteSpace(request.Transaction.ProviderName))
        {
            return Result<TransactionDto>.Failure("Provider name is required for purchase transactions.");
        }

        if (request.Transaction.TransactionType == TransactionType.Donate && donor == null)
        {
            return Result<TransactionDto>.Failure("Donor is required for donate transactions.");
        }

        if (request.Transaction.TransactionType == TransactionType.Resource)
        {
            if (department == null)
            {
                return Result<TransactionDto>.Failure("Department is required for resource transactions.");
            }

            if (string.IsNullOrWhiteSpace(request.Transaction.Resource))
            {
                return Result<TransactionDto>.Failure("Resource is required for resource transactions.");
            }
        }

        transaction.Product = product;
        transaction.ProductId = product.Id;
        transaction.TransactionType = request.Transaction.TransactionType;
        transaction.ProviderName = request.Transaction.TransactionType == TransactionType.Purchase
            ? request.Transaction.ProviderName
            : request.Transaction.TransactionType == TransactionType.Donate
                ? donor != null ? donor.Name : string.Empty
                : department != null ? department.Name : string.Empty;
        transaction.Donor = donor;
        transaction.DonorId = donor != null ? donor.Id : string.Empty;
        transaction.Department = department;
        transaction.DepartmentId = department != null ? department.Id : string.Empty;
        transaction.Responser = responser;
        transaction.ResponserId = responser != null ? responser.Id : string.Empty;
        transaction.Resource = request.Transaction.Resource ?? string.Empty;
        transaction.Quantity = request.Transaction.Quantity;
        transaction.TotalCost = request.Transaction.TotalCost;
        transaction.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<TransactionDto>.Success(_mapper.Map<TransactionDto>(transaction));
    }
}
