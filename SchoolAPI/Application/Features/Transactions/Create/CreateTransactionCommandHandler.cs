using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Transactions.Create;

public class CreateTransactionCommandHandler : IRequestHandler<CreateTransactionCommand, Result<TransactionDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateTransactionCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<TransactionDto>> Handle(CreateTransactionCommand request, CancellationToken cancellationToken)
    {
        if (request.Transaction == null)
        {
            return Result<TransactionDto>.Failure("Transaction data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Transaction.ProductId))
        {
            return Result<TransactionDto>.Failure("Product is required.");
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == request.Transaction.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<TransactionDto>.Failure("Product not found.");
        }

        if (request.Transaction.TransactionType == TransactionType.Purchase && string.IsNullOrWhiteSpace(request.Transaction.ProviderName))
        {
            return Result<TransactionDto>.Failure("Provider name is required for purchase transactions.");
        }

        if (request.Transaction.TransactionType == TransactionType.Donate && string.IsNullOrWhiteSpace(request.Transaction.DonorId))
        {
            return Result<TransactionDto>.Failure("Donor is required for donate transactions.");
        }

        if (request.Transaction.TransactionType == TransactionType.Resource)
        {
            if (string.IsNullOrWhiteSpace(request.Transaction.DepartmentId))
            {
                return Result<TransactionDto>.Failure("Department is required for resource transactions.");
            }

            if (string.IsNullOrWhiteSpace(request.Transaction.Resource))
            {
                return Result<TransactionDto>.Failure("Resource is required for resource transactions.");
            }
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

        var transaction = _mapper.Map<Transaction>(request.Transaction);
        transaction.Id = Guid.NewGuid().ToString();
        transaction.Product = product;
        transaction.TransactionType = request.Transaction.TransactionType;
        transaction.Donor = donor;
        transaction.DonorId = donor != null ? donor.Id : string.Empty;
        transaction.Department = department;
        transaction.DepartmentId = department != null ? department.Id : string.Empty;
        transaction.Responser = responser;
        transaction.ResponserId = responser != null ? responser.Id : string.Empty;
        transaction.CreatedDate = DateTime.UtcNow;
        transaction.UpdateDate = null;

        if (request.Transaction.TransactionType == TransactionType.Purchase)
        {
            transaction.ProviderName = request.Transaction.ProviderName;
        }
        else if (request.Transaction.TransactionType == TransactionType.Donate)
        {
            transaction.ProviderName = donor != null ? donor.Name : string.Empty;
        }
        else
        {
            transaction.ProviderName = department != null ? department.Name : string.Empty;
        }

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<TransactionDto>.Success(_mapper.Map<TransactionDto>(transaction));
    }
}
