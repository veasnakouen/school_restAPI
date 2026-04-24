using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Products.Create;
using SchoolAPI.Application.Features.Products.Delete;
using SchoolAPI.Application.Features.Products.Image;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Application.Features.Products.Update;
using SchoolAPI.Application.Features.Products.GetById;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : BaseController
{
    private readonly ISender _sender;

    public InventoryController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("products")]
    [Authorize(Policy = Permissions.ProductRead)]
    public async Task<IActionResult> GetProducts([FromQuery] GetAllProductsQuery query, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("products/{id}")]
    [Authorize(Policy = Permissions.ProductRead)]
    public async Task<IActionResult> GetProductById(string id, CancellationToken cancellationToken)
    {
        var query = new GetProductByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("products")]
    [Authorize(Policy = Permissions.ProductCreate)]
    public async Task<IActionResult> CreateProduct([FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        var command = new CreateProductCommand(productDto);
        var result = await _sender.Send(command, cancellationToken);

        if (!result.IsSuccess) return HandleResult(result);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("products/{id}")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        var command = new UpdateProductCommand(id, productDto);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("products/{id}")]
    [Authorize(Policy = Permissions.ProductDelete)]
    public async Task<IActionResult> DeleteProduct(string id, CancellationToken cancellationToken)
    {
        var command = new DeleteProductCommand(id);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("products/{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadProductImage(string productId, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        var command = new UploadProductImageCommand(productId, file);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("products/{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProductImage(string productId, CancellationToken cancellationToken)
    {
        var command = new DeleteProductImageCommand(productId);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}