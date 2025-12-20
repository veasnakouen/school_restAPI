using MediatR;

public record CreateClassCommand(string ClassName) : IRequest<Guid>;//with MediatR
// public record CreateClassCommand(string ClassName); // without MediatR

